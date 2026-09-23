---
name: luggage-new-personal-space
description: Create a contributor's personal space in the luggage repo, personal/<handle>/ with its manifests and marketplace entry. Use when someone starts contributing, or asks to "add my space", "set me up in luggage" or "create a personal space".
---

# New personal space

A personal space is `personal/<handle>/`, one contributor's own skills and agents. It has the same
shape as `common/` and is its own Claude Code plugin and its own pi package. `AGENTS.md` has the rules.

## Steps

1. **Pick the handle**: the contributor's GitHub handle, in lowercase (`gh api user --jq .login` is a hint). Done when `personal/<handle>/` doesn't exist and no plugin in `.claude-plugin/marketplace.json` is named `<handle>`. If either exists, stop and say so.
2. **Create the space** in the same shape as `common/`:
   - `personal/<handle>/.claude-plugin/plugin.json`: `{ "name": "<handle>", "description": "<Name>'s personal space" }`
   - `personal/<handle>/package.json`: `{ "name": "luggage-<handle>", "private": true, "pi": { "skills": ["./skills"] } }`
   - `personal/<handle>/skills/.gitkeep` and `personal/<handle>/agents/.gitkeep`
3. **Register it**: append `{ "name": "<handle>", "source": "./personal/<handle>", "description": "<Name>'s personal space" }` to `plugins` in `.claude-plugin/marketplace.json`. Add no `version` field.
4. **Turn on the repo hooks** for this clone: `git config core.hooksPath scripts/hooks`.
5. **Validate**: `scripts/validate.sh` exits 0.
6. **Report** the files created and the install commands:
   - Claude Code: `claude plugin marketplace add <path to this clone>` (or `claude plugin marketplace update luggage` if it's already added), then `claude plugin install <handle>@luggage`.
   - pi: `pi install ./personal/<handle>`, run from the clone.

   Then offer to commit. A new space goes straight to `main`, because it doesn't touch `common/`. Commit or push only when the user says so.
