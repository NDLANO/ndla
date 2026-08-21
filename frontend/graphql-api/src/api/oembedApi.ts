/**
 * Copyright (c) 2019-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { type OEmbedDTO, getOembedProxyV1Oembed } from "@ndla/types-backend/oembed-proxy";
import { createClient } from "@ndla/types-backend/oembed-proxy/client";
import { apiClientConfig, resolveJsonOATS } from "../utils/api-client/utils";

const client = createClient(apiClientConfig());

export async function fetchOembed(url: string, _context: Context): Promise<OEmbedDTO | null> {
  const result = await getOembedProxyV1Oembed({ client, query: { url } });
  if (result.response?.status === 404) return null;
  return resolveJsonOATS(result);
}
