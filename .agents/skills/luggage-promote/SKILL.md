---
name: luggage-promote
description: Promote a skill or agent from a personal space into common/ in the luggage repo, and draft the promotion PR. Use when someone asks to "promote <x>", "move <x> to common" or "share <x> with everyone".
---

# Promote to common

`common/` is jointly owned. What lands there works in Claude Code and pi and has been reviewed by
someone other than its author. Promotion is a move on a branch plus a PR, and the review happens on the PR.

Nothing is changed until the user approves the proposal in step 3. Nothing is pushed until they approve the PR draft in step 6.

## Steps

1. **Locate it.** Done when the user has confirmed the source path, `personal/<handle>/skills/<name>/` or `personal/<handle>/agents/<name>.md`, and `git status` shows no unrelated changes the branch would sweep in.
2. **Check the common bar.** Each item either passes or gets a note that the PR will carry:
   - Frontmatter uses only `name`, `description`, `license`, `compatibility`, `metadata` and `allowed-tools`. Claude Code–only fields are removed, or there's a note on how the skill works without them.
   - It works in pi. Either it doesn't depend on subagents, the `Agent` tool or other Claude Code–only features, or its body documents a fallback (for example a single-agent path).
   - It's self-contained: every file it reads is inside its own folder.
   - The description says what it does and when to use it.

   Agents target Claude Code only for now, so an agent is checked only for being self-contained and for its description. If an item fails and the fix isn't obvious, stop and report it; the fix is the owner's call.
3. **Propose, then wait.** Show:
   - the result of each bar check
   - the branch, `promote/<name>`
   - the move: `git mv personal/<handle>/skills/<name> common/skills/<name>`, or the agent file into `common/agents/`
   - every edit needed to pass the bar, as a diff
   - the commit message

   Done when the user says yes. If they change anything, show the updated proposal and wait again.
4. **Move it**: `git switch -c promote/<name>`, then make the approved move and edits and commit them together.
5. **Validate**: `scripts/validate.sh` exits 0.
6. **Draft the PR** and show it. Title: `promote: <name> to common`. Body:

   ```markdown
   ## What it does
   <one paragraph, from the description>

   ## Tested
   - Claude Code: <how, and what happened>
   - pi: <how, and what happened, or the fallback it relies on>

   ## Changes in the move
   <frontmatter or body changes made to pass the common bar, or "none">

   ## For people using it
   In Claude Code the command changes from `/<handle>:<name>` to `/common:<name>`. pi is unaffected.
   ```

   Ask the user to fill in any **Tested** line you couldn't observe yourself. On their yes, run `git push -u origin promote/<name>` and `gh pr create`. Merge only after someone other than the author approves.
