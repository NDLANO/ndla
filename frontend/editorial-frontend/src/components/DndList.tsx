/**
 * Copyright (c) 2023-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { UniqueIdentifier } from "@dnd-kit/abstract";
import { RestrictToVerticalAxis } from "@dnd-kit/abstract/modifiers";
import { PointerActivationConstraints } from "@dnd-kit/dom";
import { RestrictToElement } from "@dnd-kit/dom/modifiers";
import { arrayMove } from "@dnd-kit/helpers";
import { DragDropProvider, type DragEndEvent, KeyboardSensor, PointerSensor } from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";
import type { IconButton } from "@ndla/primitives";
import { type ComponentProps, type ReactElement, useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import DraggableItem from "./DraggableItem";

export interface DndMove {
  id: UniqueIdentifier;
  from: number;
  to: number;
}

const sensors = [
  PointerSensor.configure({
    activationConstraints: () => [new PointerActivationConstraints.Distance({ value: 5 })],
  }),
  KeyboardSensor,
];

const modifiers = [
  RestrictToVerticalAxis,
  RestrictToElement.configure({ element: (operation) => operation.source?.element?.parentElement ?? null }),
];

interface Props<T extends { id: UniqueIdentifier }> {
  items: T[];
  disabled?: boolean;
  dragHandle?: ReactElement<ComponentProps<typeof IconButton>>;
  renderItem: (item: T, index: number) => ReactElement;
  onDragEnd: (move: DndMove, items: T[]) => void;
}
const DndList = <T extends { id: UniqueIdentifier }>({
  items: _items,
  disabled,
  renderItem,
  onDragEnd,
  dragHandle,
}: Props<T>) => {
  const [items, setItems] = useState<T[]>(_items);
  const [prevItems, setPrevItems] = useState<T[]>(_items);

  if (_items !== prevItems) {
    setPrevItems(_items);
    setItems(_items);
  }

  const escapeListener = useRef<AbortController | undefined>(undefined);

  useEffect(() => () => escapeListener.current?.abort(), []);

  const onDragStart = useCallback(() => {
    escapeListener.current?.abort();
    escapeListener.current = new AbortController();
    // Escape cancels a drag. Marking it as handled before dialogs and popovers see it keeps them from closing too.
    window.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Escape") event.preventDefault();
      },
      { capture: true, signal: escapeListener.current.signal },
    );
  }, []);

  const _onDragEnd = useCallback(
    (event: DragEndEvent) => {
      escapeListener.current?.abort();
      const { source } = event.operation;
      if (event.canceled || !isSortable(source) || source.initialIndex === source.index) return;
      const newArr = arrayMove(items, source.initialIndex, source.index);
      // dnd-kit has already moved the DOM nodes. Committing the new order before the parent re-renders keeps lists
      // whose ids follow the position from showing the old DOM order with the new content.
      flushSync(() => setItems(newArr));
      onDragEnd({ id: source.id, from: source.initialIndex, to: source.index }, newArr);
    },
    [onDragEnd, items],
  );

  return (
    <DragDropProvider sensors={sensors} modifiers={modifiers} onDragStart={onDragStart} onDragEnd={_onDragEnd}>
      {items.map((item, index) => (
        <DraggableItem disabled={disabled} key={item.id} id={item.id} index={index} dragHandle={dragHandle}>
          {renderItem(item, index)}
        </DraggableItem>
      ))}
    </DragDropProvider>
  );
};

export default DndList;
