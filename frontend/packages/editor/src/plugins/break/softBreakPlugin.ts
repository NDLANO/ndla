/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { isHotkey } from "is-hotkey";
import { Transforms } from "slate";
import { createPlugin } from "../../core/createPlugin";
import { SOFT_BREAK_PLUGIN, type SoftBreakPluginOptions } from "./breakTypes";

export const softBreakPlugin = createPlugin<any, SoftBreakPluginOptions>({
  name: SOFT_BREAK_PLUGIN,
  options: {
    pasteNewlinesAsSoftBreaks: false,
  },
  shortcuts: {
    "soft-break": {
      keyCondition: isHotkey("shift+enter"),
      handler: (editor, event) => {
        event.preventDefault();
        event.stopPropagation();
        Transforms.insertText(editor, "\n");
        return true;
      },
    },
  },
  transform: (editor, _logger, options) => {
    if (options.pasteNewlinesAsSoftBreaks) {
      editor.insertData = (data) => {
        const text = data.getData("text/plain").replace(/\r\n?/g, "\n");
        if (text) editor.insertText(text);
      };
    }
    return editor;
  },
});
