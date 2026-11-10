/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useEffect, useState } from "react";
import { flushSync } from "react-dom";

export const useIsPrinting = () => {
  const [isPrinting, setIsPrinting] = useState(false);
  useEffect(() => {
    // The browser lays out the printed page right after beforeprint, so the update must be committed synchronously.
    const onBeforePrint = () => flushSync(() => setIsPrinting(true));
    const onAfterPrint = () => setIsPrinting(false);
    window.addEventListener("beforeprint", onBeforePrint);
    window.addEventListener("afterprint", onAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", onBeforePrint);
      window.removeEventListener("afterprint", onAfterPrint);
    };
  }, []);
  return isPrinting;
};
