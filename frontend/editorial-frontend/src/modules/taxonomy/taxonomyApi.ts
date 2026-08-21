/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { type ResolvedUrl, resolve } from "@ndla/types-backend/taxonomy-api";
import { createClient } from "@ndla/types-backend/taxonomy-api/client";
import type { WithTaxonomyVersion } from "../../interfaces";
import { apiClientConfig } from "../../util/apiHelpers";
import { resolveJsonOATS } from "../../util/resolveJsonOrRejectWithError";

const client = createClient(apiClientConfig("/taxonomy"));

interface ResolveUrlsParams extends WithTaxonomyVersion {
  path: string;
}

const resolveUrls = (params: ResolveUrlsParams): Promise<ResolvedUrl> =>
  resolve({ client, query: { path: params.path }, headers: { VersionHash: params.taxonomyVersion } }).then((response) =>
    resolveJsonOATS(response),
  );

export { resolveUrls };
