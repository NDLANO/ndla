/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useDraggable } from "@dnd-kit/core";
import { Draggable } from "@ndla/icons";
import { IconButton } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import type { MouseEvent, ReactNode } from "react";
import { type Editor, type Element, Node, type ElementType } from "slate";
import { ReactEditor } from "slate-react";
import { DND_PLUGIN, type DndPluginOptions } from "./dndTypes";
import { DropArea } from "./DropArea";

const getAccepts = (editor: Editor, element: Element, options?: DndPluginOptions) => {
  const path = ReactEditor.findPath(editor, element);
  const [parent] = editor.parent(path);
  if (!parent || !Node.isElement(parent)) {
    return {
      accepts: undefined,
      hasElementParent: false,
    };
  }

  return {
    accepts: options?.legalChildren?.[parent.type],
    hasElementParent: true,
  };
};

export const dndRenderer = (editor: Editor) => {
  const { renderElement } = editor;
  const dndOptions = editor.getPluginOptions<DndPluginOptions>(DND_PLUGIN);
  editor.renderElement = ({ attributes, children, element }) => {
    if (!element.id || dndOptions?.disabledElements?.includes(element.type)) {
      return renderElement?.({ attributes, children, element });
    }
    const { accepts, hasElementParent } = getAccepts(editor, element, dndOptions);
    if ((accepts && !accepts.length) || !hasElementParent) {
      return renderElement?.({ attributes, children, element });
    }

    return (
      <DraggableElement
        editor={editor}
        element={element}
        accepts={accepts}
        dragDisabled={editor.isDragDisabled?.(element)}
      >
        {renderElement?.({ attributes, children, element })}
      </DraggableElement>
    );
  };

  return editor;
};

const StyledIconButton = styled(IconButton, {
  base: {
    touchAction: "none",
    position: "absolute",
    left: "-large",
    top: "50%",
    transform: "translateY(-50%)",
    visibility: "hidden",
    opacity: "0",
  },
});

const StyledContainer = styled("div", {
  base: {
    position: "relative",
    overflow: "visible",
    "&:not(:has([data-drag-wrapper]:hover)):hover": {
      "& > [data-drag-button]": {
        visibility: "visible",
        opacity: "1",
      },
    },
  },
  variants: {
    isDragging: {
      true: {
        "& [data-embed-wrapper]": {
          pointerEvents: "none",
        },
      },
    },
  },
});

interface Props {
  children: ReactNode;
  editor: Editor;
  element: Element;
  accepts?: ElementType[];
  dragDisabled?: boolean;
}

const onMouseDown = (e: MouseEvent<HTMLButtonElement>) => {
  e.preventDefault();
};

const DraggableElement = ({ children, editor, element, accepts, dragDisabled }: Props) => {
  const { attributes, listeners, active, setNodeRef } = useDraggable({
    id: element.id!,
    data: { element, children },
  });

  // Slate does not re-render an element when only its index changes, so the path is looked up on every render
  // instead of being passed down. Starting a drag re-renders every draggable, which keeps the top drop area correct.
  const isFirstChild = ReactEditor.findPath(editor, element).at(-1) === 0;

  return (
    <StyledContainer data-embed-wrapper="" data-drag-wrapper="" ref={setNodeRef} isDragging={!!active}>
      {!!isFirstChild && <DropArea element={element} accepts={accepts} position="top" />}
      {!dragDisabled && (
        <StyledIconButton
          size="small"
          onMouseDown={onMouseDown}
          contentEditable={false}
          variant="clear"
          {...attributes}
          {...listeners}
          data-drag-button=""
        >
          <Draggable />
        </StyledIconButton>
      )}
      {children}
      <DropArea element={element} accepts={accepts} position="bottom" />
    </StyledContainer>
  );
};
