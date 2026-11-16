/**
 * Copyright (c) 2024-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createContext, useContext } from "react";
import { useRawLocation } from "../util/localePath";

export interface ResponseInfo {
  status?: number;
  path?: string;
}

export const ResponseContext = createContext<ResponseInfo | undefined>(undefined);

export const useServerResponseStatus = () => {
  const response = useContext(ResponseContext);
  const { pathname } = useRawLocation();
  return response?.path === pathname ? response.status : undefined;
};
