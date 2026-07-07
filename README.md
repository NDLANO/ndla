# NDLA

Monorepo for [NDLA](https://ndla.no) — the Norwegian Digital Learning Arena
(*Nasjonal digital læringsarena*), a platform for open educational resources.

## Layout

```
backend/        JVM backend services + shared modules   (built with Mill)
frontend/
  packages/       @ndla/* shared UI/utility packages      (Yarn workspaces + Lerna)
  ndla-frontend/  public-facing website                   (React + Vite, SSR)
  editorial-frontend/  content-production system          (React + Vite)
  graphql-api/    GraphQL gateway in front of the APIs     (Express + Apollo)
.github/        CI + release workflows (one pair per project)
```

The backend and frontend halves are independent: each keeps its own build
tooling, `package.json`/`build.mill`, `Dockerfile`, and per-project README. Mill
orchestrates the backend, Nx/Yarn the frontend. There is no unified root build.

## Backend (`backend/`)

JVM services built with [Mill](https://mill-build.org). Each `*-api` is a
standalone service (Tapir/HTTP + PostgreSQL and/or Elasticsearch); the remaining
directories are shared libraries and test infrastructure.

| Service | Responsibility |
|---|---|
| `article-api` | Published articles, with Elasticsearch search |
| `draft-api` | Article drafts used by the editorial tooling |
| `audio-api` | Audio files and podcasts |
| `image-api` | Image metadata, plus on-the-fly resize/crop |
| `concept-api` | Concepts / explanations |
| `learningpath-api` | Learning paths |
| `frontpage-api` | Data for front pages and subject pages |
| `taxonomy-api` | Organises and categorises content into subjects/topics |
| `search-api` | Aggregated search across the other APIs |
| `myndla-api` | MyNDLA: user folders, arena, users |
| `oembed-proxy` | oEmbed proxy for embedding external content |

Shared modules include `common`, `network`, `language`, `mapping`, `search`,
`validation`, `database`, and the `*testbase`/`scalatestsuite`/`tapirtesting`
test helpers. The `typescript` module generates the `@ndla/types-backend`
definitions consumed by the frontend.

Common tasks (run from `backend/`, substitute the service name):

```sh
./mill article-api.compile          # compile one service
./mill article-api.test             # run its tests
./build.sh article-api              # build its Docker image
./mill article-api.generateTypescript
./checkfmt.sh                       # check formatting   (./fmt.sh to fix)
```

See [`backend/README.md`](backend/README.md) and each service's README for details.

## Frontend (`frontend/`)

A Yarn 4 workspace tying together the shared packages, the two web apps, and the
GraphQL gateway; task running and caching are handled by Nx.

- **`packages/`** — the `@ndla/*` libraries (design system, primitives, icons,
  editor, converters, hooks, i18n, …). Styling is done with
  [Panda CSS](https://panda-css.com). Browse [`frontend/packages/packages/`](frontend/packages/packages)
  for the full list.
- **`ndla-frontend/`** — the public site (server-side rendered React).
- **`editorial-frontend/`** — the tool editors use to produce content.
- **`graphql-api/`** — the GraphQL layer the frontends query, aggregating the
  backend APIs.

Getting started (from `frontend/`):

```sh
yarn                 # install the whole workspace
yarn build:packages  # build the shared @ndla/* packages
```

Each app and package exposes its own scripts — `start`, `test`, `lint`,
`check-all`, `build` — via its `package.json`; run them with
`yarn workspace <name> <script>`. See [`frontend/packages/README.md`](frontend/packages/README.md)
and each app's README for specifics.

## Toolchain

Language and runtime versions are pinned per project so you don't have to guess:

- Backend — [`backend/mise.toml`](backend/mise.toml) (Java + Node for codegen).
- Frontend — the `engines` field and `packageManager` in
  [`frontend/package.json`](frontend/package.json).

Using [mise](https://mise.jdx.dev) is the easiest way to get the right versions;
`mise install` in a project directory sets them up. Docker is needed for the
backend integration tests (they use Testcontainers).

## Continuous integration

Every project has a CI workflow (and services additionally a release workflow) in
[`.github/workflows/`](.github/workflows), named `<project>_ci.yml`.

## License

[GPL-3.0](backend/LICENSE)
