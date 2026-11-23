/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const TYPES_TASK = "generateTypescript";

/** Whether a `git diff -U0` of mise.toml adds or removes a version line for one of `tools`. */
export const toolVersionChanged = (diffLines: readonly string[], tools: readonly string[]): boolean => {
  const pattern = new RegExp(`^[+-](${tools.join("|")})\\s*=`);
  return diffLines.some((line) => pattern.test(line));
};

const moduleOf = (task: string): string => task.split(".")[0] ?? "";

const uniqueModules = (tasks: readonly string[]): string[] =>
  [...new Set(tasks.map(moduleOf))].filter((name) => /^[a-z0-9-]+$/.test(name)).sort();

/** Splits resolved Mill tasks into the modules to run and the modules whose typescript types must be regenerated. */
export const splitTasks = (tasks: readonly string[]): { modules: string[]; typesModules: string[] } => {
  const isTypes = (task: string): boolean => task.split(".").includes(TYPES_TASK);
  return {
    modules: uniqueModules(tasks.filter((task) => !isTypes(task))),
    typesModules: uniqueModules(tasks.filter(isTypes)),
  };
};

/** Mill runs several tasks in one invocation when they are separated by `+`. */
export const typesTasks = (modules: readonly string[]): string =>
  modules.map((module) => `${module}.${TYPES_TASK}`).join(" + ");
