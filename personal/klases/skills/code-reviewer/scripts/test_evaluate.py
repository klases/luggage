import hashlib
import json
import tempfile
import time
import unittest
from pathlib import Path

import evaluate


class HarnessTest(unittest.TestCase):
    def setUp(self):
        scratch = tempfile.TemporaryDirectory()
        self.addCleanup(scratch.cleanup)
        self.root = Path(scratch.name).resolve()

    def test_manifest_hashes_relative_files_and_rejects_escape(self):
        (self.root / "nested").mkdir()
        (self.root / "nested" / "skill").write_bytes(b"review")
        manifest = evaluate.artifact_manifest(self.root)
        self.assertEqual(manifest["files"], {
            "nested/skill": hashlib.sha256(b"review").hexdigest(),
        })
        (self.root / "escape").symlink_to(self.root.parent)
        with self.assertRaisesRegex(ValueError, "symlink"):
            evaluate.artifact_manifest(self.root)

    def test_case_plan_requires_matched_distinct_nonmerge_splits(self):
        cases = [
            dict(id=f"case-{i}", head=f"{i + 1:040x}", parents=["f" * 40],
                 split="dev" if i < 15 else "holdout", input_hash=f"{i:064x}")
            for i in range(20)
        ]
        versions = {variant: variant.lower() * 64 for variant in "ABC"}
        plan = evaluate.expected_runs(cases, versions)
        self.assertEqual(len(plan), 60)
        self.assertEqual(plan["case-0/A"], {"input_hash": cases[0]["input_hash"],
                                             "version_hash": versions["A"]})
        mutations = [
            (dict(head=cases[1]["head"]), "distinct"),
            (dict(parents=["f" * 40, "e" * 40]), "one parent"),
            (dict(head="abc123"), "Git ID"),
            (dict(split="holdout"), "15 dev"),
        ]
        for change, message in mutations:
            with self.subTest(change=change), self.assertRaisesRegex(ValueError, message):
                evaluate.expected_runs([cases[0] | change, *cases[1:]], versions)
        with self.assertRaisesRegex(ValueError, "A, B and C"):
            evaluate.expected_runs(cases, {"A": versions["A"]})

    def test_budget_survives_retries_refuses_reset_and_checks_deadline(self):
        ledger = self.root / "ledger.json"
        evaluate.init_budget(ledger, 3, time.time() + 60)
        self.assertEqual(evaluate.reserve(ledger, "case/A", "review"), 1)
        self.assertEqual(evaluate.reserve(ledger, "case/A", "retry"), 2)
        self.assertEqual(evaluate.reserve(ledger, "case/A", "specialist"), 3)
        with self.assertRaises(FileExistsError):
            evaluate.init_budget(ledger, 99, time.time() + 100)
        with self.assertRaisesRegex(ValueError, "count"):
            evaluate.reserve(ledger, "case/B", "review")
        expired = self.root / "expired.json"
        evaluate.init_budget(expired, 1, time.time() - 1)
        with self.assertRaisesRegex(ValueError, "deadline"):
            evaluate.reserve(expired, "case/A", "review")

    def test_candidates_require_evidence_and_direct_retained_duplicate_parent(self):
        retained = dict(id="one", disposition="retain", severity="high",
                        confidence="medium", evidence_type="static",
                        evidence="The caller drops the error at src/api.py:12.")
        duplicate = dict(id="two", disposition="duplicate", parent="one",
                         evidence="The same caller drops the same error.")
        evaluate.validate_candidates([duplicate, retained])
        for candidates, message in [
            ([retained | {"evidence_type": None}], "evidence_type"),
            ([retained | {"confidence": None}], "confidence"),
            ([duplicate], "retained parent"),
            ([retained, duplicate | {"parent": "two"}], "retained parent"),
            ([retained, retained], "distinct"),
            ([dict(id="three", disposition="reject", evidence=" ")], "evidence"),
        ]:
            with self.subTest(candidates=candidates), self.assertRaisesRegex(ValueError, message):
                evaluate.validate_candidates(candidates)

    def test_maintainability_candidates_take_a_priority_instead_of_a_severity(self):
        suggestion = dict(id="M1", kind="maintainability", disposition="retain",
                          priority="should", confidence="high", evidence_type="static",
                          evidence="priceFor() reads the DB and applies rules at src/price.ts:40.")
        defect = dict(id="F1", kind="defect", disposition="retain", severity="low",
                      confidence="high", evidence_type="static",
                      evidence="The retry log drops orderId at src/retry.ts:9.")
        evaluate.validate_candidates([suggestion, defect])
        for candidates, message in [
            ([suggestion | {"priority": "high"}], "priority"),
            ([suggestion | {"severity": "low"}], "severity"),
            ([defect | {"priority": "should"}], "priority"),
            ([suggestion | {"kind": "style"}], "kind"),
        ]:
            with self.subTest(candidates=candidates), self.assertRaisesRegex(ValueError, message):
                evaluate.validate_candidates(candidates)

    def test_empty_expected_run_map_cannot_certify_a_review(self):
        with self.assertRaisesRegex(ValueError, "nonempty"):
            evaluate.reconcile({}, self.root)

    def test_reconcile_counts_actual_files_and_rejects_hash_drift(self):
        hashes = dict(input_hash="a" * 64, version_hash="b" * 64)
        expected = {key: hashes for key in ("ok", "twice", "no", "blocked", "drift", "failed")}
        for i, (key, status) in enumerate([
            ("ok", "complete"), ("twice", "complete"), ("twice", "complete"),
            ("blocked", "blocked"), ("extra", "complete"), ("drift", "complete"),
            ("failed", "failed"),
        ]):
            report = dict(run_key=key, status=status, **hashes)
            if status == "complete":
                report["candidates"] = []
            else:
                report["reason"] = "Unavailable"
            if key == "drift":
                report["version_hash"] = "c" * 64
            (self.root / f"{i}.json").write_text(json.dumps(report))
        result = evaluate.reconcile(expected, self.root)
        self.assertEqual(sorted(result["complete"]), ["ok"])
        self.assertEqual(sorted(result["duplicate"]), ["twice"])
        self.assertEqual(sorted(result["missing"]), ["no"])
        self.assertEqual(sorted(result["blocked"]), ["blocked"])
        self.assertEqual(sorted(result["failed"]), ["failed"])
        self.assertEqual(sorted(result["extra"]), ["extra"])
        self.assertIn("version_hash", result["invalid"]["5.json"])

    def test_cli_hash_and_reconcile_exit_codes(self):
        import subprocess
        import sys

        executable = [sys.executable, str(Path(evaluate.__file__))]
        output = subprocess.run([*executable, "hash", str(self.root)], capture_output=True)
        self.assertEqual(output.returncode, 0, output.stderr)
        self.assertTrue(output.stdout, "hash must print a manifest")
        self.assertEqual(json.loads(output.stdout), evaluate.artifact_manifest(self.root))
        plan = self.root / "plan.json"
        plan.write_text(json.dumps({"one": dict(input_hash="a" * 64, version_hash="b" * 64)}))
        reports = self.root / "reports"
        reports.mkdir()
        output = subprocess.run([*executable, "reconcile", str(plan), str(reports)],
                                capture_output=True)
        self.assertEqual(output.returncode, 1)
        self.assertEqual(json.loads(output.stdout)["missing"], ["one"])

    def test_report_with_conflicting_json_keys_is_invalid(self):
        hashes = dict(input_hash="a" * 64, version_hash="b" * 64)
        report = json.dumps(dict(run_key="one", status="complete", candidates=[], **hashes))
        (self.root / "one.json").write_text('{"status":"failed",' + report[1:])
        result = evaluate.reconcile({"one": hashes}, self.root)
        self.assertEqual(result["complete"], {})
        self.assertIn("duplicate JSON key", result["invalid"]["one.json"])
