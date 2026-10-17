/**
 * Copyright (c) 2023-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { type CollisionDetector, CollisionPriority, CollisionType, type UniqueIdentifier } from "@dnd-kit/abstract";
import { useSortable } from "@dnd-kit/react/sortable";
import { IconButton, type IconButtonProps } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import { type ComponentProps, type ReactElement, type ReactNode, type Ref, cloneElement } from "react";

interface Props {
  children: ReactNode;
  dragHandle?: ReactElement<ComponentProps<typeof IconButton>>;
  id: UniqueIdentifier;
  disabled?: boolean;
  index: number;
}

const StyledListElement = styled("li", {
  base: {
    position: "relative",
    listStyle: "none",
    display: "flex",
    alignItems: "center",
    "&[data-has-handle='false']": {
      cursor: "grab",
    },
  },
  variants: {
    isDragging: {
      true: {
        zIndex: "docked",
      },
    },
  },
});

// Swapping with an item as soon as the pointer enters it makes items of very different heights swap back and forth,
// since the larger item ends up under the pointer again. An item only becomes the target once the leading edge of the
// dragged item has passed its center.
const collisionDetector: CollisionDetector = ({ dragOperation, droppable }) => {
  const { source, shape, position } = dragOperation;
  if (!source || !shape || !droppable.shape || !("index" in source) || !("index" in droppable)) return null;
  const steps = Number(droppable.index) - Number(source.index);
  const { top, bottom } = shape.current.boundingRectangle;
  const targetCenter = droppable.shape.center.y;
  const passed =
    (position.direction === "up" && steps < 0 && top < targetCenter) ||
    (position.direction === "down" && steps > 0 && bottom > targetCenter);
  if (!passed) return null;
  return {
    id: droppable.id,
    value: Math.abs(steps),
    type: CollisionType.Collision,
    priority: CollisionPriority.Normal,
  };
};

const DraggableItem = ({ id, index, children, dragHandle, disabled }: Props) => {
  const { ref, handleRef, isDragging } = useSortable({ id, index, disabled, collisionDetector });

  const clonedDragHandle = dragHandle
    ? cloneElement(dragHandle, {
        ref: handleRef,
        id: `${id}-handle`,
        disabled,
      })
    : null;

  return (
    <StyledListElement ref={ref} data-has-handle={!!dragHandle} isDragging={isDragging}>
      {clonedDragHandle}
      {children}
    </StyledListElement>
  );
};

const StyledDragHandle = styled(IconButton, {
  base: {
    touchAction: "none",
    _disabled: {
      display: "none",
    },
  },
});

interface DragHandleProps extends IconButtonProps {
  ref?: Ref<HTMLButtonElement>;
}

export const DragHandle = ({ children, tabIndex = 0, variant = "clear", ...rest }: DragHandleProps) => {
  return (
    <StyledDragHandle {...rest} tabIndex={tabIndex} variant={variant}>
      {children}
    </StyledDragHandle>
  );
};

export default DraggableItem;
