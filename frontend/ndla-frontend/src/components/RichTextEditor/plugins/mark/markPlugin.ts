/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { markPlugin as baseMarkPlugin, marks, toggleMark } from "@ndla/editor";
import { isKeyHotkey } from "is-hotkey";
import { BOLD_SHORTCUT, ITALIC_SHORTCUT } from "./markShortcuts";

type MarkShortcut = NonNullable<Parameters<typeof baseMarkPlugin.configure>[0]["shortcuts"]>[string];

const createToggleShortcut = (shortcut: string, mark: typeof marks.strong | typeof marks.em): MarkShortcut => ({
  keyCondition: isKeyHotkey(shortcut),
  handler: (editor, event) => {
    event.preventDefault();
    toggleMark(editor, mark);
    return false;
  },
});

const shortcuts = {
  toggleBold: createToggleShortcut(BOLD_SHORTCUT, marks.strong),
  toggleItalic: createToggleShortcut(ITALIC_SHORTCUT, marks.em),
};

export const markPlugin = baseMarkPlugin.configure({ shortcuts });

export const simpleMarkPlugin = baseMarkPlugin.configure({
  shortcuts,
  options: { supportedMarks: { value: ["bold", "italic"], override: true } },
});
