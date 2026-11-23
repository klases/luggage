#!/usr/bin/env bash
# Reads, validates and writes the code-reviewer config. The only writer of that file.
#
#   setup.sh detect [--repo owner/name]   JSON facts about this checkout and the config
#   setup.sh check  [--repo owner/name]   JSON settings for this repo (entry over global);
#                                         exit 3 when the file or its global section is missing
#   setup.sh write (--global JSON | --repo owner/name --entry JSON) [--apply]
#                                         validate, print a diff, write only with --apply
#   setup.sh                              interactive wizard (needs a terminal)
#
# Exit codes: 0 ok, 2 bad input or invalid config, 3 setup required.
# KLASES_CODE_REVIEWER_CONFIG overrides the config path (used by the tests).
set -euo pipefail

CONFIG="${KLASES_CODE_REVIEWER_CONFIG:-$HOME/.config/klases/code-reviewer.json}"
EXECUTION_VALUES='["source-only","unit","unit+integration"]'

die() { echo "code-reviewer setup: $2" >&2; exit "$1"; }

command -v jq >/dev/null || die 2 "jq is required"

# jq definitions shared by every validation: each returns a list of error strings.
JQ_RULES='
  def strings: type == "array" and all(.[]; type == "string");
  def check_fields($required; $optional):
    ([$required[] as $k | select(.[$k] == null) | "missing \($k)"]
     + [keys[] | select(. as $k | ($required + $optional) | index($k) | not) | "unknown field \(.)"]);
  def check_common($execution):
    ([select(.execution != null and (.execution | IN($execution[]) | not))
       | "execution must be one of \($execution | join(", "))"]
     + [("gh_account", "report_path") as $k
        | select(.[$k] != null and (.[$k] | type) != "string") | "\($k) must be a string"]
     + [select((.report_path | type) == "string" and (.report_path | contains("{id}") | not))
        | "report_path must contain {id}, or every PR would share one file"]
     + [("default_focus", "spec_roots", "policy") as $k
        | select(.[$k] != null and (.[$k] | strings | not)) | "\($k) must be a list of strings"]);
  def global_errors($execution):
    if type != "object" then ["global must be an object"] else
      check_fields(["report_path", "execution"]; ["gh_account", "default_focus"])
      + check_common($execution) end;
  def entry_errors($execution):
    if type != "object" then ["repo entry must be an object"] else
      check_fields([]; ["report_path", "spec_roots", "policy", "gh_account", "execution", "default_focus"])
      + check_common($execution) end;
  def config_errors($execution):
    if type != "object" then ["config must be an object"] else
      [keys[] | select(IN("global", "repos") | not) | "unknown top-level field \(.)"]
      + (if .global == null then [] else (.global | global_errors($execution) | map("global: \(.)")) end)
      + (if .repos == null then []
         elif (.repos | type) != "object" then ["repos must be an object"]
         else [.repos | to_entries[] | .key as $r | .value | entry_errors($execution)[] | "repos.\($r): \(.)"] end)
    end;
'

current_repo() {
  local url
  url=$(git remote get-url origin 2>/dev/null) || return 0
  # git@host:owner/name.git or https://host/owner/name(.git) -> owner/name
  printf '%s' "$url" | sed -E 's#\.git$##; s#^.*[:/]([^/:]+/[^/]+)$#\1#'
}

read_config() {
  if [ ! -f "$CONFIG" ]; then echo '{}'; return; fi
  local errors
  errors=$(jq --argjson x "$EXECUTION_VALUES" "$JQ_RULES config_errors(\$x) | .[]" -r "$CONFIG" 2>&1) \
    || die 2 "$CONFIG is not valid JSON"
  [ -z "$errors" ] || die 2 "$CONFIG is invalid:
$errors"
  cat "$CONFIG"
}

parse_repo_flag() {
  REPO=""
  while [ $# -gt 0 ]; do
    case $1 in
      --repo) REPO=${2:?--repo needs owner/name}; shift 2 ;;
      *) die 2 "unknown argument $1" ;;
    esac
  done
  [ -n "$REPO" ] || REPO=$(current_repo)
}

