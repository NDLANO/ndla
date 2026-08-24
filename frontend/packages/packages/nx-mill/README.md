# @ndla/nx-mill

Places the backend's [Mill](https://mill-build.org) modules in the nx project graph, so
the same verbs drive both stacks: `nx dev article-api` alongside `nx dev ndla-frontend`.

Registered in the repository's `nx.json`, scoped to `backend/**`.

## How it works

- **`createNodesV2`** globs `backend/*/package.mill` and emits one nx project per module,
  with targets that shell out to `./mill` from `backend/`.
- **`createDependencies`** turns Mill's `moduleDeps` into graph edges, and adds the
  cross-stack edge from `@ndla/types-backend` to each component — the package's
  `openapi/<c>.json` and `src/<c>.ts` are generated _from_ those components, so a changed
  Tapir endpoint marks the TypeScript types, and the apps importing them, as affected.

Both read `moduleGraph`, a task in `backend/build.mill`. Mill's `moduleDeps` is a plain
`def` rather than a task, so it is invisible to `mill show`; `moduleGraph` walks the module
tree and emits the graph as JSON.

## Things worth knowing before changing this

- **`createNodesV2` runs on essentially every file change** while the nx daemon is up, so
  it must stay cheap. The hot path reads Mill's own `backend/out/moduleGraph.json`;
  spawning `./mill show moduleGraph` is the fallback for when that file is missing or was
  written by a different Mill version.
- **Editing this plugin does not invalidate the nx graph cache.** nx keys that on
  `{name, version, options}`, and a workspace-local plugin has no version. Run `nx reset`
  after changing anything here, or you will be testing the previous version.
- **nx applies `targetDefaults` on top of targets from non-core plugins**, per key — so
  what this file sets can be overridden from `nx.json`. That is why `nx.json` carries an
  `nx:run-commands` entry: nx resolves target defaults by executor in preference to target
  name, which is what keeps the frontend-shaped `test`/`build`/`dev` defaults away from
  these targets.
- Targets return through a forked worker process, so everything must be plain JSON.
