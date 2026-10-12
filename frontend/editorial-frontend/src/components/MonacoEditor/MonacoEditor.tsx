/**
 * Copyright (c) 2019-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { styled } from "@ndla/styled-system/jsx";
import "monaco-editor/editor/browser/coreCommands";
import "monaco-editor/language/html/monaco.contribution";
import "monaco-editor/languages/definitions/html/register";
import "monaco-editor/features/bracketMatching/register";
import "monaco-editor/features/find/register";
import "monaco-editor/features/fontZoom/register";
import "monaco-editor/features/inlineCompletions/register";
import "monaco-editor/features/linesOperations/register";
import "monaco-editor/features/links/register";
import "monaco-editor/features/multicursor/register";
import "monaco-editor/features/quickCommand/register";
import "monaco-editor/features/wordHighlighter/register";
import * as monaco from "monaco-editor/editor/editor.api";
import htmlWorker from "monaco-editor/language/html/html.worker?worker";
// Uncomment the following line to test all monaco-editor features
// import * as monaco from "monaco-editor";
import { useEffect, useEffectEvent, useRef } from "react";
import { createFormatAction, createSaveAction } from "./editorActions";

const StyledDiv = styled("div", {
  base: {
    border: "1px solid",
    borderColor: "stroke.subtle",
  },
  defaultVariants: {
    size: "small",
  },
  variants: {
    size: {
      small: {
        height: "50vh",
      },
      large: {
        height: "75vh",
      },
    },
  },
});

monaco.editor.defineTheme("myCustomTheme", {
  base: "vs",
  inherit: false,
  rules: [
    { token: "tag", foreground: "CC342B" },
    {
      token: "invalidtag",
      foreground: "ff0000",
      fontStyle: "underline bold",
    },
    { token: "attribute.name", foreground: "3971ED" },
    { token: "attribute.value", foreground: "178844" },
  ],
  colors: {},
});

self.MonacoEnvironment = {
  getWorker() {
    return new htmlWorker();
  },
};

interface Props {
  value: string;
  onChange: (value: string, event: monaco.editor.IModelContentChangedEvent) => void;
  onSave: (value: string) => void;
  size?: "small" | "large";
}

export const MonacoEditor = ({ value, onChange, onSave, size }: Props) => {
  const divRef = useRef<HTMLDivElement | null>(null);
  const onContentChange = useEffectEvent(onChange);
  const onSaveContent = useEffectEvent(onSave);

  useEffect(() => {
    if (!divRef.current) return;
    const editor = monaco.editor.create(divRef.current, {
      value,
      scrollBeyondLastLine: false,
      theme: "myCustomTheme",
      wordWrap: "on",
      fontSize: 15,
      minimap: {
        enabled: false,
      },
      language: "html",
    });
    const disposables = [
      editor.onDidChangeModelContent((event) => onContentChange(editor.getValue(), event)),
      editor.addAction(createFormatAction()),
      editor.addAction(createSaveAction((value) => onSaveContent(value))),
    ];
    return () => {
      disposables.forEach((disposable) => disposable.dispose());
      editor.dispose();
    };
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <StyledDiv size={size} ref={divRef} />;
};

export default MonacoEditor;
