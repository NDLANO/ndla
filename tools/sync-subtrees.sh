#!/usr/bin/env bash
#
# Pull the latest `master` of each upstream repository into the monorepo
# (one-way sync: upstream -> monorepo). Each project lives under a prefix and
# was originally imported with `git subtree add`.
#
# Usage:
#   tools/sync-subtrees.sh            # sync all projects
#   tools/sync-subtrees.sh backend    # sync only the named project(s)
#
# Requirements:
#   - A git that ships `git subtree` (e.g. Homebrew git). Apple's /usr/bin/git
#     does NOT include it.
#   - A clean working tree (commit or stash local changes first).
#   - The named remotes must exist (see `git remote -v`). They are created once
#     during the initial assembly; recreate with the URLs below if missing.

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

# Upstream URLs, used to (re)create remotes if they are missing.
declare -A REMOTE_URLS=(
  [backend]="git@github.com:ndlano/backend.git"
  [frontend-packages]="git@github.com:ndlano/frontend-packages.git"
  [ndla-frontend]="git@github.com:ndlano/ndla-frontend.git"
  [editorial-frontend]="git@github.com:ndlano/editorial-frontend.git"
  [graphql-api]="git@github.com:ndlano/graphql-api.git"
)

cd "$(git rev-parse --show-toplevel)"

if [ ! -x "$(git --exec-path)/git-subtree" ] && ! command -v git-subtree >/dev/null 2>&1; then
  echo "error: 'git subtree' is not available in this git." >&2
  echo "       Install Homebrew git (brew install git) and ensure it precedes /usr/bin/git on PATH." >&2
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "error: working tree is not clean. Commit or stash changes before syncing." >&2
  exit 1
fi

ensure_remote() {
  local remote="$1"
  if ! git remote get-url "$remote" >/dev/null 2>&1; then
    echo "  remote '$remote' missing -> adding ${REMOTE_URLS[$remote]}"
    git remote add "$remote" "${REMOTE_URLS[$remote]}"
  fi
}

# Returns 0 if $prefix/$remote should be synced given the CLI filters in FILTERS.
want() {
  local prefix="$1" remote="$2"
  [ "${#FILTERS[@]}" -eq 0 ] && return 0   # no filter -> sync everything
  local f
  for f in "${FILTERS[@]}"; do
    if [ "$f" = "$prefix" ] || [ "$f" = "$remote" ] || [ "$(basename "$prefix")" = "$f" ]; then
      return 0
    fi
  done
  return 1
}

FILTERS=("$@")

for entry in "${PROJECTS[@]}"; do
  IFS=":" read -r prefix remote branch <<<"$entry"
  if ! want "$prefix" "$remote"; then
    continue
  fi
  echo "==> $prefix  (<- $remote/$branch)"
  ensure_remote "$remote"
  git subtree pull --prefix="$prefix" "$remote" "$branch"
done

echo "Done."
