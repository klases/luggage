---
name: luggage-remove
description: Remove a skill or agent from the luggage repo, from a personal space or from common/. Use when someone asks to "remove", "delete" or "retire" a skill or agent in luggage.
---

# Remove a skill or agent

## Steps

1. **Locate it and show it.** Done when you have its exact path and have shown the user its name, description and space.
2. **Find what mentions it**: `grep -rn "<name>" --exclude-dir=.git .`. Done when every mention outside its own folder is listed.
3. **Remove it.** How depends on the space:
   - *Personal space*: only the owner removes from their own space. `git rm -r` the folder (or the agent file), clean up the mentions from step 2, check that `scripts/validate.sh` exits 0, and offer to commit to `main`.
   - *`common/`*: a breaking change for everyone who has it installed. On a branch `remove/<name>`, `git rm -r` it, clean up the mentions, and check that `scripts/validate.sh` exits 0. Then draft a PR titled `remove: <name> from common`, whose body says what's removed, why, and what replaces it (or "nothing"). Show the draft; push and open it only on the user's go-ahead.
