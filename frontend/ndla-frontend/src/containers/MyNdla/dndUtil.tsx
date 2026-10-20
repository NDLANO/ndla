/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { RestrictToVerticalAxis } from "@dnd-kit/abstract/modifiers";
import { Accessibility, defaultPreset } from "@dnd-kit/dom";
import { RestrictToElement } from "@dnd-kit/dom/modifiers";
import type { DragDropManager, DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";
import type { i18n } from "i18next";

interface DraggableData {
  name: string;
}

export const dndModifiers = [
  RestrictToVerticalAxis,
  RestrictToElement.configure({ element: (operation) => operation.source?.element?.parentElement ?? null }),
];

// The accessibility plugin reads its announcements once, so they look up the language and item count when announcing.
export const makeDndPlugins = (type: "learningpathstep" | "quizquestion" | "quizalternative", i18n: i18n) => {
  const getLength = (manager: DragDropManager) => [...manager.registry.draggables].length;
  return [
    ...defaultPreset.plugins,
    Accessibility.configure({
      announcements: {
        dragstart: ({ operation: { source } }: DragStartEvent, manager: DragDropManager) => {
          if (!isSortable(source)) return;
          const { name } = source.data as DraggableData;
          return i18n.t(`myNdla.${type}.onDragStart`, {
            name,
            index: source.index + 1,
            length: getLength(manager),
          });
        },
        dragover: ({ operation: { source, target } }: DragOverEvent, manager: DragDropManager) => {
          if (!source || source.id === target?.id) return;
          const { name } = source.data as DraggableData;
          return isSortable(target)
            ? i18n.t(`myNdla.${type}.onDragOver`, {
                name,
                index: target.index + 1,
                length: getLength(manager),
              })
            : i18n.t(`myNdla.${type}.onDragMissingOver`, { name });
        },
        dragend: ({ operation: { source, target }, canceled }: DragEndEvent, manager: DragDropManager) => {
          if (!isSortable(source)) return;
          const { name } = source.data as DraggableData;
          if (canceled) {
            return i18n.t(`myNdla.${type}.onDragCancel`, { name });
          }
          return target
            ? i18n.t(`myNdla.${type}.onDragEnd`, {
                name,
                index: source.index + 1,
                length: getLength(manager),
              })
            : i18n.t(`myNdla.${type}.onDragEndMissingOver`, { name });
        },
      },
    }),
  ];
};
