/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Counter, Registry } from "@prometheus-io/client";

export const metricsRegistry = new Registry();

export type CacheBypassReason = "client_no_cache" | "request_no_cache" | "method" | "disabled";

export type CacheLookup =
  | { result: "hit"; reason: "fresh" }
  | { result: "miss"; reason: "absent" | "vary" }
  | { result: "bypass"; reason: CacheBypassReason };

export type CacheWrite =
  | { result: "stored"; reason: "cacheable" }
  | { result: "skipped"; reason: "status" | "cache_control" | "vary" };

const cacheLookups = new Counter({
  name: "graphql_api_cache_lookups_total",
  help: "Backend requests checked against the response cache, labeled with api, result and reason",
  labelNames: ["api", "result", "reason"],
  registers: [metricsRegistry],
});

const cacheWrites = new Counter({
  name: "graphql_api_cache_writes_total",
  help: "Backend responses considered for the response cache, labeled with api, result and reason",
  labelNames: ["api", "result", "reason"],
  registers: [metricsRegistry],
});

const cacheRemovals = new Counter({
  name: "graphql_api_cache_removals_total",
  help: "Entries removed from the response cache because it was full (evict) or the entry was stale (expire)",
  labelNames: ["reason"],
  registers: [metricsRegistry],
});

export const countCacheLookup = (api: string, { result, reason }: CacheLookup): void =>
  cacheLookups.inc({ api, result, reason });

export const countCacheWrite = (api: string, { result, reason }: CacheWrite): void =>
  cacheWrites.inc({ api, result, reason });

export const countCacheRemoval = (reason: "evict" | "expire"): void => cacheRemovals.inc({ reason });

const apiLabelPattern = /^[a-z0-9-]+$/;
export const getApiLabel = (url: string): string => {
  const firstSegment = new URL(url).pathname.split("/")[1] ?? "";
  return apiLabelPattern.test(firstSegment) ? firstSegment : "other";
};
