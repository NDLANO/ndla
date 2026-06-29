#!/usr/bin/env bash
#
# Regenerate the monorepo on top of the LATEST upstream `master` of every
# project, replaying the single "convert" commit as the last commit, so the
# history is always:
#
#     Initialize monorepo
#       Add 'backend/' from commit '<sha>'                  \
#       Add 'frontend/packages/' from commit '<sha>'         |  one `git subtree add`
#       Add 'frontend/ndla-frontend/' from commit '<sha>'    |  merge per project — the
#       Add 'frontend/editorial-frontend/' from commit '..'  |  FULL upstream history is
#       Add 'frontend/graphql-api/' from commit '<sha>'     /   merged in (reachable)
#     chore: assemble projects into monorepo  <- all monorepo-ization, one commit
#
# The subtree base is built with `git subtree add` (NOT a flat snapshot), so the
# entire upstream history of every project stays reachable in the monorepo:
# `git log`, `git blame -C`, and `git log <upstream-sha> -- <path>` all work.
# `git log --first-parent` shows just the clean spine above.
#
# Contrast with tools/sync-subtrees.sh, which appends `Sync ...` commits ON TOP
# of HEAD (continuous history). This instead REBUILDS the subtree base from the
# root commit at the newest upstream and re-applies the conversion as ONE commit
# on top, so the review surface is always just that final commit and it can be
# re-applied on every future sync.
#
# Because the base is rebuilt, the regenerated branch is NOT a descendant of the
# previous one: updating a shared branch (e.g. main) to it is a force-update,
# not a fast-forward merge.
#
# All work happens in a throwaway git worktree, so your current checkout — and a
# jj working copy — is never disturbed. On success the conversion branch ref is
# moved to the new commit (unless it is currently checked out, in which case the
# new commit id is printed for you to adopt).
#
# Assumes the conversion branch is exactly: <root> + one subtree commit per
# project + exactly ONE "convert" commit on top (the shape this script emits).
#
# Usage:
#   tools/resync-monorepo.sh                 # regenerate the 'convert-monorepo' branch
#   tools/resync-monorepo.sh <branch>        # regenerate a differently-named branch
#   tools/resync-monorepo.sh --continue      # finalize after resolving conflicts
#
# Requirements: bash 4+, git subtree, reachable upstream remotes, and (for
# lockfile regeneration) corepack-provided yarn. Run from anywhere in the repo.

set -euo pipefail

if [ "${BASH_VERSINFO[0]:-0}" -lt 4 ]; then
  echo "error: bash 4+ required (you have ${BASH_VERSION:-unknown})." >&2
  echo "       Run via the shebang (tools/resync-monorepo.sh) or use Homebrew bash." >&2
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

# The single yarn workspace; its lockfile is regenerated rather than carried,
# and per-project lockfiles under the workspace are dropped.
WORKSPACE_DIR="frontend"
WORKSPACE_LOCK="$WORKSPACE_DIR/yarn.lock"
STATE_FILE_REL="tools/subtree-state"

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

