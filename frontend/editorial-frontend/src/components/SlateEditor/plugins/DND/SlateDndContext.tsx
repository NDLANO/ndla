/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { defaultPreset, PointerActivationConstraints, PreventSelection } from "@dnd-kit/dom";
import { DragDropProvider, type DragEndEvent, KeyboardSensor, PointerSensor } from "@dnd-kit/react";
import { type ReactNode, useCallback, useMemo } from "react";
import type { Editor } from "slate";
import { DND_PLUGIN, type DndPluginOptions } from "./dndTypes";
import { onDragEnd } from "./onDragEnd";
import { SlateDragOverlay } from "./SlateDragOverlay";

interface Props {
  children: ReactNode;
  editor: Editor;
}

const sensors = [
  PointerSensor.configure({
    activationConstraints: () => [new PointerActivationConstraints.Distance({ value: 5 })],
  }),
  // TODO: Consider implementing a custom keyboard sensor to handle keyboard events.
  // As of now we're relying on scrolling
  KeyboardSensor,
];

// Clearing the DOM selection while dragging would also clear the Slate selection.
const plugins = defaultPreset.plugins.filter((plugin) => plugin !== PreventSelection);

export const SlateDndContext = ({ children, editor }: Props) => {
  const dndOptions = useMemo(() => editor.getPluginOptions<DndPluginOptions>(DND_PLUGIN), [editor]);

  const dragEnd = useCallback(
    (dragEvent: DragEndEvent) => onDragEnd(dragEvent, editor, dndOptions),
    [editor, dndOptions],
  );

  return (
    <DragDropProvider sensors={sensors} plugins={plugins} onDragEnd={dragEnd}>
      {children}
      <SlateDragOverlay />
    </DragDropProvider>
  );
};
