/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { appendFileSync } from "node:fs";
import { run } from "./shell.mts";

export const env = (name: string): string => (process.env[name] ?? "").trim();

export const flag = (name: string): boolean => env(name) === "true";

export const repoRoot = (): string => env("GITHUB_WORKSPACE") || run("git", ["rev-parse", "--show-toplevel"]).trim();

export const log = (message: string): void => {
  process.stdout.write(`${message}\n`);
};

/** `%`, CR and LF are control characters in a workflow command, so they have to be escaped. */
const escapeData = (value: string): string =>
  value.replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A");

export const notice = (message: string): void => log(`::notice::${escapeData(message)}`);
export const warning = (message: string): void => log(`::warning::${escapeData(message)}`);

/**
 * Publishes a step output. Logs instead when `$GITHUB_OUTPUT` is unset, so the entrypoints stay
 * runnable -- and observable -- outside Actions.
 */
export const setOutput = (name: string, value: string): void => {
  // A newline would let a `workflow_dispatch` input forge additional outputs.
  if (/[\r\n]/.test(value)) throw new Error(`Refusing to write a multi-line value to the '${name}' output`);
  const file = env("GITHUB_OUTPUT");
  if (file) appendFileSync(file, `${name}=${value}\n`);
  else log(`(output) ${name}=${value}`);
};

/** Emits `lines` as a notice, to the step log, and as a fenced block in the job summary. */
export const report = (headline: string, lines: readonly string[]): void => {
  notice(headline);
  for (const line of lines) log(line);
  const file = env("GITHUB_STEP_SUMMARY");
  if (file) appendFileSync(file, ["```", ...lines, "```", ""].join("\n"));
};
