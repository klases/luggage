---
name: luggage-new-personal-skill
description: Add a skill to your personal space in the luggage repo, either new or imported from an existing skill folder. Use when someone asks to "add a skill", "create a personal skill", "bring my <x> skill into luggage" or "import <path>".
---

# New personal skill

A skill goes into its contributor's own space, `personal/<handle>/skills/<name>/`. Moving it to
`common/` is a separate step, `luggage-promote`.

## Steps

1. **Find the space.** Work out the handle; ask if it's unclear. Done when `personal/<handle>/` exists. If it doesn't, run `luggage-new-personal-space` first.
2. **Settle the name**: lowercase letters, digits and single hyphens, at most 64 characters, the same as the folder name. Done when no folder with that name exists under `common/skills/`, `personal/*/skills/` or `.agents/skills/`. Names are unique across the repo because pi keeps only the first skill it finds with a given name.
3. **Create or import.**
   - *New*: write `SKILL.md` with frontmatter `name` and `description` (what it does and when to use it, under 1024 characters), followed by the body. Add `scripts/`, `references/` or `assets/` only when the skill uses them.
   - *Import*: `cp -R <source> personal/<handle>/skills/<name>` and leave the source where it is. If `name` in the frontmatter differs from the folder name, set it to match.

   Everything the skill uses lives inside its own folder, because a space can't reach into another.
4. **Note portability.** List any frontmatter beyond `name`, `description`, `license`, `compatibility`, `metadata` and `allowed-tools`, and anything the skill needs that only Claude Code has (subagents, the `Agent` tool, Claude tool names). That's fine in a personal space. It's what `luggage-promote` checks later, so say it now.
5. **Validate**: `scripts/validate.sh` exits 0.
6. **Report and load.**
   - Claude Code: `claude plugin marketplace update luggage`, then `/reload-plugins`. The skill is `/<handle>:<name>`.
   - pi: it picks up the skill from the local package the next time it starts.

   If an import leaves a copy with the same name elsewhere on this machine (for example `~/.claude/skills/<name>`), say so. Claude Code gives the plain `/<name>` to the local copy, and pi warns about the duplicate. Offer to commit; personal changes go straight to `main`, and only when the user says so.
