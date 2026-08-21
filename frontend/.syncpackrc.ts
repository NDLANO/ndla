import { globSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { RcFile } from "syncpack";
import yaml from "yaml";

const root = dirname(fileURLToPath(import.meta.url));

const RUNTIME_TYPES = ["dependencies", "devDependencies"] as const;
const PEER_TYPES = ["peerDependencies"] as const;

type ManifestType = (typeof RUNTIME_TYPES)[number] | (typeof PEER_TYPES)[number];
type Manifest = Partial<Record<ManifestType, Record<string, string>>>;

/** Workspace globs, read from pnpm-workspace.yaml so the two can never drift apart. */
const workspaceGlobs: string[] =
  yaml.parse(readFileSync(`${root}/pnpm-workspace.yaml`, "utf8")).packages ?? [];

const manifests = ["package.json", ...workspaceGlobs.map((glob) => `${glob}/package.json`)].flatMap(
  (pattern) => globSync(pattern, { cwd: root }),
);

/** Names of every dependency of `types` declared by more than one package in the workspace. */
const sharedDependencies = (types: readonly ManifestType[]): string[] => {
  const declaredBy = new Map<string, Set<string>>();
  for (const manifest of manifests) {
    const json: Manifest = JSON.parse(readFileSync(`${root}/${manifest}`, "utf8"));
    for (const type of types) {
      for (const [name, specifier] of Object.entries(json[type] ?? {})) {
        if (
          specifier.startsWith("workspace:") ||
          specifier.startsWith("link:") ||
          specifier.startsWith("file:")
        ) {
          continue;
        }
        declaredBy.set(name, (declaredBy.get(name) ?? new Set()).add(manifest));
      }
    }
  }
  return [...declaredBy]
    .filter(([, packages]) => packages.size > 1)
    .map(([name]) => name)
    .sort();
};

const storybookDependencies = ["storybook", "@storybook/**"];
const catalogDependencies = [...sharedDependencies(RUNTIME_TYPES), ...storybookDependencies];

export default {
  versionGroups: [
    {
      label: "peerDependencies used by more than one package must live in the `peers` catalog",
      policy: "catalog",
      dependencyTypes: ["peer"],
      specifierTypes: ["!workspace-protocol", "!file", "!alias"],
      dependencies: sharedDependencies(PEER_TYPES),
    },
    {
      label: "peerDependencies of a single package stay local and deliberately wide",
      dependencyTypes: ["peer"],
      isIgnored: true,
    },
    {
      label: "Dependencies used by more than one package must live in the pnpm catalog",
      policy: "catalog",
      dependencyTypes: ["prod", "dev"],
      specifierTypes: ["!workspace-protocol", "!file", "!alias"],
      dependencies: catalogDependencies,
    },
  ],
} satisfies RcFile;
