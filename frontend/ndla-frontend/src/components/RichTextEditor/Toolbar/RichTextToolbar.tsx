/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Bold, Italic, ListOrdered, ListUnordered } from "@ndla/icons";
import { styled } from "@ndla/styled-system/jsx";
import type { MouseEvent } from "react";
import { HeadingToolbarSelect } from "../plugins/heading/HeadingToolbarSelect";
import { LinkToolbarButton } from "../plugins/link/LinkToolbarButton";
import { LINK_SHORTCUT } from "../plugins/link/linkUtils";
import { BULLETED_LIST_SHORTCUT, NUMBERED_LIST_SHORTCUT } from "../plugins/list/listShortcuts";
import { ListToolbarButton } from "../plugins/list/ListToolbarButton";
import { BOLD_SHORTCUT, ITALIC_SHORTCUT } from "../plugins/mark/markShortcuts";
import { MarkToolbarButton } from "../plugins/mark/MarkToolbarButton";
import { LanguageToolbarSelect } from "../plugins/span/LanguageToolbarSelect";
import type { RichTextEditorVariant } from "../RichTextEditor";

const ToolbarContainer = styled("div", {
  base: {
    display: "flex",
    gap: "3xsmall",
    padding: "3xsmall",
    borderTopRadius: "xsmall",
    borderColor: "stroke.subtle",
  },
  variants: {
    variant: {
      full: {
        border: "1px solid",
        borderBottom: "none",
        backgroundColor: "surface.actionSubtle.hover",
      },
      // Only visible while the editor is focused.
      simple: {
        margin: "2px 2px 0",
        borderTopRadius: "calc(token(radii.xsmall) - 2px)",
        borderBottom: "1px solid",
        borderColor: "stroke.subtle",
        backgroundColor: "surface.infoSubtle",
      },
    },
  },
});

const Separator = styled("span", {
  base: {
    borderLeft: "1px solid",
    borderColor: "stroke.subtle",
  },
});

// Keep focus in the editor when clicking the toolbar background, so the simple variant does not hide the toolbar
const onMouseDown = (e: MouseEvent<HTMLDivElement>) => {
  if (e.target === e.currentTarget) e.preventDefault();
};

interface Props {
  variant?: RichTextEditorVariant;
}

export const RichTextToolbar = ({ variant = "full" }: Props) => (
  <ToolbarContainer variant={variant} onMouseDown={onMouseDown}>
    <MarkToolbarButton mark="bold" shortcut={BOLD_SHORTCUT}>
      <Bold />
    </MarkToolbarButton>
    <MarkToolbarButton mark="italic" shortcut={ITALIC_SHORTCUT}>
      <Italic />
    </MarkToolbarButton>
    {variant === "full" ? (
      <>
        <ListToolbarButton listType="bulleted-list" shortcut={BULLETED_LIST_SHORTCUT}>
          <ListUnordered />
        </ListToolbarButton>
        <ListToolbarButton listType="numbered-list" shortcut={NUMBERED_LIST_SHORTCUT}>
          <ListOrdered />
        </ListToolbarButton>
        <LinkToolbarButton shortcut={LINK_SHORTCUT} />
        <Separator />
        <HeadingToolbarSelect />
        <Separator />
      </>
    ) : null}
    <LanguageToolbarSelect />
  </ToolbarContainer>
);
