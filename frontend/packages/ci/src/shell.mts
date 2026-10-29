/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { execFileSync } from "node:child_process";

export type RunOptions = {
  cwd?: string;
  stderr?: "inherit" | "ignore";
};

export const run = (file: string, args: readonly string[], options: RunOptions = {}): string =>
  execFileSync(file, args, {
    cwd: options.cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", options.stderr ?? "inherit"],
    // The default 1MiB would surface as ENOBUFS, which callers cannot tell apart from a genuine
    // failure -- and mistaking one for the other silently selects every module.
    maxBuffer: 64 * 1024 * 1024,
  });

export const tryRun = (file: string, args: readonly string[], options: RunOptions = {}): string | undefined => {
  try {
    return run(file, args, options);
  } catch {
    return undefined;
  }
};

export const runLines = (file: string, args: readonly string[], options: RunOptions = {}): string[] =>
  toLines(run(file, args, options));

export const toLines = (stdout: string): string[] =>
  stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

/** Runs `file` and parses its stdout as JSON, naming the command and its output on failure. */
export const runJson = (file: string, args: readonly string[], options: RunOptions = {}): unknown => {
  const label = [file, ...args].join(" ");
  const stdout = run(file, args, options);
  try {
    return JSON.parse(stdout);
  } catch {
    throw new Error(`\`${label}\` did not print JSON:\n${stdout.slice(0, 2000)}`);
  }
};

export const asStringArray = (value: unknown, label: string): string[] => {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    throw new Error(`Expected \`${label}\` to print a JSON array of strings, got: ${JSON.stringify(value)}`);
  }
  return value as string[];
};