# Resume bookkeeping lives in the common git dir so it is shared across worktrees.
COMMON_DIR="$(git rev-parse --git-common-dir)"
case "$COMMON_DIR" in /*) ;; *) COMMON_DIR="$ROOT/$COMMON_DIR" ;; esac
RESUME_FILE="$COMMON_DIR/resync-resume"
STATE_TMP="$COMMON_DIR/resync-state"

ensure_remote() {
  local remote="$1"
  if ! git remote get-url "$remote" >/dev/null 2>&1; then
    echo "  remote '$remote' missing -> adding ${REMOTE_URLS[$remote]}"
    git remote add "$remote" "${REMOTE_URLS[$remote]}"
  fi
}

jj_hint() {
  local branch="$1" sha="$2"
  if [ -d "$ROOT/.jj" ]; then
    echo "Note: jj repo detected — run 'jj git import' to update the '$branch' bookmark to ${sha:0:12}."
  fi
}

# Drop per-project lockfiles and regenerate the single workspace lockfile.
regen_lockfiles() {
  local wt="$1" oldtip="$2" entry prefix remote branch
  for entry in "${PROJECTS[@]}"; do
    IFS=":" read -r prefix remote branch <<<"$entry"
    case "$prefix" in
      "$WORKSPACE_DIR"/*)
        [ -f "$wt/$prefix/yarn.lock" ] && git -C "$wt" rm -q -- "$prefix/yarn.lock"
        ;;
    esac
  done
  # Seed the workspace lock from the previous conversion so regeneration is an
  # incremental update (only drifted deps change), then reconcile it.
  git show "$oldtip:$WORKSPACE_LOCK" >"$wt/$WORKSPACE_LOCK" 2>/dev/null || true
  if command -v corepack >/dev/null 2>&1; then
    if ( cd "$wt/$WORKSPACE_DIR" && COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack yarn install --mode=update-lockfile ); then
      echo "  regenerated $WORKSPACE_LOCK"
    else
      echo "  warning: 'yarn install --mode=update-lockfile' failed; $WORKSPACE_LOCK may be stale — run 'yarn install' before building." >&2
    fi
  else
    echo "  warning: corepack/yarn not found; $WORKSPACE_LOCK seeded from previous commit — run 'yarn install' before building." >&2
  fi
}

# Write the new sync state, regenerate lockfiles, commit the single convert
# commit, move the branch to it, and clean up. Shared by the normal path and
# --continue.
finalize() {
  local wt="$1" branch="$2" oldtip="$3" final moved
  regen_lockfiles "$wt" "$oldtip"
  sort "$STATE_TMP" -o "$wt/$STATE_FILE_REL"
  git -C "$wt" add -A
  git -C "$wt" commit -q -F - <<'EOF'
chore: assemble projects into monorepo

Centralize CI, the frontend yarn workspace, and shared tooling on top
of the per-project subtree bases:

- hoist each project's .github/workflows into one root .github/,
  prefixing the workflow files by project
- add the unified frontend/ yarn workspace and regenerate a single
  frontend/yarn.lock, dropping the per-project lockfiles
- add the subtree sync tooling (tools/sync-subtrees.sh,
  tools/resync-monorepo.sh) and document it in the README

Replayed as one commit on a freshly rebuilt subtree base; the upstream
commit imported per prefix is recorded in tools/subtree-state.
EOF
  final="$(git -C "$wt" rev-parse HEAD)"

  if git branch -f "$branch" "$final" 2>/dev/null; then
    moved=1
  else
    moved=0
  fi

  git worktree remove --force "$wt"
  rm -f "$RESUME_FILE" "$STATE_TMP"

  echo
  echo "Done. '$branch' regenerated at ${final:0:12}:"
  git --no-pager log --oneline --first-parent "$final" | head -8
  echo "  ($(git rev-list --count "$final") commits reachable — full upstream history kept)"
  if [ "$moved" -eq 0 ]; then
    echo
    echo "  '$branch' is checked out, so its ref was not moved. Adopt the new commit with:"
    echo "      git branch -f $branch $final     # from a different branch"
    echo "      # or in jj:  jj bookmark set $branch -r $final"
  fi
  jj_hint "$branch" "$final"
}

# --- resume after conflict resolution -------------------------------------
if [ "${1:-}" = "--continue" ]; then
  if [ ! -f "$RESUME_FILE" ]; then
    echo "error: no resync in progress (no $RESUME_FILE)." >&2
    exit 1
  fi
  read -r r_branch r_wt r_oldtip <"$RESUME_FILE"
  if git -C "$r_wt" ls-files --unmerged | grep -q .; then
    echo "error: unresolved conflicts remain in $r_wt. Resolve, 'git add', then re-run --continue." >&2
    exit 1
  fi
  finalize "$r_wt" "$r_branch" "$r_oldtip"
  exit 0
fi

if [ -f "$RESUME_FILE" ]; then
  echo "error: a previous resync is unfinished. Resolve it and run 'tools/resync-monorepo.sh --continue'," >&2
  echo "       or abandon it: rm $RESUME_FILE and 'git worktree prune'." >&2
  exit 1
fi

BRANCH="${1:-convert-monorepo}"
git rev-parse --verify -q "$BRANCH^{commit}" >/dev/null \
  || { echo "error: branch '$BRANCH' not found." >&2; exit 1; }

CONV_TIP="$(git rev-parse "$BRANCH")"
BASE_TIP="$(git rev-parse "$BRANCH^")"
# The monorepo root is the oldest commit on the first-parent spine. (There are
# several root commits once upstream histories are merged in; --first-parent
# follows the monorepo line, not the upstreams.)
ROOT_COMMIT="$(git rev-list --first-parent "$BRANCH" | tail -1)"

echo "Regenerating '$BRANCH'"
echo "  conversion commit : ${CONV_TIP:0:12}  ($(git log -1 --format=%s "$CONV_TIP"))"
echo "  root commit       : ${ROOT_COMMIT:0:12}  ($(git log -1 --format=%s "$ROOT_COMMIT"))"

# Capture the conversion delta: everything the convert commit changes on top of
# its subtree base, EXCEPT yarn.lock files (regenerated separately).
PATCH="$(mktemp)"
git diff --binary --full-index "$BASE_TIP" "$CONV_TIP" -- . ':(glob,exclude)**/yarn.lock' >"$PATCH"

# Fresh detached worktree at the root commit; build the subtree base there with
# `git subtree add` so the full upstream history is merged in (reachable).
WORKTREE="$(mktemp -d)"; rmdir "$WORKTREE"
git worktree add -q --detach "$WORKTREE" "$ROOT_COMMIT"

: >"$STATE_TMP"
for entry in "${PROJECTS[@]}"; do
  IFS=":" read -r prefix remote branch <<<"$entry"
  echo "==> $prefix  (<- $remote/$branch)"
  ensure_remote "$remote"
  git fetch -q "$remote" "$branch"
  new="$(git rev-parse FETCH_HEAD)"
  git -C "$WORKTREE" subtree add -q --prefix="$prefix" "$new"
  echo "  imported ${new:0:12} (history merged)"
  echo "$prefix $new" >>"$STATE_TMP"
done

echo "==> replaying conversion commit"
if git -C "$WORKTREE" apply --3way --whitespace=nowarn "$PATCH"; then
  rm -f "$PATCH"
  finalize "$WORKTREE" "$BRANCH" "$CONV_TIP"
else
  rm -f "$PATCH"
  printf '%s %s %s\n' "$BRANCH" "$WORKTREE" "$CONV_TIP" >"$RESUME_FILE"
  echo >&2
  echo "  CONFLICT replaying the conversion commit onto the fresh base." >&2
  echo "  Resolve the conflicts in the worktree, e.g.:" >&2
  echo "      cd $WORKTREE" >&2
  echo "      git status                # see conflicted files" >&2
  echo "      \$EDITOR <files>; git add <files>" >&2
  echo "  Then finalize from the main repo:" >&2
  echo "      tools/resync-monorepo.sh --continue" >&2
  exit 1
fi
