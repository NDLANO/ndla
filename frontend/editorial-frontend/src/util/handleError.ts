/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { captureError } from "@ndla/shared/sentry";

export const handleError = (error: unknown, extraContext: Record<string, unknown> = {}) => {
  captureError(error, extraContext);
  console.error(error); // oxlint-disable-line no-console
};
