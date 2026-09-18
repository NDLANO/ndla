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

**Install dependencies:** `pnpm install`

**Start ndla-frontend:** `pnpm run dev:ndla`

**Start editorial-frontend:** `pnpm run dev:ed`

**Start graphql-api:** `pnpm run dev:gql`

**Start api-documentation:** `pnpm run dev:apidocs`

**Run {types, lint, format, tests}:** `pnpm run check-all`

**Lint (oxlint + eslint, every project):** `pnpm run lint`

**Lint and apply fixes:** `pnpm run lint:fix`

**Check code formatting:** `pnpm run format-check`

**Automatically format code files:** `pnpm run format`

Substitute `ndla-frontend` below with the project you want to work on.

**Lint:** `pnpm nx lint ndla-frontend`

**Run tests:** `pnpm nx test ndla-frontend`

**Type-check:** `pnpm nx type-check ndla-frontend`
