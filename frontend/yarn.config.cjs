const { readFileSync } = require("node:fs");
const path = require("node:path");
const yaml = require("yaml");

function catalogNames() {
  const yarnrc = yaml.parse(readFileSync(path.join(__dirname, ".yarnrc.yml"), "utf8"));
  return new Set(Object.keys(yarnrc?.catalog ?? {}));
}

module.exports = {
  async constraints({ Yarn }) {
    const catalog = catalogNames();
    for (const dep of Yarn.dependencies()) {
      // peerDependencies keep intentionally-broad ranges; workspace refs are internal.
      if (dep.type === "peerDependencies") continue;
      if (dep.range.startsWith("workspace:")) continue;
      if (!catalog.has(dep.ident)) continue;
      // A cataloged dependency must use the catalog, not a hardcoded range.
      dep.update("catalog:");
    }
  },
};
