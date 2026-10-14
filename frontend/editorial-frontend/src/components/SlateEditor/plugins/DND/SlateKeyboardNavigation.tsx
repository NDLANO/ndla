/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useDragDropMonitor } from "@dnd-kit/react";
import { COLLISION_SIZE } from "./collisionDetection";

/**
 * The drop areas are too small to hit by moving the preview a fixed distance per key press,
 * so the up and down arrow keys move it to the next drop area that accepts the dragged element instead.
 */
export const SlateKeyboardNavigation = () => {
  useDragDropMonitor({
    onDragMove: (event, manager) => {
      const { nativeEvent, by } = event;
      const { source, target, shape } = manager.dragOperation;
      if (!(nativeEvent instanceof KeyboardEvent) || !by?.y || !shape || !source) return;
      event.preventDefault();

      const { left, top } = shape.current.boundingRectangle;
      const fromY = target?.shape?.center.y ?? top;
      const next = [...manager.registry.droppables]
        .filter(
          (droppable) =>
            !droppable.disabled &&
            droppable.id !== target?.id &&
            droppable.data.element?.id !== source.id &&
            droppable.accepts(source),
        )
        .flatMap((droppable) => {
          const dy = (droppable.shape?.center.y ?? fromY) - fromY;
          return Math.sign(dy) === Math.sign(by.y) ? [{ droppable, distance: Math.abs(dy) }] : [];
        })
        .sort((a, b) => a.distance - b.distance)[0]?.droppable;
      if (!next?.shape) return;

      const area = next.shape.boundingRectangle;
      const y = next.shape.center.y - COLLISION_SIZE / 2;
      manager.actions.move({ by: { x: area.left - left, y: y - top }, propagate: false });
      next.element?.scrollIntoView({ block: "nearest" });
    },
  });
  return null;
};
