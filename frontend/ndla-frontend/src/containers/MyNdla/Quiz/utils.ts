/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import config from "../../../config";
import { routes } from "../../../routeHelpers";

export const sharedQuizLink = (id: string, language?: string) => {
  const languageParam = language ? `/${language}` : "";
  return `${config.ndlaFrontendDomain}${languageParam}${routes.quiz(id)}`;
};

export const copyQuizSharingLink = (id: string, language?: string) =>
  window.navigator.clipboard.writeText(sharedQuizLink(id, language));

export const QUIZ_IN_PROGRESS = "IN_PROGRESS";
export const QUIZ_PRIVATE = "PRIVATE";
export const QUIZ_PUBLIC = "PUBLIC";
