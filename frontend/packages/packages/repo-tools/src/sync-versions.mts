/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Checks — and with `--fix`, rewrites — the version pins that are derived from `mise.toml` but
 * have to be written out literally somewhere else: Dockerfile base images, `engines.node`, and
 * `packageManager`.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export interface Versions {
  node: string;
  yarn: string;
  alpine: string;
  javaMajor: string;
}

export interface Rule {
  file: string;
  label: string;
  pattern: RegExp;
  expected: string;
  compare?: (found: string) => string;
}

export type Problem =
  | { kind: "blind"; file: string; label: string }
  | { kind: "stale"; file: string; label: string; line: number; expected: string; found: string };

const APPS = ["ndla-frontend", "editorial-frontend", "graphql-api"];

const FRONTEND_MANIFESTS = [
  "frontend/package.json",
  "frontend/packages/package.json",
  ...APPS.map((app) => `frontend/${app}/package.json`),
];

export function buildRules({ node, yarn, alpine, javaMajor }: Versions): Rule[] {
  const [nodeMajor = ""] = node.split(".");
  return [
    ...APPS.map((app) => ({
      file: `frontend/${app}/Dockerfile`,
      label: "node base image",
      pattern: /(FROM node:)(\S+)/g,
      expected: `${node}-alpine${alpine}`,
    })),
    {
      file: "backend/Dockerfile",
      label: "ARG JAVA_MAJOR_VERSION",
      pattern: /(ARG JAVA_MAJOR_VERSION=)(\S+)/g,
      expected: javaMajor,
    },
    ...FRONTEND_MANIFESTS.map((file) => ({
      file,
      label: "engines.node",
      pattern: /("engines"\s*:\s*\{\s*"node"\s*:\s*")([^"]+)/g,
      expected: `>=${nodeMajor}`,
    })),
    ...[...FRONTEND_MANIFESTS, "backend/typescript/types-backend/package.json"].map((file) => ({
      file,
      label: "packageManager",
      pattern: /("packageManager"\s*:\s*"yarn@)([^"]+)/g,
      expected: yarn,
      // The +sha512 integrity suffix is opaque; only the version is compared.
      compare: (found: string) => found.replace(/\+.*/, ""),
    })),
  ];
}

export function scanFile(text: string, rules: Rule[]): { text: string; problems: Problem[] } {
  const problems: Problem[] = [];

  for (const rule of rules) {
    let seen = 0;
    const snapshot = text;
    text = text.replace(rule.pattern, (whole: string, prefix: string, found: string, offset: number): string => {
      seen++;
      if ((rule.compare ? rule.compare(found) : found) === rule.expected) return whole;
      problems.push({
        kind: "stale",
        file: rule.file,
        label: rule.label,
        line: snapshot.slice(0, offset).split("\n").length,
        expected: rule.expected,
        found,
      });
      return prefix + rule.expected;
    });
    if (seen === 0) problems.push({ kind: "blind", file: rule.file, label: rule.label });
  }

  return { text, problems };
}

export function droppedIntegrityHash(problems: Problem[]): boolean {
  return problems.some((problem) => problem.kind === "stale" && problem.found.includes("+sha"));
}

function repoRoot(): string {
  return fileURLToPath(new URL("../../../../../", import.meta.url));
}

function readVersions(): Versions {
  const config = path.join(repoRoot(), "mise.toml");
  const declared = (key: string): string =>
    execFileSync("mise", ["config", "get", "-f", config, key], { encoding: "utf8" }).trim();

  const exact = (key: string, format: RegExp): string => {
    const value = declared(key);
    if (!format.test(value)) {
      console.error(`mise.toml: ${key} = "${value}" must match ${format} so pins can be compared literally`);
      process.exit(2);
    }
    return value;
  };

  return {
    node: exact("tools.node", /^\d+\.\d+\.\d+$/),
    yarn: exact("tools.yarn", /^\d+\.\d+\.\d+$/),
    alpine: exact("vars.alpine", /^\d+\.\d+$/),
    javaMajor: exact("tools.java", /^temurin-\d+$/).replace("temurin-", ""),
  };
}

const short = (value: string): string => (value.length > 40 ? `${value.slice(0, 37)}...` : value);

function report(problems: Problem[], fix: boolean): void {
  for (const problem of problems) {
    if (problem.kind === "blind") {
      console.error(
        `✗ ${problem.file}: no "${problem.label}" pin found — sync-versions has gone blind here, update its rules`,
      );
    } else if (!fix) {
      console.error(
        `✗ ${problem.file}:${problem.line} ${problem.label}\n    expected ${problem.expected}\n    found    ${short(problem.found)}`,
      );
    } else {
      console.log(`  ${problem.file}:${problem.line} ${problem.label}: ${short(problem.found)} → ${problem.expected}`);
    }
  }
}

function main(): void {
  const fix = process.argv.includes("--fix");
  const root = repoRoot();
  const versions = readVersions();
  const rules = buildRules(versions);

  const problems: Problem[] = [];
  let filesChanged = 0;

  for (const file of new Set(rules.map((rule) => rule.file))) {
    let original: string;
    try {
      original = readFileSync(path.join(root, file), "utf8");
    } catch {
      problems.push({ kind: "blind", file, label: "file is missing" });
      continue;
    }

    const result = scanFile(
      original,
      rules.filter((rule) => rule.file === file),
    );
    problems.push(...result.problems);

    if (fix && result.text !== original) {
      writeFileSync(path.join(root, file), result.text);
      filesChanged++;
    }
  }

  if (problems.length === 0) {
    const { node, yarn, javaMajor, alpine } = versions;
    console.log(`✓ version pins match mise.toml — node ${node}, yarn ${yarn}, java ${javaMajor}, alpine ${alpine}`);
    process.exit(0);
  }

  report(problems, fix);

  if (droppedIntegrityHash(problems)) {
    console.log(`\nnote: a packageManager integrity hash was dropped because the yarn version changed.`);
    console.log(`      regenerate it with \`yarn set version ${versions.yarn}\` in frontend/ if you want it back.`);
  }

  const blind = problems.filter((problem) => problem.kind === "blind").length;
  const stale = problems.length - blind;

  if (fix) {
    console.log(`\nupdated ${stale} pin(s) across ${filesChanged} file(s)`);
    process.exit(blind ? 1 : 0);
  }

  if (stale) console.error(`\n${stale} version pin(s) out of sync with mise.toml — run \`mise run versions:fix\``);
  process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
