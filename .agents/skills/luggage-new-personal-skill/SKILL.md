---
name: luggage-new-personal-skill
description: Add a skill to your personal space in the luggage repo, either new or imported from an existing skill folder. Use when someone asks to "add a skill", "create a personal skill", "bring my <x> skill into luggage" or "import <path>".
---

# New personal skill

A skill goes into its contributor's own space, `personal/<handle>/skills/<name>/`. Moving it to
`common/` is a separate step, `luggage-promote`.

Nothing is written until the user approves the proposal in step 4.

## Steps

1. **Find the space.** List the folders under `personal/`.
   - More than one could be the user's (for example, several GitHub accounts from `gh auth status --hostname github.com` match): ask which to use.
   - Exactly one matches: ask the user to confirm it.
   - None: offer to run `luggage-new-personal-space` first.

   Done when the user has confirmed `personal/<handle>/`.
2. **Settle the name**: lowercase letters, digits and single hyphens, at most 64 characters, the same as the folder name. Done when no folder with that name exists under `common/skills/`, `personal/*/skills/` or `.agents/skills/`. Names are unique across the repo because pi keeps only the first skill it finds with a given name.
3. **Prepare the content**, without writing anything yet.
   - *New*: draft `SKILL.md` with frontmatter `name` and `description` (what it does and when to use it, under 1024 characters), followed by the body. Plan `scripts/`, `references/` or `assets/` only when the skill uses them.
   - *Import*: list every file in the source folder (`find <source> -type f`). Note whether the frontmatter `name` needs changing to match the folder name.

   Either way, check portability. List any frontmatter beyond `name`, `description`, `license`, `compatibility`, `metadata` and `allowed-tools`, and anything the skill needs that only Claude Code has (subagents, the `Agent` tool, Claude tool names). That's fine in a personal space, but it's what `luggage-promote` checks later. Also check whether a skill with the same name exists elsewhere on this machine (for example `~/.claude/skills/<name>`). If it does, Claude Code gives the plain `/<name>` to that copy, and pi warns about the duplicate.
4. **Propose, then wait.** Show:
   - the target folder, `personal/<handle>/skills/<name>/`
   - for a new skill, the full `SKILL.md` draft and any other files
   - for an import, the source, the file list, and the copy command (`cp -R <source> personal/<handle>/skills/<name>`). Say that the source is left where it is. Include any `name` change as a diff.
   - the portability notes and any duplicate found in step 3

   Done when the user says yes. If they change anything, show the updated proposal and wait again.
5. **Write** exactly what was approved.
6. **Validate**: `scripts/validate.sh` exits 0.
7. **Report and load.**
   - Claude Code: `claude plugin marketplace update luggage`, then `/reload-plugins`. The skill is `/<handle>:<name>`.
   - pi: it picks up the skill from the local package the next time it starts.

   Then propose a commit: show the files it includes and the message, and commit only on the user's yes. Personal changes go straight to `main`. Push only when the user asks.
