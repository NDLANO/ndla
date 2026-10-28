/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const settleEasing = "cubic-bezier(0.22, 1, 0.36, 1)";

export const errorNoticeKeyframes = {
  "error-notice-stamp": {
    "0%": {
      opacity: "0",
      translate: "34px -12px",
      scale: "1.06",
      rotate: "8deg",
      animationTimingFunction: "cubic-bezier(0.55, 0, 0.9, 0.35)",
    },
    "26%": { opacity: "0", animationTimingFunction: "ease-in" },
    "42%": {
      opacity: "1",
      translate: "0px 0px",
      scale: "0.9 1.04",
      rotate: "2deg",
      animationTimingFunction: settleEasing,
    },
    "72%": { translate: "-1.5px 0px", scale: "1.03 0.99", rotate: "-0.6deg", animationTimingFunction: settleEasing },
    "100%": { opacity: "1", translate: "0px 0px", scale: "1", rotate: "0deg" },
  },
};

export const errorNoticeAnimations = {
  "error-notice-stamp": { value: "error-notice-stamp 430ms linear 350ms both" },
};
