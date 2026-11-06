/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import http from "node:http";
import { configureKeepAlive } from "@ndla/shared/server";

export const server = configureKeepAlive(http.createServer());
