import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path

SETUP = Path(__file__).with_name("setup.sh")

GLOBAL = {
    "report_path": "~/notes/pr-reviews/{owner}_{repo}_{id}.md",
    "execution": "source-only",
}
ENTRY = {"spec_roots": [], "policy": [], "execution": "unit"}


class SetupTest(unittest.TestCase):
    def setUp(self):
        scratch = tempfile.TemporaryDirectory()
        self.addCleanup(scratch.cleanup)
        self.root = Path(scratch.name).resolve()
        self.config = self.root / "klases" / "code-reviewer.json"
        self.repo = self.root / "repo"
        self.repo.mkdir()
        subprocess.run(["git", "init", "-q", str(self.repo)], check=True)
        subprocess.run(["git", "-C", str(self.repo), "remote", "add", "origin",
                        "git@github.com:eversport/eversports.git"], check=True)

    def run_setup(self, *args):
        env = os.environ | {"KLASES_CODE_REVIEWER_CONFIG": str(self.config)}
        return subprocess.run([os.environ.get("SETUP_BASH", "bash"), str(SETUP), *args], cwd=self.repo, env=env,
                              capture_output=True, text=True, stdin=subprocess.DEVNULL)

    def write_global(self):
        done = self.run_setup("write", "--global", json.dumps(GLOBAL), "--apply")
        self.assertEqual(done.returncode, 0, done.stderr)

    def test_detect_reports_the_repo_and_a_missing_config(self):
        done = self.run_setup("detect")
        self.assertEqual(done.returncode, 0, done.stderr)
        found = json.loads(done.stdout)
        self.assertEqual(found["repo"], "eversport/eversports")
        self.assertFalse(found["config_exists"])
        self.assertFalse(found["has_global"])
        self.assertIsNone(found["repo_entry"])

    def test_write_is_a_dry_run_until_apply(self):
        done = self.run_setup("write", "--global", json.dumps(GLOBAL))
        self.assertEqual(done.returncode, 0, done.stderr)
        self.assertIn("report_path", done.stdout)
        self.assertFalse(self.config.exists())

    def test_repo_entry_needs_a_global_section_first(self):
        done = self.run_setup("write", "--repo", "eversport/eversports",
                              "--entry", json.dumps(ENTRY), "--apply")
        self.assertNotEqual(done.returncode, 0)
        self.assertIn("global", done.stderr)
        self.assertFalse(self.config.exists())

    def test_repo_entries_merge_without_touching_other_entries(self):
        self.write_global()
        other = ENTRY | {"gh_account": "other-login"}
        for repo, entry in [("matchi/webapp", other), ("eversport/eversports", ENTRY)]:
            done = self.run_setup("write", "--repo", repo, "--entry", json.dumps(entry), "--apply")
            self.assertEqual(done.returncode, 0, done.stderr)
        stored = json.loads(self.config.read_text())
        self.assertEqual(stored["global"], GLOBAL)
        self.assertEqual(stored["repos"]["matchi/webapp"], other)
        self.assertEqual(stored["repos"]["eversport/eversports"], ENTRY)
        found = json.loads(self.run_setup("detect").stdout)
        self.assertTrue(found["has_global"])
        self.assertEqual(found["repo_entry"], ENTRY)

    def test_invalid_values_are_rejected_without_writing(self):
        for args, message in [
            (["--global", json.dumps(GLOBAL | {"execution": "everything"})], "execution"),
            (["--global", json.dumps({"execution": "unit"})], "report_path"),
            (["--global", json.dumps(GLOBAL | {"report_path": "~/notes/review.md"})], "{id}"),
            (["--repo", "a/b", "--entry", json.dumps({"report_path": "~/x/{owner}.md"})], "{id}"),
            (["--global", json.dumps(GLOBAL | {"colour": "blue"})], "colour"),
            (["--global", "{not json"], "JSON"),
        ]:
            with self.subTest(args=args):
                done = self.run_setup("write", *args, "--apply")
                self.assertNotEqual(done.returncode, 0)
                self.assertIn(message, done.stderr)
                self.assertFalse(self.config.exists())

    def test_check_resolves_repo_entry_over_global_and_blocks_without_global(self):
        blocked = self.run_setup("check")
        self.assertEqual(blocked.returncode, 3)
        self.assertIn("setup", blocked.stderr)
        self.write_global()
        fallback = json.loads(self.run_setup("check").stdout)
        self.assertEqual(fallback["source"], "global")
        self.assertEqual(fallback["settings"]["execution"], "source-only")
        self.run_setup("write", "--repo", "eversport/eversports", "--entry", json.dumps(ENTRY), "--apply")
        listed = json.loads(self.run_setup("check").stdout)
        self.assertEqual(listed["source"], "repo")
        self.assertEqual(listed["settings"]["execution"], "unit")
        self.assertEqual(listed["settings"]["report_path"], GLOBAL["report_path"])


if __name__ == "__main__":
    unittest.main()
