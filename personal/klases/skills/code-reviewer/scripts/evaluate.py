"""Record and check artifacts from reviewer invocations on a trusted Unix host."""

from contextlib import contextmanager
import argparse
import fcntl
import hashlib
import json
import math
import os
import re
import stat
import tempfile
import time
from pathlib import Path


def _digest(value):
    encoded = json.dumps(value, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(encoded).hexdigest()


def _regular_files(root):
    if root.is_symlink() or root.absolute() != root.resolve():
        raise ValueError(f"symlink or noncanonical directory: {root}")
    if not root.is_dir():
        raise ValueError(f"expected directory: {root}")

    def visit(directory):
        for path in sorted(directory.iterdir()):
            mode = path.lstat().st_mode
            if stat.S_ISLNK(mode):
                raise ValueError(f"symlink: {path}")
            if stat.S_ISDIR(mode):
                yield from visit(path)
            elif stat.S_ISREG(mode):
                yield path
            else:
                raise ValueError(f"expected regular file: {path}")

    yield from visit(root)


def artifact_manifest(root):
    root = Path(root)
    files = {}
    for path in _regular_files(root):
        with path.open("rb") as stream:
            files[path.relative_to(root).as_posix()] = hashlib.file_digest(stream, "sha256").hexdigest()
    return {"files": files, "sha256": _digest(files)}


def expected_runs(cases, versions):
    if not isinstance(versions, dict) or set(versions) != set("ABC"):
        raise ValueError("versions must specify A, B and C")
    for value in versions.values():
        _require_hash(value)
    if not isinstance(cases, list) or len(cases) != 20:
        raise ValueError("expected 20 cases")
    ids, heads = set(), set()
    splits = {"dev": 0, "holdout": 0}
    plan = {}
    for case in cases:
        if not isinstance(case, dict):
            raise ValueError("case must be an object")
        case_id = case.get("id")
        if not _matches(case_id, r"[A-Za-z0-9_-]+"):
            raise ValueError("invalid case id")
        head = case.get("head")
        parents = case.get("parents")
        if not isinstance(parents, list) or len(parents) != 1:
            raise ValueError(f"{case_id}: expected one parent")
        if not all(_matches(oid, r"(?:[a-fA-F0-9]{40}|[a-fA-F0-9]{64})")
                   for oid in (head, parents[0])) or len(head) != len(parents[0]):
            raise ValueError(f"{case_id}: expected full Git IDs of the same length")
        if head.lower() == parents[0].lower():
            raise ValueError(f"{case_id}: head equals parent")
        if case_id in ids or head.lower() in heads:
            raise ValueError("expected distinct case IDs and heads")
        ids.add(case_id)
        heads.add(head.lower())
        split = case.get("split")
        if split not in ("dev", "holdout"):
            raise ValueError(f"{case_id}: invalid split")
        splits[split] += 1
        input_hash = case.get("input_hash")
        _require_hash(input_hash)
        for variant, version_hash in versions.items():
            plan[f"{case_id}/{variant}"] = dict(input_hash=input_hash, version_hash=version_hash)
    if splits != {"dev": 15, "holdout": 5}:
        raise ValueError("expected 15 dev and 5 holdout cases")
    return plan


def _matches(value, pattern):
    return isinstance(value, str) and re.fullmatch(pattern, value) is not None


def _require_hash(value):
    if not _matches(value, r"[a-f0-9]{64}"):
        raise ValueError("expected lowercase SHA256")


@contextmanager
def _locked(path):
    # Lock a stable sibling inode, since each committed state replaces the ledger inode.
    lock = path.with_name(path.name + ".lock")
    fd = os.open(lock, os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600)
    with os.fdopen(fd, "r+") as stream:
        fcntl.flock(stream, fcntl.LOCK_EX)
        yield


def _write_state(path, state):
    fd, temporary = tempfile.mkstemp(dir=path.parent, prefix=f".{path.name}.")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as stream:
            json.dump(state, stream, indent=2)
            stream.write("\n")
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
        directory = os.open(path.parent, os.O_RDONLY | os.O_DIRECTORY)
        try:
            os.fsync(directory)
        finally:
            os.close(directory)
    finally:
        Path(temporary).unlink(missing_ok=True)


def init_budget(path, max_count, deadline):
    """Create a ledger once at this path, using an absolute Unix time in seconds."""
    if type(max_count) is not int or max_count <= 0:
        raise ValueError("max_count must be a positive integer")
    if type(deadline) not in (int, float) or not math.isfinite(deadline):
        raise ValueError("deadline must be a finite Unix timestamp")
    path = Path(path)
    with _locked(path):
        if path.exists() or path.is_symlink():
            raise FileExistsError(path)
        _write_state(path, dict(max_count=max_count, deadline=deadline, attempts=[]))


def reserve(path, run_key, kind):
    """Durably consume one invocation immediately before the caller launches it."""
    if not _nonempty(run_key) or not _nonempty(kind):
        raise ValueError("run_key and kind must be nonempty strings")
    path = Path(path)
    with _locked(path):
        if path.is_symlink():
            raise ValueError("symlink ledger")
        state = _read_json(path)
        now = time.time()
        if now >= state["deadline"]:
            raise ValueError("invocation deadline reached")
        attempts = state["attempts"]
        if len(attempts) >= state["max_count"]:
            raise ValueError("invocation count exhausted")
        attempts.append(dict(run_key=run_key, kind=kind, reserved_at=now))
        _write_state(path, state)
        if time.time() >= state["deadline"]:
            raise ValueError("invocation deadline reached during reservation")
        return len(attempts)


def _read_json(path):
    def unique_object(pairs):
        obj = {}
        for key, value in pairs:
            if key in obj:
                raise ValueError(f"duplicate JSON key: {key}")
            obj[key] = value
        return obj

    return json.loads(Path(path).read_text(encoding="utf-8"), object_pairs_hook=unique_object)


def _nonempty(value):
    return isinstance(value, str) and bool(value.strip())


# A defect is rated by impact; a maintainability suggestion by how strongly it is advised.
RATING_BY_KIND = {
    "defect": ("severity", ("critical", "high", "medium", "low")),
    "maintainability": ("priority", ("should", "consider", "nit")),
}


def validate_candidates(candidates):
    if not isinstance(candidates, list):
        raise ValueError("candidates must be a list")
    seen = set()
    retained = set()
    duplicates = []
    for candidate in candidates:
        if not isinstance(candidate, dict):
            raise ValueError("candidate must be an object")
        identity = candidate.get("id")
        if not _nonempty(identity) or identity in seen:
            raise ValueError("candidates require distinct nonempty IDs")
        seen.add(identity)
        disposition = candidate.get("disposition")
        if disposition not in ("retain", "duplicate", "reject", "unresolved"):
            raise ValueError(f"{identity}: invalid disposition")
        if not _nonempty(candidate.get("evidence")):
            raise ValueError(f"{identity}: evidence or reason required")
        kind = candidate.get("kind", "defect")
        if kind not in RATING_BY_KIND:
            raise ValueError(f"{identity}: invalid kind")
        rating, values = RATING_BY_KIND[kind]
        other_rating = {"severity": "priority", "priority": "severity"}[rating]
        if other_rating in candidate:
            raise ValueError(f"{identity}: {kind} takes {rating}, not {other_rating}")
        if disposition == "retain":
            retained.add(identity)
            dimensions = {
                rating: values,
                "confidence": ("high", "medium", "low"),
                "evidence_type": ("static", "observed", "mixed"),
            }
            for field, allowed in dimensions.items():
                if candidate.get(field) not in allowed:
                    raise ValueError(f"{identity}: invalid {field}")
        if disposition == "duplicate":
            duplicates.append((identity, candidate.get("parent")))
        elif "parent" in candidate:
            raise ValueError(f"{identity}: parent requires duplicate disposition")
    for identity, parent in duplicates:
        if not _nonempty(parent) or parent not in retained:
            raise ValueError(f"{identity}: duplicate needs a retained parent")


def reconcile(expected, reports_root):
    hashes = ("input_hash", "version_hash")
    if not isinstance(expected, dict) or not expected:
        raise ValueError("expected a nonempty run-key mapping")
    for key, record in expected.items():
        if not _nonempty(key) or not isinstance(record, dict):
            raise ValueError("invalid expected run")
        for field in hashes:
            _require_hash(record.get(field))

    result = {name: {} for name in ("complete", "blocked", "failed", "duplicate", "extra", "invalid")}
    paths = {}
    statuses = {}
    root = Path(reports_root)
    for path in _regular_files(root):
        if path.suffix != ".json":
            continue
        relative = path.relative_to(root).as_posix()
        try:
            report = _read_json(path)
            if not isinstance(report, dict) or not _nonempty(report.get("run_key")):
                raise ValueError("report needs a run_key")
            key = report["run_key"]
            paths.setdefault(key, []).append(relative)
            status = report.get("status")
            if status not in ("complete", "blocked", "failed"):
                raise ValueError("invalid status")
            for field in hashes:
                value = report.get(field)
                _require_hash(value)
                if key in expected and value != expected[key][field]:
                    raise ValueError(f"{field} mismatch")
            if status == "complete":
                validate_candidates(report.get("candidates"))
            elif not _nonempty(report.get("reason")):
                raise ValueError(f"{status} requires a reason")
            statuses[relative] = status
        except (OSError, ValueError) as error:
            result["invalid"][relative] = str(error)

    result["missing"] = sorted(expected.keys() - paths.keys())
    for key, occurrences in sorted(paths.items()):
        if key not in expected:
            result["extra"][key] = occurrences
        if len(occurrences) > 1:
            result["duplicate"][key] = occurrences
        elif key in expected and occurrences[0] in statuses:
            result[statuses[occurrences[0]]][key] = occurrences[0]
    return result


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("hash").add_argument("directory")
    plan = commands.add_parser("plan")
    plan.add_argument("cases")
    plan.add_argument("versions")
    check = commands.add_parser("reconcile")
    check.add_argument("expected")
    check.add_argument("reports")
    try:
        args = parser.parse_args(argv)
        if args.command == "hash":
            result = artifact_manifest(args.directory)
        elif args.command == "plan":
            result = expected_runs(_read_json(args.cases), _read_json(args.versions))
        else:
            result = reconcile(_read_json(args.expected), args.reports)
    except (OSError, ValueError) as error:
        parser.error(str(error))
    print(json.dumps(result, indent=2, sort_keys=True))
    return int(args.command == "reconcile" and any(
        values for category, values in result.items() if category != "complete"
    ))


if __name__ == "__main__":
    raise SystemExit(main())
