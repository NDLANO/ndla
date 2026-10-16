/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { quizConfettiAnimations, quizConfettiKeyframes } from "./quizConfettiAnimations";
import { quizLetterPopAnimations, quizLetterPopKeyframes } from "./quizLetterPopAnimations";
import { quizLogoAnimations, quizLogoKeyframes } from "./quizLogoAnimations";
import { quizProgressAnimations, quizProgressKeyframes } from "./quizProgressAnimations";

export const quizAnimations = {
  ...quizConfettiAnimations,
  ...quizLetterPopAnimations,
  ...quizLogoAnimations,
  ...quizProgressAnimations,
};
export const quizKeyframes = {
  ...quizConfettiKeyframes,
  ...quizLetterPopKeyframes,
  ...quizLogoKeyframes,
  ...quizProgressKeyframes,
};
