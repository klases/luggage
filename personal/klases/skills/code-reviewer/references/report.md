# Report mode

`report <target>` produces a private report file and a summary in the conversation. The target is a PR number or URL, or a `base..head` range.

## Run

1. Resolve settings with `scripts/setup.sh check` (see [config](config.md)). Stop on exit 2 or 3.
2. Pin the target. Ask only when it cannot be pinned, for example an ambiguous PR number or a missing range end. Everything else that is missing becomes an owner question or a coverage gap in the report.
3. Run the review as usual, with the settings' focus, spec roots, policy and execution limit.
4. Write the report, then print the summary.

## File

Write `<reports_root>/<area>/reviews/<owner>-<name>/pr-<n>.md` (for a range: `range-<base7>-<head7>.md`), expanding `~`. Create missing folders. Writing this file is the only write report mode may make.

One file per PR: a later run overwrites it. Before overwriting, read the previous report and mark each of its finding IDs as fixed, still open or no longer applicable in the new report, keeping the same ID for a finding that persists.

The file contains, in order:

1. Verdict, repo, PR, base and head SHAs, date, and whether settings came from a repo entry or the global fallback.
2. The summary table below.
3. Each finding in full: ID, location, trigger, trace, consequence, evidence type, confidence, correction or check, and origin (introduced, newly exposed or pre-existing).
4. Owner questions.
5. Coverage: files and aspects covered, exclusions, unavailable checks, stale inputs, and the status of the previous report's findings.

## Summary in the conversation

Print exactly this shape after writing the file:

```markdown
**<verdict>** · <owner/repo>#<n> @ <base7>..<head7>
Report: <path>

| ID | Kind | Rating | Blocks | Finding | Suggestion |
|----|------|--------|--------|---------|------------|
| F1 | defect | high | yes | <one line> | <one line> |
| M1 | maint. | should | – | <one line> | <one line> |

Owner questions: <n> · Not covered: <short list>
```

Rank defects by severity, blocks-merge first, then maintainability suggestions by priority. With no findings, print the header line and `No findings.` followed by the coverage line.
