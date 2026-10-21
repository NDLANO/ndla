/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createContext, use } from "react";

/** The script that sets `window.config`. Only the server provides it, so the serializer stays out of the client. */
export const ConfigScriptContext = createContext("");

export const ConfigScript = () => (
  <script
    // The browser has run the server-rendered script before the app starts, so the client renders it empty
    suppressHydrationWarning
    dangerouslySetInnerHTML={{ __html: use(ConfigScriptContext) }}
  />
);
