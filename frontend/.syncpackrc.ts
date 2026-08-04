export default {
  versionGroups: [
    {
      label: "peerDependencies are support floors, not pinned versions",
      dependencyTypes: ["peer"],
      isIgnored: true,
    },
    {
      label: "resolutions are deliberate overrides of nested ranges",
      dependencyTypes: ["resolutions"],
      isIgnored: true,
    },
  ],
  updateGroups: [
    {
      label: "peerDependencies are support floors, not pinned versions",
      dependencyTypes: ["peer"],
      isIgnored: true,
    },
  ],
} satisfies import("syncpack").RcFile;
