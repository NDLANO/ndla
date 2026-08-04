/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Keeps every dependency shared by two or more workspaces pinned to a single range in the
 * `catalog:` section of `frontend/.yarnrc.yml`.
 *
 * Loaded by `frontend/yarn.config.cjs`, which Yarn requires as CommonJS. Node strips the types
 * from this file at load time rather than compiling it, so keep the syntax erasable: no `enum`,
 * no `namespace`, no parameter properties.
 */

import { readFileSync, writeFileSync } from "node:fs";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import type { Yarn as YarnTypes } from "@yarnpkg/types";
import { isMap, parse, parseDocument } from "yaml";

type Context = YarnTypes.Constraints.Context;
type Dependency = YarnTypes.Constraints.Dependency;
type Workspace = YarnTypes.Constraints.Workspace;

export type RangeOption = [range: string, workspaceNames: string[]];
type CatalogEntry = [ident: string, range: string];

const CATALOG_RANGE = "catalog:";

/**
 * Ranges carrying a protocol are left alone. The path-relative ones (`link:`, `file:`,
 * `portal:`, `patch:`) resolve against the workspace that declares them and would re-anchor to
 * the project root if moved into the catalog; `npm:` aliases and URL ranges are deliberate
 * per-workspace overrides.
 */
const RANGE_PROTOCOL = /^[a-z][a-z\d+.-]*:/i;

// The constraints hook gets no access to the CLI context, so sniffing argv is the only way to
// tell the modes apart. The four reachable combinations:
const CLI_ARGS = process.argv.slice(2);
const IS_FIX_RUN = CLI_ARGS.includes("constraints") && CLI_ARGS.includes("--fix");
const CAN_PROMPT = IS_FIX_RUN && !CLI_ARGS.includes("--json") && !!process.stdin.isTTY && !!process.stderr.isTTY;
const answeredRanges = new Map<string, string | null>();

function yarnrcPath(): string {
  return fileURLToPath(new URL("../../../../.yarnrc.yml", import.meta.url));
}

function readCatalogIdents(): Set<string> {
  const yarnrc = parse(readFileSync(yarnrcPath(), "utf8"));
  return new Set(Object.keys(yarnrc?.catalog ?? {}));
}

/** Appends entries to the catalog map, leaving the rest of the document's formatting intact. */
function appendCatalogEntries(entries: CatalogEntry[]): void {
  const target = yarnrcPath();
  const doc = parseDocument(readFileSync(target, "utf8"));
  const catalog = doc.get("catalog");
  if (!isMap(catalog)) throw new Error(`${target} has no catalog map to extend`);
  for (const [ident, range] of entries) {
    if (catalog.has(ident)) continue;
    catalog.items.push(doc.createPair(ident, range));
  }
  writeFileSync(target, doc.toString());
}

function reportEntriesAdded(count: number): void {
  process.stderr.write(
    `Added ${count} catalog entr${count === 1 ? "y" : "ies"} to .yarnrc.yml; ` +
      `run 'yarn install' to refresh yarn.lock.\n`,
  );
}

function promptLine(question: string): Promise<string | null> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    let settled = false;
    const finish = (answer: string | null) => {
      if (settled) return;
      settled = true;
      rl.close();
      resolve(answer);
    };
    rl.once("close", () => finish(null));
    rl.question(question, (answer) => finish(answer.trim()));
  });
}

async function askWhichRange(ident: string, rangeOptions: RangeOption[]): Promise<string | null> {
  const remembered = answeredRanges.get(ident);
  if (remembered !== undefined) return remembered;

  const menu = rangeOptions.map(([range, users], i) => `  ${i + 1}) ${range}  (${users.join(", ")})`);
  const answer = await promptLine(
    `\n${ident} is shared but missing from the .yarnrc.yml catalog, and its ranges disagree:\n` +
      `${menu.join("\n")}\nRange to add [1-${rangeOptions.length}, default 1]: `,
  );

  let picked: string | null = null;
  if (answer !== null) {
    const index = Number.parseInt(answer, 10) - 1;
    picked = (index >= 0 && index < rangeOptions.length ? rangeOptions[index] : rangeOptions[0])[0];
  }

  answeredRanges.set(ident, picked);
  return picked;
}

