#!/usr/bin/env bash
# Checks the repo rules a script can check. Run by CI and by the repo skills.
set -euo pipefail
shopt -s nullglob
cd "$(git rev-parse --show-toplevel)"

fail=0
err() { printf 'error: %s\n' "$*" >&2; fail=1; }

spaces=(common)
for d in personal/*/; do spaces+=("${d%/}"); done
skill_files=(common/skills/*/SKILL.md personal/*/skills/*/SKILL.md .agents/skills/*/SKILL.md)

frontmatter_keys() { awk '/^---$/{n++; next} n==1 && /^[A-Za-z][A-Za-z0-9_-]*:/{sub(/:.*/, ""); print}' "$1"; }
frontmatter_name() { awk '/^---$/{n++; next} n==1 && /^name:/{sub(/^name:[ ]*/, ""); print; exit}' "$1"; }

# Claude Code manifests: the marketplace and every space. Not --strict: it demands a version,
# and we leave version out on purpose so installs follow git (AGENTS.md rule 5).
claude plugin validate . || fail=1
for s in "${spaces[@]}"; do claude plugin validate "$s" || fail=1; done

# Every space is in the marketplace under the name its plugin.json uses, and nothing else is.
listed=$(jq -r '.plugins[] | "\(.name) \(.source)"' .claude-plugin/marketplace.json | sort)
actual=$(for s in "${spaces[@]}"; do printf '%s ./%s\n' "$(jq -r .name "$s/.claude-plugin/plugin.json")" "$s"; done | sort)
if [ "$listed" != "$actual" ]; then
  err "marketplace.json plugins don't match the spaces on disk"
  diff <(echo "$listed") <(echo "$actual") >&2 || true
fi

# Skill names match their folder and are unique across the repo (pi keeps the first one it finds).
for f in "${skill_files[@]}"; do
  dir=$(basename "$(dirname "$f")")
  name=$(frontmatter_name "$f")
  [ "$name" = "$dir" ] || err "$f: name '$name' doesn't match its folder '$dir'"
done
dupes=$(for f in "${skill_files[@]}"; do basename "$(dirname "$f")"; done | sort | uniq -d)
[ -z "$dupes" ] || err "skill names used more than once: $dupes"

# Skills in common use only Agent Skills frontmatter, so they work in pi.
for f in common/skills/*/SKILL.md; do
  for k in $(frontmatter_keys "$f"); do
    case "$k" in
      name|description|license|compatibility|metadata|allowed-tools) ;;
      *) err "$f: '$k' isn't an Agent Skills field; skills in common must work in pi" ;;
    esac
  done
done

# The Agent Skills spec, when the reference validator is installed (CI installs it).
if command -v skills-ref >/dev/null; then
  for f in "${skill_files[@]}"; do skills-ref validate "$(dirname "$f")" || fail=1; done
else
  echo "note: skills-ref isn't installed; skipping the spec check" >&2
fi

exit "$fail"
