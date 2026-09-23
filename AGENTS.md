# luggage

Shared skills and agents for Claude Code and pi.

## Layout

- `common/`: reviewed and jointly owned. A Claude Code plugin (`common@luggage`) and a pi package.
- `personal/<handle>/`: one contributor's own space, the same shape as `common/`.
- `.agents/skills/`: repo skills for maintaining luggage itself. `.claude/skills` links here. They load only inside this clone.
- `scripts/validate.sh`: checks the rules below that a script can check. Run it before every commit.

## Working here

Use the repo skills for the jobs they cover: `luggage-new-personal-space`, `luggage-new-personal-skill`,
`luggage-promote` and `luggage-remove`.

## Rules

1. Skill names are unique across the repo and match their folder name. pi keeps only the first skill it finds with a given name.
2. Skills in `common/` use only Agent Skills frontmatter (`name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`) and work in pi as well as Claude Code. Personal spaces may use Claude Code–only fields.
3. Changes to `common/` go through a PR approved by someone other than its author. Personal-space changes, and the marketplace entry for a new space, go straight to `main`. The `pre-push` hook (enable it with `git config core.hooksPath scripts/hooks`) and the `common-review` check back this up.
4. A space is self-contained: nothing in it refers outside its own folder. Copy what you need.
5. No `version` fields in manifests, so installs follow git.
6. Agents are Markdown with frontmatter in a space's `agents/` folder, and target Claude Code only for now.
7. Nothing secret goes in the repo.
