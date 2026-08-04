export default {
  versionGroups: [
    {
      label: "peerDependencies are ranges, not pinned versions",
      dependencyTypes: ["peer"],
      isIgnored: true,
    },
    {
      label: "resolutions are deliberate overrides of nested ranges",
      dependencyTypes: ["resolutions"],
      isIgnored: true,
    },
  ],
  semverGroups: [
    {
      label: "peerDependencies are ranges, not pinned versions",
      dependencyTypes: ["peer"],
      isIgnored: true,
    },
  ],

  dependencyGroups: [
    {
      aliasName: "peerDependencies",
      dependencyTypes: ["peer"],
    },
  ],
} satisfies import("syncpack").RcFile;
