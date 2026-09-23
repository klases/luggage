---
name: luggage-new-personal-space
description: Create a contributor's personal space in the luggage repo, personal/<handle>/ with its manifests and marketplace entry. Use when someone starts contributing, or asks to "add my space", "set me up in luggage" or "create a personal space".
---

# New personal space

A personal space is `personal/<handle>/`, one contributor's own skills and agents. It has the same
shape as `common/` and is its own Claude Code plugin and its own pi package. `AGENTS.md` has the rules.

Nothing is written until the user approves the proposal in step 3.

## Steps

1. **Pick the handle.** Run `gh auth status --hostname github.com` to list the GitHub accounts logged in on this machine.
   - More than one account: ask which to use, listing them.
   - Exactly one: ask the user to confirm it.
   - None: ask for the handle.

   Use the handle in lowercase. Done when the user has named the handle, `personal/<handle>/` doesn't exist, and no plugin in `.claude-plugin/marketplace.json` is named `<handle>`. If either already exists, stop and say so.
2. **Pick the display name** for the plugin description. Suggest `git config user.name` and let the user change it.
3. **Propose, then wait.** Show everything the next step will do:
   - the files to create, with their full contents:
     - `personal/<handle>/.claude-plugin/plugin.json`: `{ "name": "<handle>", "description": "<Name>'s personal space" }`
     - `personal/<handle>/package.json`: `{ "name": "luggage-<handle>", "private": true, "pi": { "skills": ["./skills"] } }`
     - `personal/<handle>/skills/.gitkeep` and `personal/<handle>/agents/.gitkeep`, both empty
   - the entry to append to `plugins` in `.claude-plugin/marketplace.json`: `{ "name": "<handle>", "source": "./personal/<handle>", "description": "<Name>'s personal space" }`, with no `version` field
   - `git config core.hooksPath scripts/hooks`, only if `git config core.hooksPath` doesn't already print `scripts/hooks`

   Done when the user says yes. If they change anything, show the updated proposal and wait again.
4. **Create** exactly what was approved.
5. **Validate**: `scripts/validate.sh` exits 0.
6. **Report** the files created and the install commands:
   - Claude Code: `claude plugin marketplace add <path to this clone>` (or `claude plugin marketplace update luggage` if it's already added), then `claude plugin install <handle>@luggage`.
   - pi: `pi install ./personal/<handle>`, run from the clone.

   Then propose a commit: show the files it includes and the message, and commit only on the user's yes. A new space goes straight to `main`, because it doesn't touch `common/`. Push only when the user asks.
