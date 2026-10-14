/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useDragOperation, useDroppable } from "@dnd-kit/react";
import { styled } from "@ndla/styled-system/jsx";
import { memo } from "react";
import type { Element } from "slate";
import { collisionDetector } from "./collisionDetection";

const StyledDropArea = styled("div", {
  base: {
    width: "full",
    height: "4xsmall",
    position: "absolute",
  },
  variants: {
    variant: {
      top: {
        top: "[0%]",
      },
      bottom: {
        bottom: "[0%]",
      },
    },
    visible: {
      true: {
        background: "stroke.default",
      },
    },
  },
});

interface Props {
  element: Element;
  position: "top" | "bottom";
  accepts?: Element["type"][];
}
export const DropArea = memo(({ element, position, accepts }: Props) => {
  const { ref, isDropTarget } = useDroppable({
    id: `${element.id}-${position}`,
    data: { element, position },
    disabled: !!accepts && accepts.length === 0,
    collisionDetector,
  });
  const { source } = useDragOperation();

  return (
    <StyledDropArea
      data-embed-wrapper=""
      contentEditable={false}
      ref={ref}
      visible={!!isDropTarget && (!accepts || accepts.includes(source?.data.element?.type ?? ""))}
      variant={position}
    />
  );
});
