# @ndla/tools

Scripts backing the repository's GitHub Actions and mise tasks. Private — never published.

The scripts are run directly with `node` by path, so the package has no exports.

## `src/ci`

Backs the repository's GitHub Actions.

`nx-cache-server.mts` serves the nx cache over HTTP on localhost during a CI job, backed by a directory
that `actions/cache` persists between runs.

## `src/tasks`

Backs the repository's `mise tasks` to achieve one command surface over
the nx frontend workspace and the Mill backend.

```sh
mise run dev ndla-frontend
mise run test graphql-api
mise run format
mise run check
mise run projects
```

`format` and `check` take an optional project, and cover the whole repository
without one:

```sh
mise run format article-api
mise run check ndla-frontend
```

Each task lives in its own module next to `index.mts`, which only maps the task
name to it. Shared plumbing (paths, running commands in either half of the
repository, and the project lists) lives in `repo.mts`.

`dev` and `test` forward any extra arguments to nx or mill:

```sh
mise run test graphql-api graphql.GraphqlApiTest
```

### Running frontend apps in parallel

`dev` gives every frontend app the first free port at or above its base port,
so several copies can run at the same time. The chosen URL is printed before
nx starts. Run each copy from its own worktree: nx will not start a task that
is already running in the same checkout, and prints
`Waiting for <task> in another nx process` instead.

| App                  | Base port | Variable                  |
| -------------------- | --------- | ------------------------- |
| `ndla-frontend`      | 3000      | `NDLA_FRONTEND_PORT`      |
| `editorial-frontend` | 3000      | `EDITORIAL_FRONTEND_PORT` |
| `api-documentation`  | 3000      | `API_DOCUMENTATION_PORT`  |
| `graphql-api`        | 4000      | `LOCAL_GRAPHQL_API_PORT`  |
| `design-manual`      | 6006      | `SBCONFIG_PORT`           |

The port variables from your environment and `.mise.toml` are overridden. Use
`--port` to pin the port of the first app instead:

```sh
mise run dev ndla-frontend --port=3005
```

Name more apps to run them together. When `graphql-api` is one of them, the
frontends are pointed at that local instance (`LOCAL_GRAPHQL_API=true`):

```sh
mise run dev ndla-frontend graphql-api
```

Feide (`ndla-frontend`) and Auth0 (`editorial-frontend`) only accept the
localhost ports registered with them, and neither allows wildcards, so logging
in fails on any port outside that list.
