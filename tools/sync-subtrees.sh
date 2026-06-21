#!/usr/bin/env bash
#
# Pull the latest `master` of each upstream repository into the monorepo
# (one-way sync: upstream -> monorepo) WITHOUT creating merge commits.
#
# Each project lives under a prefix and was originally imported with
# `git subtree add`. Rather than `git subtree pull` (which creates a merge
# commit and drags every upstream commit into our history), this applies the
# net diff of the upstream changes since the last sync as a single, ordinary
# commit under the prefix. History stays linear.
#
# How it works, per project:
#   1. fetch the upstream branch
#   2. diff <last-synced-upstream-commit>..<new-upstream-commit>
#   3. `git apply --3way` that diff under the prefix (3-way merge on conflict)
#   4. commit the result as one regular commit and record the new sync point
#
# The last-synced upstream commit per prefix is tracked in tools/subtree-state
# (committed, so it survives clones and works across machines).
#
# Usage:
#   tools/sync-subtrees.sh                  # sync all projects
#   tools/sync-subtrees.sh ndla-frontend    # sync only the named project(s)
#   tools/sync-subtrees.sh --continue        # finalize after resolving conflicts
#
# Requirements: a clean working tree; run from anywhere inside the repo.

set -euo pipefail

if [ "${BASH_VERSINFO[0]:-0}" -lt 4 ]; then
  echo "error: bash 4+ required (you have ${BASH_VERSION:-unknown})." >&2
  echo "       Run via the shebang (tools/sync-subtrees.sh) or use Homebrew bash." >&2
  exit 1
fi

# prefix : remote : branch  (remote name == upstream repo name)
PROJECTS=(
  "backend:backend:master"
  "frontend/packages:frontend-packages:master"
  "frontend/ndla-frontend:ndla-frontend:master"
  "frontend/editorial-frontend:editorial-frontend:master"
  "frontend/graphql-api:graphql-api:master"
)

# Paths the monorepo manages centrally and therefore does NOT sync from
# upstream: per-project lockfiles (replaced by the single root yarn.lock) and
# per-project CI (consolidated into the root .github/workflows). These were
# deleted from the prefixes, so upstream edits to them can't apply; drop them
# from the incoming diff. Matched against the upstream repo root.
SYNC_EXCLUDES=(
  ':(top,exclude)yarn.lock'
  ':(top,exclude).github'
)

# Upstream URLs, used to (re)create remotes if they are missing.
declare -A REMOTE_URLS=(
  [backend]="git@github.com:ndlano/backend.git"
  [frontend-packages]="git@github.com:ndlano/frontend-packages.git"
  [ndla-frontend]="git@github.com:ndlano/ndla-frontend.git"
  [editorial-frontend]="git@github.com:ndlano/editorial-frontend.git"
  [graphql-api]="git@github.com:ndlano/graphql-api.git"
)

ROOT="$(git rev-parse --show-toplevel)"
STATE_FILE="$ROOT/tools/subtree-state"
GIT_DIR="$(git rev-parse --git-dir)"
RESUME_FILE="$GIT_DIR/subtree-sync-resume"

cd "$ROOT"

get_baseline() {
  local prefix="$1"
  awk -v p="$prefix" '$1==p{print $2}' "$STATE_FILE" 2>/dev/null | tail -1
}

set_baseline() {
  local prefix="$1" sha="$2" tmp
  tmp="$(mktemp)"
  grep -v -E "^${prefix} " "$STATE_FILE" 2>/dev/null >"$tmp" || true
  echo "$prefix $sha" >>"$tmp"
  sort -o "$tmp" "$tmp"
  mv "$tmp" "$STATE_FILE"
}

ensure_remote() {
  local remote="$1"
  if ! git remote get-url "$remote" >/dev/null 2>&1; then
    echo "  remote '$remote' missing -> adding ${REMOTE_URLS[$remote]}"
    git remote add "$remote" "${REMOTE_URLS[$remote]}"
  fi
}

require_clean_tree() {
  if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "error: working tree is not clean. Commit or stash changes first." >&2
    exit 1
  fi
}

# Commit a finished sync for a prefix and advance its baseline.
finalize() {
  local prefix="$1" new="$2" remote="$3"
  set_baseline "$prefix" "$new"
  git add -A "$prefix" "$STATE_FILE"
  git commit -q -m "Sync $prefix from $remote ${new:0:12}"
  echo "  committed sync for $prefix at ${new:0:12}"
}

# --- resume after conflict resolution -------------------------------------
if [ "${1:-}" = "--continue" ]; then
  if [ ! -f "$RESUME_FILE" ]; then
    echo "error: no sync in progress (no $RESUME_FILE)." >&2
    exit 1
  fi
  read -r prefix new remote <"$RESUME_FILE"
  if git ls-files --unmerged -- "$prefix" | grep -q .; then
    echo "error: unresolved conflicts remain under $prefix. Resolve, 'git add', then re-run --continue." >&2
    exit 1
  fi
  finalize "$prefix" "$new" "$remote"
  rm -f "$RESUME_FILE"
  echo "Done. Re-run the script for any remaining projects."
  exit 0
fi

require_clean_tree
if [ -f "$RESUME_FILE" ]; then
  echo "error: a previous sync is unfinished. Run 'tools/sync-subtrees.sh --continue' first." >&2
  exit 1
fi

FILTERS=("$@")
want() {
  local prefix="$1" remote="$2"
  [ "${#FILTERS[@]}" -eq 0 ] && return 0
  local f
  for f in "${FILTERS[@]}"; do
    [ "$f" = "$prefix" ] || [ "$f" = "$remote" ] || [ "$(basename "$prefix")" = "$f" ] && return 0
  done
  return 1
}

for entry in "${PROJECTS[@]}"; do
  IFS=":" read -r prefix remote branch <<<"$entry"
  want "$prefix" "$remote" || continue

  echo "==> $prefix  (<- $remote/$branch)"
  ensure_remote "$remote"
  git fetch -q "$remote" "$branch"
  new="$(git rev-parse FETCH_HEAD)"
  base="$(get_baseline "$prefix")"

  if [ -z "$base" ]; then
    echo "  no baseline recorded in tools/subtree-state for $prefix; aborting." >&2
    exit 1
  fi
  if [ "$base" = "$new" ]; then
    echo "  already up to date (${new:0:12})"
    continue
  fi

  count="$(git rev-list --count "$base".."$new")"
  echo "  applying $count upstream commit(s): ${base:0:12}..${new:0:12}"

  patch="$(mktemp)"
  git diff --binary --full-index "$base" "$new" -- ':(top)' "${SYNC_EXCLUDES[@]}" >"$patch"

  if [ ! -s "$patch" ]; then
    echo "  no file changes (merge-only range); advancing baseline"
    finalize "$prefix" "$new" "$remote"
    rm -f "$patch"
    continue
  fi

  if git apply --3way --whitespace=nowarn -p1 --directory="$prefix/" "$patch"; then
    rm -f "$patch"
    finalize "$prefix" "$new" "$remote"
  else
    rm -f "$patch"
    printf '%s %s %s\n' "$prefix" "$new" "$remote" >"$RESUME_FILE"
    echo
    echo "  CONFLICT applying upstream changes under $prefix." >&2
    echo "  Resolve the conflict markers, then:" >&2
    echo "      git add <resolved files>" >&2
    echo "      tools/sync-subtrees.sh --continue" >&2
    exit 1
  fi
done

echo "Done."
