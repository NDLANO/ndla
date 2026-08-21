/**
 * Copyright (c) 2023-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  type ConfigMetaRestrictedDTO,
  type ConfigKey,
  getMyndlaApiV1ConfigConfigKey,
} from "@ndla/types-backend/myndla-api";
import { createClient } from "@ndla/types-backend/myndla-api/client";
import { apiClientConfig, resolveJsonOATS } from "../utils/api-client/utils";

const client = createClient(apiClientConfig());

export const fetchConfig = async (configKey: string, _context: Context): Promise<ConfigMetaRestrictedDTO> => {
  return getMyndlaApiV1ConfigConfigKey({
    client,
    path: {
      "config-key": configKey as ConfigKey,
    },
  }).then(resolveJsonOATS);
};

export const fetchExamLockStatus = async (context: Context): Promise<ConfigMetaRestrictedDTO> =>
  fetchConfig("MY_NDLA_WRITE_RESTRICTED", context);
