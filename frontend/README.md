# NDLA frontend

This is a [pnpm workspace](https://pnpm.io/workspaces) repository, orchestrated with
[nx](https://nx.dev), for NDLA typescript frontend projects.

This means this contains all typescript frontend components for the NDLA project.
There will be more detailed README's in the respective subdirectories.

The workspace contains four applications — [`ndla-frontend`](ndla-frontend) (ndla.no),
[`editorial-frontend`](editorial-frontend) (ed.ndla.no), [`graphql-api`](graphql-api) and
[`api-documentation`](api-documentation) (api.ndla.no) plus the shared [`packages`](packages)
they are built from.

## Developer documentation

**Install dependencies and build packages:** `pnpm run setup`

**Start ndla-frontend:** `pnpm run dev:ndla`

**Start editorial-frontend:** `pnpm run dev:ed`

**Start graphql-api:** `pnpm run dev:gql`

**Start api-documentation:** `pnpm run dev:apidocs`

**Run {types, lint, format, tests}:** `pnpm run check-all`

Substitute `ndla-frontend` below with the project you want to work on.

**Run tests:** `pnpm exec nx test ndla-frontend`

**Type-check:** `pnpm exec nx type-check ndla-frontend`

**Check code formatting:** `pnpm exec nx format-check ndla-frontend`

**Automatically format code files:** `pnpm exec nx format ndla-frontend`

Any target can be run for _all_ projects with `pnpm exec nx run-many -t <target>`, or for only the projects
affected by your changes with `pnpm exec nx affected -t <target>`. nx caches task results, so re-running an
unchanged target is close to free.
