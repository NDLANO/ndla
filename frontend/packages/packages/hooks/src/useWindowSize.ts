/**
 * Copyright (c) 2019-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import throttle from "lodash.throttle";
import { useCallback, useSyncExternalStore } from "react";

interface WindowSize {
  innerHeight: number;
  innerWidth: number;
  outerHeight: number;
  outerWidth: number;
}

const serverSize: WindowSize = {
  innerHeight: -1,
  innerWidth: -1,
  outerHeight: -1,
  outerWidth: -1,
};

let currentSize = serverSize;

function getSize() {
  const { innerHeight, innerWidth, outerHeight, outerWidth } = window;
  if (
    currentSize.innerHeight !== innerHeight ||
    currentSize.innerWidth !== innerWidth ||
    currentSize.outerHeight !== outerHeight ||
    currentSize.outerWidth !== outerWidth
  ) {
    currentSize = { innerHeight, innerWidth, outerHeight, outerWidth };
  }
  return currentSize;
}

function getServerSize() {
  return serverSize;
}

export function useWindowSize(wait?: number) {
  const subscribe = useCallback(
    (onResize: () => void) => {
      // Throttle if wait param is provided
      const handleResize = wait ? throttle(onResize, wait) : onResize;
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    },
    [wait],
  );

  return useSyncExternalStore(subscribe, getSize, getServerSize);
}
