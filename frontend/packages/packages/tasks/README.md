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

`dev` and `test` forward any extra arguments to nx or mill:

```sh
mise run test graphql-api graphql.GraphqlApiTest
mise run dev ndla-frontend --port=3005
```
