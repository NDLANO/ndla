/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  breakPlugin,
  createSlate,
  inlineNavigationPlugin,
  LoggerManager,
  NOOP_ELEMENT_TYPE,
  noopPlugin,
  paragraphPlugin,
  sectionPlugin,
  singleLinePlugin,
  softBreakPlugin,
  spanPlugin,
} from "@ndla/editor";
import { Input, InputContainer, useFieldContext } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import { type FocusEvent, type TextareaHTMLAttributes, useMemo, useState } from "react";
import type { Descendant } from "slate";
import { Editable, Slate } from "slate-react";
import type { EditableProps } from "slate-react/dist/components/editable";
import { BreakElement } from "./plugins/break/BreakElement";
import { HeadingElement } from "./plugins/heading/HeadingElement";
import { headingPlugin } from "./plugins/heading/headingPlugin";
import { LinkElement } from "./plugins/link/LinkElement";
import { linkPlugin } from "./plugins/link/linkPlugin";
import { ListElement } from "./plugins/list/ListElement";
import { listPlugin } from "./plugins/list/listPlugin";
import { MarkLeaf } from "./plugins/mark/MarkLeaf";
import { markPlugin } from "./plugins/mark/markPlugin";
import { ParagraphElement } from "./plugins/paragraph/ParagraphElement";
import { SectionElement } from "./plugins/section/SectionElement";
import { SpanElement } from "./plugins/span/SpanElement";
import { RichTextToolbar } from "./Toolbar/RichTextToolbar";

export type RichTextEditorVariant = "full" | "simple";

interface Props extends Omit<TextareaHTMLAttributes<HTMLDivElement>, "onChange" | "value"> {
  initialValue: Descendant[];
  onChange?: (value: Descendant[]) => void;
  /**
   * full: Sections, headings, lists and links. The toolbar is always visible.
   * simple: A single paragraph with bold, italic, language and line breaks. Looks like a regular input until focused.
   */
  variant?: RichTextEditorVariant;
}

export const simpleRichTextPlugins = [
  inlineNavigationPlugin,
  noopPlugin,
  paragraphPlugin.configure({ options: { nonSerializableParents: [NOOP_ELEMENT_TYPE] } }),
  markPlugin.configure({ options: { supportedMarks: { value: ["bold", "italic"], override: true } } }),
  softBreakPlugin,
  spanPlugin,
  singleLinePlugin.configure({ options: { pasteAsPlainText: true } }),
];

const editorConfig = {
  full: {
    plugins: [
      inlineNavigationPlugin,
      sectionPlugin,
      headingPlugin,
      markPlugin,
      listPlugin,
      paragraphPlugin,
      softBreakPlugin,
      breakPlugin,
      linkPlugin,
      spanPlugin,
    ],
    elementRenderers: [
      SectionElement,
      ParagraphElement,
      BreakElement,
      HeadingElement,
      ListElement,
      LinkElement,
      SpanElement,
    ],
  },
  simple: {
    plugins: simpleRichTextPlugins,
    elementRenderers: [ParagraphElement, SpanElement],
  },
};

const EditorWrapper = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
  },
});

const StyledEditable = styled(
  Editable,
  {
    variants: {
      variant: {
        full: {
          backgroundColor: "background.default",
          paddingInline: "xsmall",
          borderRadius: "xsmall",
          borderTopRadius: "0px",
          border: "1px solid",
          borderColor: "stroke.subtle",
          _focusVisible: {
            borderColor: "surface.action.active",
            outline: "1px solid",
            outlineColor: "surface.action.active",
            outlineOffset: "-2px",
          },
        },
        simple: {
          "& p": {
            margin: "0",
            // Slate positions the placeholder absolutely at top: 0. Anchor it to the paragraph instead of the padded editable
            position: "relative",
          },
          "& [data-slate-placeholder]": {
            color: "text.subtle",
            opacity: "1!",
          },
        },
      },
    },
  },
  { baseComponent: true },
);

export const RichTextEditor = ({ initialValue, onChange, variant = "full", ...rest }: Props) => {
  const [isFocused, setIsFocused] = useState(false);
  const [editor] = useState(() =>
    createSlate({
      value: initialValue,
      plugins: editorConfig[variant].plugins,
      elementRenderers: editorConfig[variant].elementRenderers,
      leafRenderers: [MarkLeaf],
      logger: new LoggerManager({ debug: true }),
      shouldNormalize: true,
    }),
  );

  const field = useFieldContext();
  const fieldProps = useMemo(() => (field?.getTextareaProps() as EditableProps | undefined) ?? {}, [field]);

  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsFocused(false);
    }
  };

  const showToolbar = variant === "full" || isFocused;

  const styledEditable = (
    <StyledEditable
      variant={variant}
      onKeyDown={editor.onKeyDown}
      renderElement={(props) => editor.renderElement?.(props) || <div {...props.attributes}>{props.children}</div>}
      renderLeaf={(props) => editor.renderLeaf?.(props) || <span {...props.attributes}>{props.children}</span>}
      {...fieldProps}
      aria-labelledby={field?.ids.label}
      {...rest}
    />
  );

  const editable = (
    <Slate editor={editor} initialValue={editor.children} onValueChange={onChange}>
      {showToolbar ? <RichTextToolbar variant={variant} /> : null}
      {variant === "simple" ? <Input asChild>{styledEditable}</Input> : styledEditable}
    </Slate>
  );

  if (variant === "simple") {
    return (
      <InputContainer
        aria-invalid={field?.invalid || undefined}
        css={{ flexDirection: "column", alignItems: "stretch", paddingInline: "0!" }}
        onFocus={() => setIsFocused(true)}
        onBlur={onBlur}
      >
        {editable}
      </InputContainer>
    );
  }

  return (
    <EditorWrapper className="ndla-article" onFocus={() => setIsFocused(true)} onBlur={onBlur}>
      {editable}
    </EditorWrapper>
  );
};
