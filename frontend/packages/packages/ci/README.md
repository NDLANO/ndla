# @ndla/ci

Scripts backing the repository's GitHub Actions. Private — never published.

`nx-cache-server.mts` serves the nx cache over HTTP on localhost during a CI job, backed by a directory
that `actions/cache` persists between runs.
