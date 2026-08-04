/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  byPopularityThenRange,
  collectRangeUsage,
  compareStrings,
  groupCatalogableDependencies,
  isCatalogableRange,
  type RangeOption,
} from "@ndla/repo-tools/yarn-constraints";
import type { Yarn } from "@yarnpkg/types";

type Dependency = Yarn.Constraints.Dependency;

interface DependencyStub {
  workspace: string | null;
  ident: string;
  range: string;
  type?: Yarn.Constraints.DependencyType;
}

/**
 * The functions under test only read ident/range/type and the owning workspace's name, so a stub
 * standing in for the full engine-provided object is enough.
 */
const dep = ({ workspace, ident, range, type = "dependencies" }: DependencyStub): Dependency =>
  ({
    workspace: { ident: workspace, cwd: workspace ?? "." },
    ident,
    range,
    type,
  }) as Dependency;

describe("yarn-constraints", () => {
  describe("isCatalogableRange", () => {
    it.each(["^1.2.3", "1.x", ">=2 <3", "*", "2.0.0-beta.1"])("accepts the plain range %s", (range) => {
      expect(isCatalogableRange(range)).toBe(true);
    });

    it.each([
      "patch:react@npm%3A19.2.7#./.yarn/patches/react.patch",
      "link:../local",
      "file:./vendor/thing.tgz",
      "portal:../sibling",
      "npm:other-package@^1.0.0",
      "https://example.com/thing.tgz",
    ])("rejects the protocol range %s", (range) => {
      expect(isCatalogableRange(range)).toBe(false);
    });
  });

  describe("groupCatalogableDependencies", () => {
    it("groups every remaining use of an ident together", () => {
      const deps = [
        dep({ workspace: "app", ident: "react", range: "^19.0.0" }),
        dep({ workspace: "ui", ident: "react", range: "^19.2.0" }),
        dep({ workspace: "ui", ident: "vite", range: "^7.0.0" }),
      ];

      const grouped = groupCatalogableDependencies(deps);

      expect([...grouped.keys()]).toEqual(["react", "vite"]);
      expect(grouped.get("react")).toHaveLength(2);
    });

    it("drops peerDependencies, which are support floors rather than pinned versions", () => {
      const deps = [
        dep({ workspace: "ui", ident: "react", range: ">= 18", type: "peerDependencies" }),
        dep({ workspace: "ui", ident: "react", range: "^19.2.0", type: "devDependencies" }),
      ];

      const grouped = groupCatalogableDependencies(deps);

      expect(grouped.get("react")).toEqual([expect.objectContaining({ type: "devDependencies" })]);
    });

    it("drops workspace: refs, which are internal", () => {
      const deps = [dep({ workspace: "app", ident: "@ndla/ui", range: "workspace:^" })];

      expect(groupCatalogableDependencies(deps).size).toBe(0);
    });
  });

  describe("collectRangeUsage", () => {
    it("counts a workspace once even when it lists the ident twice", () => {
      const deps = [
        dep({ workspace: "ui", ident: "react", range: "^19.2.0", type: "dependencies" }),
        dep({ workspace: "ui", ident: "react", range: "^19.2.0", type: "devDependencies" }),
        dep({ workspace: "app", ident: "react", range: "^19.2.0" }),
      ];

      expect(collectRangeUsage(deps)).toEqual(new Map([["^19.2.0", ["app", "ui"]]]));
    });

    it("keeps disagreeing ranges apart", () => {
      const deps = [
        dep({ workspace: "ui", ident: "react", range: "^19.2.0" }),
        dep({ workspace: "app", ident: "react", range: "^19.0.0" }),
      ];

      expect(collectRangeUsage(deps)).toEqual(
        new Map([
          ["^19.2.0", ["ui"]],
          ["^19.0.0", ["app"]],
        ]),
      );
    });

    it("ignores uses that already point at the catalog", () => {
      const deps = [
        dep({ workspace: "ui", ident: "react", range: "catalog:" }),
        dep({ workspace: "app", ident: "react", range: "catalog:" }),
      ];

      expect(collectRangeUsage(deps).size).toBe(0);
    });

    it("names the root workspace by its path, since it has no ident", () => {
      const deps = [dep({ workspace: null, ident: "react", range: "^19.2.0" })];

      expect(collectRangeUsage(deps)).toEqual(new Map([["^19.2.0", ["."]]]));
    });
  });

  describe("byPopularityThenRange", () => {
    it("puts the most-requested range first, so option 1 is the majority choice", () => {
      const options: RangeOption[] = [
        ["^19.0.0", ["app"]],
        ["^19.2.0", ["ui", "editor"]],
      ];

      expect([...options].sort(byPopularityThenRange)).toEqual([
        ["^19.2.0", ["ui", "editor"]],
        ["^19.0.0", ["app"]],
      ]);
    });

    it("breaks ties alphabetically, so the prompt order is stable", () => {
      const options: RangeOption[] = [
        ["^19.2.0", ["ui"]],
        ["^19.0.0", ["app"]],
      ];

      expect([...options].sort(byPopularityThenRange)).toEqual([
        ["^19.0.0", ["app"]],
        ["^19.2.0", ["ui"]],
      ]);
    });
  });

  describe("compareStrings", () => {
    it("is a total order, reporting equal strings as equal", () => {
      expect(compareStrings("a", "a")).toBe(0);
      expect(compareStrings("a", "b")).toBeLessThan(0);
      expect(compareStrings("b", "a")).toBeGreaterThan(0);
    });
  });
});
