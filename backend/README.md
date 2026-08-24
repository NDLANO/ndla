# NDLA backend

This is a [mill multi-file project](https://mill-build.org/mill/large/multi-file-builds.html) repository for NDLA scala backend projects.

This means this contains all scala backend components for the NDLA project.
There will be more detailed README's in the respective subdirectories.

## Developer documentation

Day to day, drive these modules with `nx` from the repository root — the same verbs work
for the frontend apps. Substitute `article-api` with the subproject you want to work on.

**Run a service:** `nx dev article-api` (restarts when you change its sources)

**Run tests:** `nx test article-api`

**Compile subproject:** `nx type-check article-api`

**Check code formatting:** `nx format-check article-api`

**Automatically format code files:** `nx format article-api`

**Create Docker Image:** `nx docker article-api`

**Generate typescript files:** `nx generate-types article-api`

Any target can be run for _all_ projects with `nx run-many -t <target>`, or for only the
projects affected by your changes with `nx affected -t <target>`. See the
[root README](../README.md).

### Underneath: Mill

nx only shells out to Mill, which still owns compilation, incremental state and its own
task graph. Run it directly whenever you want to — from this directory:

**Compile subproject**: `./mill article-api.compile`

**Run tests:** `./mill article-api.test`

**Run a service:** `./mill article-api.run`, or `./dev.sh article-api` to restart it on
source changes. (`./mill -w article-api.run` does *not* work: `run` never returns, so
Mill's watch loop never gets control. `dev.sh` uses `runBackground` instead, and stops the
service when you exit.)

**Create Docker Image:** `./build.sh article-api`

**Check code formatting:** `./checkfmt.sh`

**Automatically format code files:** `./fmt.sh`

`fmt.sh` and `checkfmt.sh` cover the whole tree including the Mill build files themselves
(`--meta-level=1`), which the per-module `nx format` targets do not.

**Generate typescript files:** `./mill article-api.generateTypescript`

**The module graph as JSON:** `./mill show moduleGraph` — this is what the
[`@ndla/nx-mill`](../frontend/packages/packages/nx-mill) plugin reads to place these
modules in the nx graph.

You could run the tasks directly to execute the tasks for _all_ subprojects (IE: `./mill _.test`), this however can take a long time and in some cases even fail because of dependencies or jvm memory problems. We should improve upon this in the future, but for now it imposes no real problems.

### IntelliJ jvm options

When using IntelliJ it is useful to setup required [jvmoptions](jvm-runtime-options) in templates for `scalatest` under
run/debug configurations.
