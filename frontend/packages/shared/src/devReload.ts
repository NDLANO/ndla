/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { RequestListener } from "node:http";
import type { ViteDevServer } from "vite";

type Release = () => void | Promise<void>;

// vite-node re-evaluates this module on every reload, and drops listeners of reloads that overlap.
// Keeping releases process-wide lets any later reload release them.
const pendingKey = Symbol.for("ndla.devReload.pending");
const pending = ((globalThis as { [pendingKey]?: Release[] })[pendingKey] ??= []);

// A reload that starts while an earlier one is still evaluating can fire before the earlier one registers its
// releases, so the earlier one releases right away instead of keeping the port.
const generationKey = Symbol.for("ndla.devReload.generation");
const generations = globalThis as { [generationKey]?: number };
const generation = (generations[generationKey] = (generations[generationKey] ?? 0) + 1);

const runReleases = async (releases: Release[]) => {
  await Promise.allSettled(releases.map(async (release) => release()));
};

const releasePending = () => runReleases(pending.splice(0));

export const onBeforeFullReload = (release: Release): void => {
  if (!import.meta.hot) return;
  if (generation !== generations[generationKey]) {
    void runReleases([release]);
    return;
  }
  pending.push(release);
  import.meta.hot.on("vite:beforeFullReload", releasePending);
};

/**
 * Loads `entry` through Vite for every request, and recreates the listener when `entry` or anything it imports has
 * changed. Only the changed modules and their importers are evaluated again.
 */
export const createReloadingListener = <T>(
  vite: ViteDevServer,
  entry: string,
  create: (module: T) => RequestListener,
): RequestListener => {
  let current: { module: T; listener: RequestListener } | undefined;
  return async (req, res) => {
    try {
      const module = (await vite.ssrLoadModule(entry)) as T;
      if (current?.module !== module) {
        current = { module, listener: create(module) };
      }
      current.listener(req, res);
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      vite.ssrFixStacktrace(error);
      vite.config.logger.error(error.stack ?? error.message, { error });
      res.statusCode = 500;
      res.setHeader("Content-Type", "text/plain");
      res.end(error.stack ?? error.message);
    }
  };
};
