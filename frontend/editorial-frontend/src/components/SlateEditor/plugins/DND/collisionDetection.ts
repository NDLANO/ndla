/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { type CollisionDetector, CollisionPriority, CollisionType } from "@dnd-kit/abstract";
import { Rectangle } from "@dnd-kit/geometry";

// This is a custom collision detection algorithm for dnd-kit that alters the width and height of the draggable to better suit our needs.
// `closestCorners` works just fine for us for most cases. However, once you try to drag a full-width element into a container
// that is not full-width, you'll find that the only drop area that can be activated is at the bottom of the container.
// The element that is being dragged is so large that it will never trigger any of the drop areas within the container, as the container is too small.
// If you switch to `pointerIntersection` or `shapeIntersection`, you'll find that containers with several horizontal drop areas prioritize the rightmost drop area.
// Again, this is caused by the fact that the draggable element is larger than the drop areas.

const COLLISION_SIZE = 20;

export const collisionDetector: CollisionDetector = ({ dragOperation, droppable }) => {
  const shape = dragOperation.shape?.current;
  if (!shape || !droppable.shape) return null;

  const { left, top } = shape.boundingRectangle;
  const collisionShape = new Rectangle(left, top, COLLISION_SIZE, COLLISION_SIZE);
  const intersectionArea = collisionShape.intersectionArea(droppable.shape);
  if (!intersectionArea) return null;

  return {
    id: droppable.id,
    value: intersectionArea / (collisionShape.area + droppable.shape.area - intersectionArea),
    type: CollisionType.ShapeIntersection,
    priority: CollisionPriority.Normal,
  };
};
