/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// The question screen remounts for every question, so a width transition never runs.
// Animate from the previous question's progress to the current one via CSS variables instead.
export const quizProgressKeyframes = {
  "quiz-progress-fill": {
    from: { width: "var(--quiz-progress-from)" },
    to: { width: "var(--quiz-progress-to)" },
  },
};

export const quizProgressAnimations = {
  "quiz-progress-fill": { value: "quiz-progress-fill 300ms ease-out" },
};
