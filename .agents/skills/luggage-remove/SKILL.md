---
name: luggage-remove
description: Remove a skill or agent from the luggage repo, from a personal space or from common/. Use when someone asks to "remove", "delete" or "retire" a skill or agent in luggage.
---

# Remove a skill or agent

Nothing is deleted until the user approves the proposal in step 3.

## Steps

1. **Locate it and show it.** Done when the user has confirmed its exact path, after you have shown them its name, description and space.
2. **Find what mentions it**: `grep -rn "<name>" --exclude-dir=.git .`. Done when every mention outside its own folder is listed.
3. **Propose, then wait.** Show:
   - every file that will be deleted
   - each cleanup of a mention from step 2, as a diff
   - how it lands, which depends on the space:
     - *Personal space*: a commit to `main`, with its message. Only the owner removes from their own space.
     - *`common/`*: a breaking change for everyone who has it installed. It goes on a branch `remove/<name>` with a PR titled `remove: <name> from common`, whose body says what's removed, why, and what replaces it (or "nothing"). Show the branch, the commit message and the PR draft.

   Done when the user says yes. If they change anything, show the updated proposal and wait again.
4. **Remove it**: `git rm -r` the folder (or the agent file), apply the approved cleanups, and commit. For `common/`, do this on the `remove/<name>` branch.
5. **Validate**: `scripts/validate.sh` exits 0.
6. **Finish.** For `common/`, push the branch and open the PR only on the user's yes. Push a personal-space commit only when the user asks.
