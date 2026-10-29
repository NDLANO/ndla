/**
 * Copyright (c) 2024-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { breakpoints } from "@ndla/core";
import { definePreset } from "@pandacss/dev";
import presetBase from "@pandacss/preset-base";
import { animations, durations, easings, keyframes } from "./animations";
import { boxShadows } from "./boxShadows";
import { colors } from "./colors";
import { conditions } from "./conditions";
import { globalCss } from "./globalCss";
import { radii } from "./radii";
import { semanticTokens } from "./semanticTokens";
import { sizes, spacing } from "./spacing";
import { fontWeights, textStyles, fonts, fontSizes, lineHeights } from "./typography";
import { utilities } from "./utilities";
import { zIndex } from "./zIndex";

const preset = definePreset({
  name: "ndla/panda",
  presets: [presetBase],
  globalCss: globalCss,
  conditions: conditions,
  utilities: utilities,
  theme: {
    breakpoints: breakpoints,
    textStyles: textStyles,
    keyframes: keyframes,
    tokens: {
      colors: colors,
      easings: easings,
      durations: durations,
      radii: radii,
      spacing: spacing,
      sizes: sizes,
      lineHeights: lineHeights,
      fontWeights: fontWeights,
      fontSizes: fontSizes,
      fonts: fonts,
      animations: animations,
      shadows: boxShadows,
      zIndex: zIndex,
    },
    semanticTokens: semanticTokens,
    containers: breakpoints,
  },
});

export { forwardCssPropPlugin } from "./plugins/forwardCssPropPlugin";

export default preset;
