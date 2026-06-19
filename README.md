# NDLA monorepo

This repository consolidates NDLA's previously separate repositories into a
single monorepo while preserving each repository's full git history. The
individual projects were imported with `git subtree` and continue to build
exactly as they did in their original repositories.

## Layout

```
backend/                      # Scala/Java services, built with Mill
frontend/
  packages/                   # @ndla/* packages (yarn workspaces + Lerna + Nx)
  ndla-frontend/              # public-facing frontend (React/Vite SSR)
  editorial-frontend/         # editorial frontend (React/Vite)
  graphql-api/                # GraphQL gateway (Express + Apollo)
tools/
  sync-subtrees.sh            # pull latest master of each upstream repo
```

Each project keeps its own `package.json` / build configuration / `Dockerfile`
/ `.github` directory. No build tooling has been unified yet — `nx` orchestrates
the frontend side and `mill` the backend side, unchanged.

## Source repositories

| Path | Upstream |
|---|---|
| `backend/` | `git@github.com:ndlano/backend.git` |
| `frontend/packages/` | `git@github.com:ndlano/frontend-packages.git` |
| `frontend/ndla-frontend/` | `git@github.com:ndlano/ndla-frontend.git` |
| `frontend/editorial-frontend/` | `git@github.com:ndlano/editorial-frontend.git` |
| `frontend/graphql-api/` | `git@github.com:ndlano/graphql-api.git` |

## Syncing from the upstream repos

While the original repositories are still the source of truth, pull their latest
`master` into the monorepo with:

```sh
tools/sync-subtrees.sh
```

This runs `git subtree pull` for every project (one-way: upstream → monorepo).
Run it on a clean working tree. Requires a git that ships `git subtree`
(e.g. Homebrew git); Apple's `/usr/bin/git` does not include it.
