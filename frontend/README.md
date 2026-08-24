# NDLA frontend

This is a [pnpm workspace](https://pnpm.io/workspaces) repository, orchestrated with
[nx](https://nx.dev), for NDLA typescript frontend projects.

This means this contains all typescript frontend components for the NDLA project.
There will be more detailed README's in the respective subdirectories.

The workspace contains four applications — [`ndla-frontend`](ndla-frontend) (ndla.no),
[`editorial-frontend`](editorial-frontend) (ed.ndla.no), [`graphql-api`](graphql-api) and
[`api-documentation`](api-documentation) (api.ndla.no) plus the shared [`packages`](packages)
they are built from.

The workspace root is the **repository root**, one level up — that is where
`package.json`, `pnpm-workspace.yaml` and `nx.json` live, and where you run commands from.
The backend's Mill modules are in the same nx graph, so the verbs below work there too.

## Developer documentation

**Install dependencies:** `pnpm install`

Substitute `ndla-frontend` with the project you want to work on.

**Start an app:** `nx dev ndla-frontend`

**Run tests:** `nx test ndla-frontend`

**Type-check:** `nx type-check ndla-frontend`

**Lint:** `nx lint-es ndla-frontend`

**Check code formatting:** `nx format-check ndla-frontend`

**Automatically format code files:** `nx format ndla-frontend`

**Run {types, lint, format, tests}:** `pnpm run check` for what your changes affect, or
`pnpm run check-all` for everything — note that this now includes the backend's
Testcontainers-based tests and takes a while.

Any target can be run for _all_ projects with `nx run-many -t <target>`, or for only the projects
affected by your changes with `nx affected -t <target>`. nx caches task results, so re-running an
unchanged target is close to free.

Storybook is not an nx target: `pnpm --filter frontend-packages run start`.

### Developing against a local backend

`ndla-frontend` talks to the hosted test API by default. To point it at a locally running
`graphql-api`, start that in one terminal and the app in another:

```sh
nx dev graphql-api
pnpm --filter ndla-frontend run start-with-local-graphql
```

`nx dev article-api` (and the other backend services) work the same way — see the
[root README](../README.md).
