/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Portal } from "@ark-ui/react/portal";
import { DragOverlay, useDragDropMonitor } from "@dnd-kit/react";
import { styled } from "@ndla/styled-system/jsx";
import { useState } from "react";
import { ReactEditor, useSlateStatic } from "slate-react";

const StyledDragOverlay = styled(
  DragOverlay,
  {
    base: {
      opacity: "0.5",
    },
  },
  { baseComponent: true },
);

export const SlateDragOverlay = () => {
  const editor = useSlateStatic();
  const [activeHtml, setActiveHtml] = useState<string>("");

  /**
   * This is a workaround to ensure that duplicating slate elements does not cause selection issues.
   * If you directly render a pre-existing element, the selection will be lost.
   */
  useDragDropMonitor({
    onDragStart: ({ operation }) => {
      const domNode = ReactEditor.toDOMNode(editor, operation.source?.data.element);
      setActiveHtml(domNode.outerHTML);
    },
    onDragEnd: () => {
      setActiveHtml("");
    },
  });

  return (
    <Portal>
      <StyledDragOverlay dropAnimation={null}>
        <div contentEditable={false} dangerouslySetInnerHTML={{ __html: activeHtml }} />
      </StyledDragOverlay>
    </Portal>
  );
};
