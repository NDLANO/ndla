/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { HeartFill } from "@ndla/icons";
import { BleedPageContent } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";

const StyledBleedPageContent = styled(BleedPageContent, {
  base: {
    position: "relative",
    overflowX: "clip",
  },
});

const StyledHeartFill = styled(HeartFill, {
  base: {
    position: "absolute",
    width: "surface.medium",
    height: "surface.medium",
    color: "surface.brand.1.subtle",
  },

  variants: {
    position: {
      top: {
        top: "surface.3xsmall",
        left: "[min(calc(100% - token(sizes.surface.medium)), token(sizes.surface.wideMax) - token(sizes.surface.medium) - token(sizes.medium))]",
        transform: "rotate(16deg)",
        desktop: {
          top: "3xlarge",
        },
      },
      bottom: {
        transform: "rotate(-19deg)",
        bottom: "0",
        left: "medium",
      },
    },
  },
});

interface Props {
  position: "top" | "bottom";
  desktopOnly?: boolean;
}

export const FavoritesHeart = ({ position, desktopOnly }: Props) => (
  <StyledBleedPageContent css={desktopOnly ? { desktopDown: { display: "none" } } : undefined}>
    <StyledHeartFill position={position} />
  </StyledBleedPageContent>
);
