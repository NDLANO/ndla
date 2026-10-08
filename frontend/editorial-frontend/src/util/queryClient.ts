/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { isApiError } from "@ndla/api-client";
import { QueryClient } from "@tanstack/react-query";

const MAX_RETRIES = 2;
const HTTP_STATUS_TO_NOT_RETRY = [400, 401, 403, 404];

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (failureCount > MAX_RETRIES) {
            return false;
          }
          if (isApiError(error) && HTTP_STATUS_TO_NOT_RETRY.includes(error.status)) {
            return false;
          }

          return true;
        },
      },
    },
  });
