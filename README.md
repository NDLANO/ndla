# NDLA

Monorepo for [NDLA](https://ndla.no) — the Norwegian Digital Learning Arena
(_Nasjonal digital læringsarena_), a platform for open educational resources.

The repository holds two stacks — JVM services in [`backend/`](backend) built with
[Mill](https://mill-build.org), and TypeScript/React apps in [`frontend/`](frontend) —
but you drive both with the same commands, from the repository root.

## Getting started

```sh
mise install     # language and runtime versions, pinned in mise.toml
pnpm install     # workspace dependencies
```

## Working with a component

Every component takes the same verbs, whether it is a Scala service or a React app:

```sh
nx dev article-api        nx dev ndla-frontend
nx test article-api       nx test ndla-frontend
nx type-check article-api nx type-check ndla-frontend
nx format article-api     nx format ndla-frontend
```

| Command | Backend (Mill) | Frontend (vite / vitest) |
|---|---|---|
| `nx dev <c>` | runs the service, restarting on source changes | dev server |
| `nx test <c>` | ScalaTest / JUnit | vitest |
| `nx type-check <c>` | `compile` | `tsc --noEmit` |
| `nx build <c>` | assembly jar | bundle |
| `nx format <c>` / `nx format-check <c>` | scalafmt, or spotless for `taxonomy-api` | oxfmt |
| `nx lint-es <c>` | — | eslint / oxlint |
| `nx copyright-check <c>` | copyright headers | — |
| `nx generate-types <c>` | regenerates `@ndla/types-backend` | — |
| `nx docker <c>` | builds the image | — |

Targets a component does not have are simply skipped, so `nx run-many -t test` and
`nx affected -t type-check lint-es format-check test` work across both stacks at once.

```sh
pnpm run check        # the above, for what your changes affect
pnpm run check-all    # ...for everything. Backend tests use Testcontainers, so this is slow
pnpm run graph        # both stacks in one dependency graph
nx show projects
```

The two stacks are genuinely connected: each backend component generates its slice of
`@ndla/types-backend`, so changing a Tapir endpoint marks the TypeScript types — and the
frontend apps that import them — as affected.

Backend services expect PostgreSQL, Elasticsearch and Redis on their default local ports;
nothing in this repository starts them for you yet.

## Underneath

nx orchestrates, but each stack keeps its own build tool, and you can always drop down to
it — see [`backend/README.md`](backend/README.md) and [`frontend/README.md`](frontend/README.md).

## License

[GPL-3.0](LICENSE)
