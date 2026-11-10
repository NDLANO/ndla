/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export const reloadPage = () => window.location.reload();

export const assignLocation = (url: string) => {
  window.location.href = url;
};

export const replaceLocation = (url: string) => window.location.replace(url);
