/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { resolveJsonOrRejectWithError } from "@ndla/shared/apiClient";
import { fetchAuthorized } from "../../util/apiHelpers";

export interface ResourceStats {
  nb_visits: number;
  nb_hits: number;
  avg_time_on_page: number;
}

/**
 * Aggregated stats for the last 12 months, keyed by context id. Contexts without any data are omitted.
 */
export type MatomoStats = Record<string, ResourceStats>;

export interface MatomoStatsBody {
  urls: string[];
}

interface Props extends MatomoStatsBody {
  signal: AbortSignal;
}

export const fetchMatomoStats = async ({ urls, signal }: Props): Promise<MatomoStats> => {
  return fetchAuthorized("/matomo-stats/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ urls: urls }),
    signal: signal,
  }).then((r) => resolveJsonOrRejectWithError<MatomoStats>(r));
};
