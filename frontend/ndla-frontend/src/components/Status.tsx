/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { type ReactNode, useContext } from "react";
import { RedirectContext } from "./RedirectContext";

interface Props {
  code: number;
  children: ReactNode;
}

export const Status = ({ code, children }: Props) => {
  const setRedirect = useContext(RedirectContext);
  setRedirect?.({ status: code });
  return children;
};
