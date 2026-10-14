/**
 * Copyright (c) 2023-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { UniqueIdentifier } from "@dnd-kit/abstract";
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

const DraggableItem = ({ id, index, children, dragHandle, disabled }: Props) => {
  const { ref, handleRef, isDragging } = useSortable({ id, index, disabled });

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
