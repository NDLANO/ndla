/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { LRUCache } from "lru-cache";
import pLimit from "p-limit";
import config, { getEnvironmentVariabel } from "../config";
import type { MatomoStats, ResourceStats } from "../modules/matomo/matomoApi";

const limit = pLimit(8);

const MATOMO_CACHE_MAX = 5000;
const MATOMO_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const MATOMO_FETCH_TIMEOUT_MS = 10_000;

export const matomoApiToken = getEnvironmentVariabel("MATOMO_API_TOKEN");

interface MatomoPageData extends ResourceStats {
  label: string;
}

interface MatomoError {
  result: "error";
  message: string;
}

const isMatomoError = (data: unknown): data is MatomoError =>
  typeof data === "object" && data !== null && "result" in data && data.result === "error";

const buildBulkRequestUrl = (url: string) => {
  const withLang = [`/nb${url}`, `/nn${url}`, `/en${url}`, `/se${url}`, url];
  const bulkRequest = withLang.map(
    (langUrl, index) =>
      `urls[${index}]=${encodeURIComponent(`method=Actions.getPageUrl&idSite=${config.matomoSiteId}&pageUrl=${langUrl}&period=month&date=last12&showColumns=nb_visits,nb_hits,avg_time_on_page`)}`,
  );
  return `https://${config.matomoUrl}/index.php?module=API&method=API.getBulkRequest&format=JSON&token_auth=${matomoApiToken}&${bulkRequest.join("&")}`;
};

/**
 * The bulk response contains one entry per language variant of the url, each mapping a month to the rows for that month.
 */
const parseBulkResponse = (data: unknown): MatomoPageData[] => {
  if (isMatomoError(data)) throw new Error(`Matomo responded with an error: ${data.message}`);
  if (!Array.isArray(data)) throw new Error("Matomo responded with an unexpected format");
  return data.flatMap((entry: unknown) => {
    if (isMatomoError(entry)) throw new Error(`Matomo responded with an error: ${entry.message}`);
    if (typeof entry !== "object" || entry === null) throw new Error("Matomo responded with an unexpected format");
    return Object.values(entry).flatMap((rows: unknown) => (Array.isArray(rows) ? (rows as MatomoPageData[]) : []));
  });
};

const statsCache = new LRUCache<string, MatomoPageData[]>({
  max: MATOMO_CACHE_MAX,
  ttl: MATOMO_CACHE_TTL_MS,
  fetchMethod: (url) =>
    limit(async () => {
      const res = await fetch(buildBulkRequestUrl(url), { signal: AbortSignal.timeout(MATOMO_FETCH_TIMEOUT_MS) });
      if (!res.ok) throw new Error(`Matomo responded with status ${res.status}`);
      return parseBulkResponse(await res.json());
    }),
});

const sumValues = (rows: MatomoPageData[], key: keyof ResourceStats) => rows.reduce((acc, row) => acc + row[key], 0);

const aggregateStats = (rows: MatomoPageData[]): ResourceStats => ({
  nb_visits: sumValues(rows, "nb_visits"),
  nb_hits: sumValues(rows, "nb_hits"),
  avg_time_on_page: Math.ceil(sumValues(rows, "avg_time_on_page") / rows.length),
});

export const fetchMatomoStats = async (urls: string[]): Promise<MatomoStats> => {
  if (!matomoApiToken) throw new Error("MATOMO_API_TOKEN is not configured");

  const results = await Promise.all(urls.map((url) => statsCache.fetch(url)));

  return results.reduce<MatomoStats>((acc, rows) => {
    const contextId = rows?.[0]?.label.split("/").pop();
    if (rows && contextId) acc[contextId] = aggregateStats(rows);
    return acc;
  }, {});
};
