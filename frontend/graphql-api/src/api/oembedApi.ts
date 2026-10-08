/**
 * Copyright (c) 2019-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { resolveJsonOATS, resolveResponse } from "@ndla/api-client";
import { getOembedProxyV1Oembed, type OEmbedDTO } from "@ndla/types-backend/oembed-proxy";
import { createClient } from "@ndla/types-backend/oembed-proxy/client";
import { clientConfig } from "../utils/apiClient/clientConfig";

const client = createClient(clientConfig());

export async function fetchOembed(url: string, _context: Context): Promise<OEmbedDTO | null> {
  const result = await getOembedProxyV1Oembed({ client, query: { url } });
  if (resolveResponse(result).status === 404) return null;
  return resolveJsonOATS(result);
}
