# Code reviewer

Use this skill when you want a second look at a PR, local changes or a design—not just whether the implementation matches the task, but whether the task, unintended consequences and verification stand up to scrutiny.

Besides defects, every review suggests up to five ways the change could be easier to read, test or hold in your head. Suggestions never block a merge.

It replaces `vimes`. Start with one compact review; request focused expertise or an independent challenge when the change warrants it. This is a review workflow, not an auto-fixer, merge gate or installed PR bot.

## Quick start

### 1. Set up the config (required once)

Every review needs a local config. Without one, the skill stops and offers setup. Inside Claude Code:

```text
/klases:code-reviewer setup
```

The agent looks at the repo you are in, asks a few questions and shows the config it will write; nothing is written until you say yes. To answer the same questions in a terminal instead, run `scripts/setup.sh` from the skill directory with no arguments. See [How config works](#how-config-works).

### 2. Private report with a summary

```text
/klases:code-reviewer report 1234
/klases:code-reviewer report https://github.com/<owner>/<repo>/pull/1234
/klases:code-reviewer report <base>..<head>
```

The review runs without questions unless the PR cannot be pinned, writes the full report to `<reports_root>/<area>/reviews/<owner>-<repo>/pr-1234.md` and prints a summary:

```markdown
**request-changes** · <owner>/<repo>#1234 @ a1b2c3d..9f8e7d6
Report: ~/notes/your-repo/reviews/your-org-your-repo/pr-1234.md

| ID | Kind | Rating | Blocks | Finding | Suggestion |
|----|------|--------|--------|---------|------------|
| F1 | defect | high | yes | Refund skips tax line on partial cancel | Use cancelLine() in both paths |
| M1 | maint. | should | – | priceFor() mixes I/O and rules; untestable without DB | Extract pure computePrice() |

Owner questions: 1 · Not covered: integration tests
```

Defects carry a severity (critical, high, medium, low) and may block merge. Maintainability suggestions carry a priority (should, consider, nit) and never block. Reviewing the same PR again overwrites its report and marks earlier findings as fixed or still open.

### 3. Interactive review in Claude Code

With the `klases@luggage` plugin installed and refreshed to a revision containing this package, type this **inside Claude Code**, not in your shell:

```text
/klases:code-reviewer
```

A bare invocation asks what to review and which focus matters, unless the conversation already supplies that information. To skip the initial questions, include the request:

```text
/klases:code-reviewer Review my staged changes for unintended behavior changes and weak tests. Discuss the findings with me. Read-only.
```

Native plugin discovery and agent activation have not been exercised for this package. If the skill is not available, use explicit loading below rather than assuming the command ran. `/klases:vimes` is removed; there is no compatibility alias.

### Codex or Hermes: explicitly load the skill

In your target project's conversation, give the agent the actual file path:

```text
Read <luggage-checkout>/personal/klases/skills/code-reviewer/SKILL.md and follow it, loading its references as needed.
Review my staged changes for regressions and test gaps. Read-only; report here.
```

The config is required here too: run `<luggage-checkout>/personal/klases/skills/code-reviewer/scripts/setup.sh` in a terminal first, or ask the agent to follow the skill's Setup section.

Replace `<luggage-checkout>` with the absolute path to your local Luggage clone. It is a placeholder, not a shell variable. The agent needs read access to both the skill package and the target project. Identify the target repository if more than one is in scope.

Explicit artifact loading was exercised through Codex. Native Codex `$code-reviewer` and named Hermes activation require host discovery/configuration and remain unverified for this package. Claude-format agent files are not automatically native agents on those hosts; see [host activation and permissions](references/hosts.md).

## How config works

The config is one local file, `~/.config/klases/code-reviewer.json`, outside this repository. Only this skill reads it. It holds what differs per machine and per repo: where reports go, which GitHub account to use, which specs and rules apply, and what the review may run. See [config.example.json](config.example.json) and [the field reference](references/config.md).

```json
{
  "global": {
    "reports_root": "~/notes",
    "fallback_area": "external",
    "execution": "source-only",
    "gh_account": "your-github-login",
    "default_focus": ["correctness", "tests", "maintainability"]
  },
  "repos": {
    "your-org/your-repo": {
      "area": "your-repo",
      "spec_roots": ["~/code/your-specs-repo/openspec/changes"],
      "policy": ["~/notes/rules/your-repo.md"],
      "execution": "unit"
    }
  }
}
```

- **`global`** is required and applies to every repo.
- **`repos`** entries are optional, keyed by `owner/name` from the checkout's `origin` remote. An entry overrides `global` field by field.
- A repo without an entry is reviewed with `global` alone. It gets no spec roots or policy files, and the report says so.
- If the file or its `global` section is missing, every mode except `setup` stops and offers setup.
- `execution` is the most target code a review may run: `source-only`, `unit` or `unit+integration`. Integration runs happen only in an interactive session, and the setting never grants more than your session already allows.

`scripts/setup.sh` is the only writer of the file, and the skill reads the config through it:

| Command | Does |
|---|---|
| `scripts/setup.sh` | Interactive wizard in a terminal. |
| `scripts/setup.sh detect` | JSON about this checkout and the config; used by `/klases:code-reviewer setup`. |
| `scripts/setup.sh check [--repo owner/name]` | Validates the file and prints the resolved settings; exits 3 when setup is required. |
| `scripts/setup.sh write --global JSON` / `--repo owner/name --entry JSON` | Validates and shows a diff; writes only with `--apply`. |

Edit the file by hand if you prefer; `check` tells you when it is invalid. It needs `jq`.

## When to use it

- **Review together:** inspect a PR or your own changes, then discuss individual findings and assumptions.
- **Prepare a private PR briefing:** request a self-contained report before reviewing somebody else's PR. The caller supplies authorized PR access, scope and an output destination.
- **Review during coding:** have a fresh reviewer assess the task and a frozen implementation, returning findings to the coding agent rather than editing its work.

Use a focused request for a particular question, such as authorization, transaction failures or compatibility. A broader request can include correctness, security, tests, error handling, models, documentation and simplicity. These are review focuses—not a requirement to launch an agent for every category.

## Example requests

The examples below are prompt text. Use them after loading the skill, or append them to the Claude invocation. Replace placeholder URLs, revisions and paths with your actual targets; no example authorizes running target code.

### Review a PR interactively

```text
Review <PR URL> with me. Focus on changed behavior and effects on existing callers.
Resolve and state the base and head revisions. Challenge the task assumptions as well as the code.
Show the strongest supported findings first, with open questions separate. Read-only; do not post to GitHub.
```

### Produce a private PR report

```text
Review <PR URL> and produce a private report here, not a GitHub comment.
Focus on authorization, compatibility and test quality. Pin the reviewed revisions.
Include triggering conditions, evidence, counterevidence and what was not verified.
This is unattended: return incomplete if required scope or access is missing.
```

This selects the private-report workflow described in [workflows](references/workflows.md) and returns the report in the conversation. `/klases:code-reviewer report <PR>` is the short form, which also writes the report file to the configured destination. Neither installs or invokes the separate open-source PR-Agent tool, creates a schedule or grants publication permission.

### Request deeper investigation

```text
Review <base>..<head> for transaction and retry regressions, including affected unchanged callers.
Use focused specialists where they add distinct evidence. Challenge consequential or disputed findings independently.
Explain whether each issue is introduced, exposes an older defect or is pre-existing. Source inspection only.
```

### Ask a coding agent for an independent review

```text
Give a fresh reviewer the agreed task and a frozen snapshot of these changes.
Have it load the code-reviewer skill and relevant references before reading my implementation summary.
Return defects, unresolved assumptions and required follow-up checks. Do not fix anything during review.
If fresh review is unavailable, disclose the reduced independence.
```

## What happens

```mermaid
flowchart TD
    S[Invoke] --> K{Config with a global section?}
    K -->|No| Y[Stop and offer setup]
    K -->|Yes| A[Resolve settings: repo entry over global]
    A --> B{Required inputs available?}
    B -->|No, interactive| C[Ask only for missing decisions]
    C --> B
    B -->|No, unattended| X[Return incomplete report]
    B -->|Yes| D[Pin scope and read task and policy]
    D --> E[Fresh compact review: task, code, impact and evidence]
    E --> F{Additional investigation useful?}
    F -->|Yes| G[Bounded specialist or finding challenger]
    F -->|No| H[Reconcile findings and coverage limits]
    G --> H
    H --> I[Discuss, deliver private report or return coding feedback]
```

The coordinator resolves scope, chooses the workflow and assembles the result. The main reviewer investigates the task, implementation, unintended impact, verification and maintainability. A specialist handles a bounded aspect; a challenger searches for evidence that supports or defeats a consequential claim. The host and selected depth determine which roles actually run; the report must say what happened.

## What you get—and what remains separate

A report opens with a verdict (approve, approve-with-comments or request-changes), then identifies the reviewed revision and scope, supported findings with locations and triggering conditions, up to five maintainability suggestions, recommendations or owner questions, and verification/coverage limits. Impact and confidence are separate. Zero findings is valid, not proof that the change is correct.

The native Claude agents have read/search tools only. Tests, builds and targeted mutations require separate authorization and a coordinator-provided controlled execution environment. A request for a deeper review does not itself grant execution permission. Fixes, commits, pushes, GitHub comments and merge decisions are separate actions. The only files the skill writes are the report in `report` mode and the config in `setup`.

## Further reading

- [SKILL.md](SKILL.md): coordinating instructions.
- [Investigation](references/investigation.md): the task, implementation, verification and maintainability steps every reviewer follows, including checking the change against its spec and acceptance criteria.
- [Config](references/config.md) and [report mode](references/report.md): the config fields and resolution, and the report file and summary.
- [Review contract](references/review-contract.md): evidence, severity, suggestion priority, the blocks-merge flag and candidate dispositions.
- [Workflows](references/workflows.md) and [host support](references/hosts.md): interaction, delivery and runtime limits.
- [Sources](references/sources.md) and [NOTICE.md](NOTICE.md): inspiration and adapted material.
- [Evaluation recorder](evaluation/README.md): developer tooling for input identities, budgets and report accounting; not a prerequisite for an ordinary review.
