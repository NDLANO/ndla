/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const POPUP_RETURN_TO = "/static/feide-redirect.html";
const POPUP_TIMEOUT_MS = 5 * 60 * 1000;

const currentPath = (): string => window.location.pathname + window.location.search;

export const runInPopup = (path: string, isDone: () => boolean, onDone: () => void): void => {
  const popup = window.open(
    `${path}?returnTo=${encodeURIComponent(POPUP_RETURN_TO)}`,
    "ndla-feide-auth",
    "width=620,height=760",
  );
  if (!popup) {
    window.location.assign(`${path}?returnTo=${encodeURIComponent(currentPath())}`);
    return;
  }
  const startedAt = Date.now();
  const timer = window.setInterval(() => {
    if (isDone()) {
      window.clearInterval(timer);
      onDone();
    } else if (Date.now() - startedAt > POPUP_TIMEOUT_MS) {
      window.clearInterval(timer);
    }
  }, 400);
};