cmd_detect() {
  parse_repo_flag "$@"
  local config gh_user top
  config=$(read_config)
  gh_user=$(gh api user --jq .login 2>/dev/null || true)
  top=$(git rev-parse --show-toplevel 2>/dev/null || true)
  jq -n --argjson config "$config" --arg path "$CONFIG" --arg repo "$REPO" \
    --arg gh "$gh_user" --arg top "$top" --argjson exists "$([ -f "$CONFIG" ] && echo true || echo false)" \
    --argjson openspec "$([ -n "$top" ] && [ -d "$top/openspec/changes" ] && echo true || echo false)" '
    { config_path: $path, config_exists: $exists, has_global: ($config.global != null),
      repo: (if $repo == "" then null else $repo end),
      repo_entry: (if $repo == "" then null else $config.repos[$repo] end),
      known_repos: ($config.repos // {} | keys),
      checkout: (if $top == "" then null else $top end),
      in_repo_openspec: (if $openspec then "openspec/changes" else null end),
      gh_user: (if $gh == "" then null else $gh end) }'
}

cmd_check() {
  parse_repo_flag "$@"
  [ -f "$CONFIG" ] || die 3 "no config at $CONFIG. Run /klases:code-reviewer setup to create it."
  local config
  config=$(read_config)
  jq -e '.global != null' >/dev/null <<<"$config" \
    || die 3 "$CONFIG has no global section. Run /klases:code-reviewer setup."
  jq --arg repo "$REPO" --arg path "$CONFIG" '
    (if $repo != "" then .repos[$repo] else null end) as $entry
    | { config_path: $path, repo: (if $repo == "" then null else $repo end),
        source: (if $entry then "repo" else "global" end),
        settings: (.global + ($entry // {}) + {spec_roots: ($entry.spec_roots // []), policy: ($entry.policy // [])}) }
  ' <<<"$config"
}

cmd_write() {
  local global="" repo="" entry="" apply=false
  while [ $# -gt 0 ]; do
    case $1 in
      --global) global=${2:?--global needs JSON}; shift 2 ;;
      --repo) repo=${2:?--repo needs owner/name}; shift 2 ;;
      --entry) entry=${2:?--entry needs JSON}; shift 2 ;;
      --apply) apply=true; shift ;;
      *) die 2 "unknown argument $1" ;;
    esac
  done
  local value rule target
  if [ -n "$global" ] && [ -z "$repo$entry" ]; then
    value=$global; rule=global_errors; target='.global = $v'
  elif [ -n "$repo" ] && [ -n "$entry" ] && [ -z "$global" ]; then
    case $repo in */*) ;; *) die 2 "--repo must be owner/name" ;; esac
    value=$entry; rule=entry_errors; target='.repos[$r] = $v'
  else
    die 2 "write takes --global JSON, or --repo owner/name with --entry JSON"
  fi
  jq -e . >/dev/null 2>&1 <<<"$value" || die 2 "the value is not valid JSON"
  local errors
  errors=$(jq -r --argjson x "$EXECUTION_VALUES" "$JQ_RULES $rule(\$x) | .[]" <<<"$value")
  [ -z "$errors" ] || die 2 "invalid value:
$errors"

  local old new
  old=$(read_config)
  if [ -n "$repo" ] && ! jq -e '.global != null' >/dev/null <<<"$old"; then
    die 2 "write the global section before adding a repo entry"
  fi
  new=$(jq --argjson v "$value" --arg r "$repo" "$target" <<<"$old")

  diff -u --label "$CONFIG (current)" --label "$CONFIG (proposed)" \
    <(jq . <<<"$old") <(jq . <<<"$new") || true
  if $apply; then
    mkdir -p "$(dirname "$CONFIG")"
    local tmp="$CONFIG.tmp.$$"
    jq . <<<"$new" >"$tmp" && mv "$tmp" "$CONFIG"
    echo "wrote $CONFIG"
  else
    echo "dry run: nothing written (pass --apply to write)"
  fi
}

ask() { # ask "prompt" "default" -> answer on stdout
  local answer
  read -r -p "$1${2:+ [$2]}: " answer </dev/tty
  printf '%s' "${answer:-$2}"
}

list_json() { # comma-separated text -> JSON list of trimmed strings
  jq -cn --arg s "$1" '$s | split(",") | map(gsub("^\\s+|\\s+$"; "")) | map(select(. != ""))'
}

cmd_wizard() {
  [ -t 0 ] || die 2 "the wizard needs a terminal; agents use detect, check and write"
  local config repo
  config=$(read_config)
  repo=$(current_repo)
  echo "code-reviewer config: $CONFIG"
  if ! jq -e '.global != null' >/dev/null <<<"$config"; then
    echo "Global settings apply to every repo without its own entry."
    local global
    global=$(jq -cn \
      --arg path "$(ask "Report file path; {owner}, {repo} and {id} are filled in" "~/notes/pr-reviews/{owner}_{repo}_{id}.md")" \
      --arg exec "$(ask "Execution: source-only, unit or unit+integration" "source-only")" \
      --arg gh "$(ask "gh account (blank for none)" "")" \
      --argjson focus "$(list_json "$(ask "Default focus, comma separated" "correctness,tests,maintainability")")" \
      '{report_path: $path, execution: $exec}
       + (if $gh == "" then {} else {gh_account: $gh} end)
       + (if $focus == [] then {} else {default_focus: $focus} end)')
    cmd_write --global "$global"
    [ "$(ask "Write this global section? y/n" "n")" = y ] || die 2 "nothing written"
    cmd_write --global "$global" --apply
  fi
  repo=$(ask "Repo to add or edit (owner/name, blank to stop)" "$repo")
  [ -n "$repo" ] || exit 0
  local entry
  entry=$(jq -cn \
    --arg path "$(ask "Report path override (blank keeps global)" "")" \
    --argjson specs "$(list_json "$(ask "Spec roots, comma separated (blank for none)" "")")" \
    --argjson policy "$(list_json "$(ask "Policy files, comma separated (blank for none)" "")")" \
    --arg exec "$(ask "Execution override (blank keeps global)" "")" \
    --arg gh "$(ask "gh account override (blank keeps global)" "")" \
    '{spec_roots: $specs, policy: $policy}
     + (if $path == "" then {} else {report_path: $path} end)
     + (if $exec == "" then {} else {execution: $exec} end)
     + (if $gh == "" then {} else {gh_account: $gh} end)')
  cmd_write --repo "$repo" --entry "$entry"
  [ "$(ask "Write this entry? y/n" "n")" = y ] || die 2 "nothing written"
  cmd_write --repo "$repo" --entry "$entry" --apply
}

case ${1:-} in
  detect) shift; cmd_detect "$@" ;;
  check) shift; cmd_check "$@" ;;
  write) shift; cmd_write "$@" ;;
  "") cmd_wizard ;;
  *) die 2 "unknown command $1 (detect, check, write, or none for the wizard)" ;;
esac
