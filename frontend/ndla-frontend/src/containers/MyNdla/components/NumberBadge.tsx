/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Text } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";

export const NumberBadge = styled(Text, {
  base: {
    borderRadius: "50%",
    border: "1px solid",
    borderColor: "stroke.default",
    textAlign: "center",
  },
  variants: {
    size: {
      small: {
        paddingInline: "3xsmall",
        width: "2.5ch",
        _selected: {
          backgroundColor: "surface.brand.1",
        },
      },
      large: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: "0",
        width: "large",
        height: "large",
      },
    },
  },
  defaultVariants: {
    size: "small",
  },
});
