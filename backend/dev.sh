#!/usr/bin/env bash
# Runs a backend service and restarts it when its sources change.
#
# `./mill -w <module>.run` does not work for this: `run` never returns, so Mill's watch
# loop never gets control and nothing is ever rebuilt. `runBackground` returns as soon as
# the service is up, which lets `-w` recompile and restart it on change. The trade-off is
# that the service outlives the watch loop, so stop it on the way out.
set -euo pipefail

MODULE="${1:-}"
if [ -z "$MODULE" ]; then
    echo "This script requires an argument for the module to run, e.g. ./dev.sh article-api" >&2
    exit 1
fi

# Written by Mill's runBackground; the only handle we get on the detached process.
PID_FILE="out/$MODULE/runBackground.dest/currently-running-pid"

stop() {
    [ -f "$PID_FILE" ] || return 0
    PID="$(cat "$PID_FILE" 2>/dev/null || true)"
    [ -n "$PID" ] || return 0
    kill "$PID" 2>/dev/null || true
}
trap stop EXIT INT TERM

./mill -w "$MODULE.runBackground"
