# @ndla/tasks

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
mise run dev ndla-frontend --port=3005
```
