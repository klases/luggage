# Reviewer evaluation recorder

Use this tool from a trusted Unix workspace with Python 3.11 or newer. Keep manifests, ledgers and reports in private evaluation state. The recorder has no model, runner, provider or target execution integration.

## Comparison design

Freeze 20 distinct non-merge commits and authorized source snapshots. Select 15 development and 5 held-out cases before tuning. Record scope, aspects, exact Git IDs, historically applicable task and policy, permissions, selection rationale and prior exposure in the private case metadata. Independently verify Git parentage. The recorder validates the supplied parent list and ID syntax. Record missing requirements and prior exposure with results.

Compare A (compact), B (selective specialists) and C (investigate then challenge) using the same input per case. Hash the actual loaded instructions, agents and references. Log which artifacts were loaded, the activation path and the actual permissions. Keep revisions immutable and record any method change and its regression check. Freeze comparison versions before holdout. If held-out cases influence tuning, mark them exposed. A subsequent all-case regression sweep and workflow smoke checks are separate evidence.

Independently inspect candidate traces, counterevidence and observed checks. Compare supported and missed findings, false positives, disposition integrity, scope and observable cost. Agreement and finding counts do not establish correctness. Schema acceptance establishes bookkeeping only. Record blocked checks and unavailable host runtime. Review source by default. Any authorized target execution requires verified disposable, credential-free containment with filesystem, network and resource controls.

## CLI

From the skill directory:

```sh
python3 scripts/evaluate.py hash /path/to/frozen-artifact
python3 scripts/evaluate.py plan /path/to/cases.json /path/to/versions.json
python3 scripts/evaluate.py reconcile /path/to/expected.json /path/to/reports
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s scripts -v
```

The three recorder commands emit JSON on stdout; unittest discovery emits the standard test report. Save `plan` output as the expected mapping. Reconciliation exits **0** for all expected reports complete with no anomalies, **1** for incomplete or anomalous coverage, and **2** for bad command input or unsafe directory contents.

## Python API and files

Import `evaluate` from `scripts/`.

- `artifact_manifest(root)` returns `files` (relative POSIX paths to lowercase SHA256) and `sha256` (the SHA256 of that map serialized as compact, sorted JSON with ASCII escaping). Use stable, trusted directory trees and canonical directory paths. Symlinks and special files are rejected. This tool assumes the tree stays fixed while reading.
- `expected_runs(cases, versions)` accepts a JSON-compatible list of objects with `id` (letters, digits, underscore or hyphen), `head` (full 40- or 64-hex Git ID), `parents` (one full Git ID of the same length), `split` (`dev` or `holdout`) and `input_hash` (lowercase SHA256). Extra case metadata is allowed. The version object has exactly the keys A, B and C, with lowercase SHA256 values. The returned mapping uses `case-id/A`-style keys and entries with `input_hash` and `version_hash`. The input hash should bind source identity, scope, task, policy, aspects and execution permissions.
- `init_budget(path, max_count, deadline)` creates one ledger in an existing private directory. Set the agreed ceiling, for example 120 and the evaluation start time plus 28,800 seconds. `deadline` is absolute Unix time. Existing ledgers cannot be reinitialized through the API.
- `reserve(path, run_key, kind)` checks both limits under a sibling file lock and appends the attempt using an atomic replacement with file and directory synchronization. It returns a one-based attempt number. Call it immediately before every launch, including specialists, challengers and retries. Failed launches still consume a reservation. Never reuse a reservation or delete, replace or reset the ledger or its lock. Use one absolute ledger path on a filesystem that supports these guarantees. The trusted launcher must recheck the deadline at launch if delayed after reservation and must enforce the deadline for running work. The recorder does not launch or terminate anything. Keep failed attempt logs separately.
- `reconcile(expected, reports_root)` reads each `.json` recursively in a dedicated report directory. Each report must contain `run_key`, `input_hash`, `version_hash` and `status`. Use `complete` with a `candidates` list, or `blocked` / `failed` with a nonempty `reason`. Use one selected report per expected key and keep attempt history outside the report directory. Other stages can use their own expected mapping with the same hash fields. The result includes `complete`, `blocked` and `failed` maps to report paths, `duplicate` and `extra` maps to lists of paths, an `invalid` map from paths to errors, and a `missing` key list. A known key with only invalid reports is incomplete and appears under `invalid`. Hash matching checks supplied identities against the plan. The caller must hash the actual loaded artifacts and record those hashes.
- `validate_candidates(candidates)` requires a unique nonempty `id`, `disposition` and nonempty `evidence` text per object. Use `retain`, `duplicate`, `reject` or `unresolved`. A duplicate identifies a direct retained `parent` in the same report. A retained candidate also requires `severity` (critical, high, medium, low), `confidence` (high, medium, low) and `evidence_type` (static, observed, mixed). With an independently preserved raw inventory, compare the candidate IDs to check that none disappeared during synthesis.

Evaluation artifacts, corpus selection, comparative runs and review adjudication are external to the recorder.
