/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  buildRules,
  droppedIntegrityHash,
  type Problem,
  type Rule,
  scanFile,
  type Versions,
} from "@ndla/repo-tools/sync-versions";

const VERSIONS: Versions = { node: "24.13.1", yarn: "4.17.1", alpine: "3.23", javaMajor: "25" };

const rulesFor = (file: string, label: string): Rule[] =>
  buildRules(VERSIONS).filter((rule) => rule.file === file && rule.label === label);

const stale = (problems: Problem[]) => problems.filter((problem) => problem.kind === "stale");

describe("sync-versions", () => {
  describe("buildRules", () => {
    it("derives the node base image from the node and alpine pins together", () => {
      const [rule] = rulesFor("frontend/ndla-frontend/Dockerfile", "node base image");

      expect(rule?.expected).toBe("24.13.1-alpine3.23");
    });

    it("pins engines.node to the major only, since it is a floor rather than an exact version", () => {
      const [rule] = rulesFor("frontend/package.json", "engines.node");

      expect(rule?.expected).toBe(">=24");
    });

    it("covers the backend, which shares the java and yarn pins", () => {
      const files = new Set(buildRules(VERSIONS).map((rule) => rule.file));

      expect(files).toContain("backend/Dockerfile");
      expect(files).toContain("backend/typescript/types-backend/package.json");
    });
  });

  describe("scanFile", () => {
    it("reports nothing and changes nothing when the pin already matches", () => {
      const text = "FROM node:24.13.1-alpine3.23 AS builder\nRUN echo hi\n";

      const result = scanFile(text, rulesFor("frontend/ndla-frontend/Dockerfile", "node base image"));

      expect(result.problems).toEqual([]);
      expect(result.text).toBe(text);
    });

    it("rewrites a stale pin and reports where it was", () => {
      const text = "# syntax=docker/dockerfile:1\nFROM node:20.0.0-alpine3.19 AS builder\n";

      const result = scanFile(text, rulesFor("frontend/ndla-frontend/Dockerfile", "node base image"));

      expect(result.text).toContain("FROM node:24.13.1-alpine3.23");
      expect(stale(result.problems)).toEqual([
        {
          kind: "stale",
          file: "frontend/ndla-frontend/Dockerfile",
          label: "node base image",
          line: 2,
          expected: "24.13.1-alpine3.23",
          found: "20.0.0-alpine3.19",
        },
      ]);
    });

    it("goes blind rather than silent when a pin it owns has disappeared", () => {
      const result = scanFile("FROM scratch\n", rulesFor("frontend/ndla-frontend/Dockerfile", "node base image"));

      expect(result.problems).toEqual([
        { kind: "blind", file: "frontend/ndla-frontend/Dockerfile", label: "node base image" },
      ]);
    });

    it("finds engines.node across the whitespace of a formatted manifest", () => {
      const text = '{\n  "name": "x",\n  "engines": {\n    "node": ">=20"\n  }\n}\n';

      const result = scanFile(text, rulesFor("frontend/package.json", "engines.node"));

      expect(result.text).toContain('"node": ">=24"');
      expect(stale(result.problems)).toHaveLength(1);
    });

    describe("packageManager", () => {
      const rules = rulesFor("frontend/package.json", "packageManager");

      it("ignores the opaque integrity suffix when the version already matches", () => {
        const text = '{\n  "packageManager": "yarn@4.17.1+sha512.ccbfabf7"\n}\n';

        const result = scanFile(text, rules);

        expect(result.problems).toEqual([]);
        expect(result.text).toBe(text);
      });

      it("replaces the whole value, hash included, when the version is stale", () => {
        const text = '{\n  "packageManager": "yarn@4.0.0+sha512.deadbeef"\n}\n';

        const result = scanFile(text, rules);

        expect(result.text).toContain('"packageManager": "yarn@4.17.1"');
        expect(result.text).not.toContain("deadbeef");
      });
    });

    it("keeps reporting per match when a file pins the same thing more than once", () => {
      const text = "FROM node:20.0.0-alpine3.19 AS builder\nFROM node:20.0.0-alpine3.19 AS runner\n";

      const result = scanFile(text, rulesFor("frontend/ndla-frontend/Dockerfile", "node base image"));

      expect(stale(result.problems).map((problem) => problem.kind === "stale" && problem.line)).toEqual([1, 2]);
    });
  });

  describe("droppedIntegrityHash", () => {
    it("is true once a rewritten pin carried a hash, so the run can say so", () => {
      const text = '{\n  "packageManager": "yarn@4.0.0+sha512.deadbeef"\n}\n';

      const { problems } = scanFile(text, rulesFor("frontend/package.json", "packageManager"));

      expect(droppedIntegrityHash(problems)).toBe(true);
    });

    it("is false when nothing with a hash was touched", () => {
      const { problems } = scanFile(
        "FROM node:20.0.0-alpine3.19\n",
        rulesFor("frontend/ndla-frontend/Dockerfile", "node base image"),
      );

      expect(droppedIntegrityHash(problems)).toBe(false);
    });
  });
});
