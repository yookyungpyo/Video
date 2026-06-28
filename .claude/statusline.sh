#!/usr/bin/env bash
# OpenMontage status line
# Receives Claude Code status JSON on stdin, prints a single line:
#   <model>  <dir> ⎇ <branch> <git-changes>  HF:<balance>
#
# Notes:
# - Model / dir / branch / git changes are computed live.
# - Higgsfield balance is read from a cache file written by the agent
#   (the shell cannot call MCP). A trailing "*" means the cache is stale.

input=$(cat)

# ---- parse stdin JSON ----------------------------------------------------
model=$(printf '%s' "$input" | jq -r '.model.display_name // "?"')
cur_dir=$(printf '%s' "$input" | jq -r '.workspace.current_dir // .cwd // "."')

dir_name=$(basename "$cur_dir")

# ---- git branch + change summary ----------------------------------------
branch_part=""
changes_part=""
if git -C "$cur_dir" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  branch=$(git -C "$cur_dir" rev-parse --abbrev-ref HEAD 2>/dev/null)
  [ -n "$branch" ] && branch_part=" ⎇ ${branch}"

  porc=$(git -C "$cur_dir" status --porcelain 2>/dev/null)
  if [ -n "$porc" ]; then
    n_mod=$(printf '%s\n' "$porc" | grep -cE '^.?M')
    n_add=$(printf '%s\n' "$porc" | grep -cE '^(A|\?\?)')
    n_del=$(printf '%s\n' "$porc" | grep -cE '^.?D')
    changes_part="~${n_mod} +${n_add} -${n_del}"
  else
    changes_part="clean"
  fi
fi

# ---- Higgsfield balance (from agent-written cache) -----------------------
hf_cache="${HOME}/.claude/higgsfield_balance.json"
hf_part="HF:—"
if [ -f "$hf_cache" ]; then
  cred=$(jq -r '.credits // empty' "$hf_cache" 2>/dev/null)
  ts=$(jq -r '.ts // 0' "$hf_cache" 2>/dev/null)
  if [ -n "$cred" ]; then
    now=$(date +%s)
    age=$(( now - ts ))
    mark=""
    [ "$age" -gt 3600 ] && mark="*"
    hf_part="HF:${cred}${mark}"
  fi
fi

# ---- compose colored line ------------------------------------------------
DIM=$'\033[2m'; CYAN=$'\033[36m'; GREEN=$'\033[32m'
YELLOW=$'\033[33m'; MAGENTA=$'\033[35m'; RESET=$'\033[0m'

printf '%s%s%s  %s%s%s%s%s%s  %s%s%s  %s%s%s' \
  "$DIM" "$model" "$RESET" \
  "$CYAN" "$dir_name" "$RESET" \
  "$GREEN" "$branch_part" "$RESET" \
  "$YELLOW" "$changes_part" "$RESET" \
  "$MAGENTA" "$hf_part" "$RESET"
