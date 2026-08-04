// Yarn 4 only ever loads `yarn.config.cjs` from the project root, and only as CommonJS — there
// is no `yarn.config.ts`. So the real implementation lives in a workspace, where it gets the
// packages/ tooling (tsc, oxlint, oxfmt, vitest), and this file just forwards to it.
//
// Imported by relative path rather than by package name: the path is provably outside
// node_modules, where Node refuses to strip types, and it needs no install state to resolve.
module.exports = {
  async constraints(context) {
    const { constraints } = await import("./packages/packages/repo-tools/src/yarn-constraints.mts");
    return constraints(context);
  },
};