function disagreeingRangesMessage(ident: string, rangeOptions: RangeOption[]): string {
  const listed = rangeOptions.map(([range, users]) => `\n${range} (${users.join(", ")})`).join("");
  return (
    `${ident} is shared but missing from the .yarnrc.yml catalog, and its ranges disagree. ` +
    `Run 'yarn constraints --fix' in a terminal to pick one of:${listed}`
  );
}

export function compareStrings(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

function workspaceName(workspace: Workspace): string {
  return workspace.ident ?? workspace.cwd;
}

export function isCatalogableRange(range: string): boolean {
  return !RANGE_PROTOCOL.test(range);
}

/**
 * Groups dependencies by ident, dropping the two kinds that are never cataloged:
 * peerDependencies (support floors, kept deliberately broad) and workspace: refs (internal).
 */
export function groupCatalogableDependencies(dependencies: Dependency[]): Map<string, Dependency[]> {
  const depsByIdent = new Map<string, Dependency[]>();
  for (const dep of dependencies) {
    if (dep.type === "peerDependencies") continue;
    if (dep.range.startsWith("workspace:")) continue;
    const group = depsByIdent.get(dep.ident);
    if (group) group.push(dep);
    else depsByIdent.set(dep.ident, [dep]);
  }
  return depsByIdent;
}

function isSharedAcrossWorkspaces(deps: Dependency[]): boolean {
  return new Set(deps.map((dep) => dep.workspace.cwd)).size > 1;
}

/**
 * Tallies which workspaces ask for which range. Uses already written as `catalog:` contribute no
 * concrete range, so an ident where every workspace is already cataloged yields an empty map.
 */
export function collectRangeUsage(deps: Dependency[]): Map<string, string[]> {
  const usersByRange = new Map<string, Set<string>>();
  for (const dep of deps) {
    if (dep.range === CATALOG_RANGE) continue;
    let users = usersByRange.get(dep.range);
    if (!users) usersByRange.set(dep.range, (users = new Set()));
    // A workspace listing the same ident under both dependencies and devDependencies is one
    // voter, not two.
    users.add(workspaceName(dep.workspace));
  }
  return new Map([...usersByRange].map(([range, users]) => [range, [...users].sort(compareStrings)]));
}

export function byPopularityThenRange(a: RangeOption, b: RangeOption): number {
  return b[1].length - a[1].length || compareStrings(a[0], b[0]);
}

function reportIdentError(deps: Dependency[], message: string): void {
  deps[0].error(message);
}

async function chooseCatalogRange(ident: string, deps: Dependency[]): Promise<string | null> {
  const usageByRange = collectRangeUsage(deps);

  if (usageByRange.size === 0) {
    reportIdentError(deps, `${ident} uses catalog: but has no entry in .yarnrc.yml; add one by hand.`);
    return null;
  }

  if (![...usageByRange.keys()].every(isCatalogableRange)) return null;

  const rangeOptions = [...usageByRange].sort(byPopularityThenRange);
  if (rangeOptions.length === 1) return rangeOptions[0][0];

  if (!CAN_PROMPT) {
    reportIdentError(deps, disagreeingRangesMessage(ident, rangeOptions));
    return null;
  }
  return askWhichRange(ident, rangeOptions);
}

export async function constraints({ Yarn }: Context): Promise<void> {
  const catalogIdents = readCatalogIdents();
  const depsByIdent = groupCatalogableDependencies(Yarn.dependencies());

  const newEntries: CatalogEntry[] = [];
  const mustUseCatalog: Dependency[] = [];

  for (const [ident, deps] of [...depsByIdent].sort(([a], [b]) => compareStrings(a, b))) {
    if (catalogIdents.has(ident)) {
      mustUseCatalog.push(...deps);
      continue;
    }
    if (!isSharedAcrossWorkspaces(deps)) continue;

    const range = await chooseCatalogRange(ident, deps);
    if (range === null) continue;

    if (IS_FIX_RUN) newEntries.push([ident, range]);
    mustUseCatalog.push(...deps);
  }

  if (newEntries.length > 0) {
    appendCatalogEntries(newEntries);
    reportEntriesAdded(newEntries.length);
  }

  // A cataloged dependency must use the catalog, not a hardcoded range.
  for (const dep of mustUseCatalog) dep.update(CATALOG_RANGE);
}
