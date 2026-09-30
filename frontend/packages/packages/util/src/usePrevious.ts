/**
 * Copyright (c) 2023-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from "react";

export const usePrevious = <T>(value: T): T | undefined => {
  const [state, setState] = useState<{ current: T; previous: T | undefined }>({ current: value, previous: undefined });
  if (!Object.is(state.current, value)) {
    setState({ current: value, previous: state.current });
  }
  return state.previous;
};
