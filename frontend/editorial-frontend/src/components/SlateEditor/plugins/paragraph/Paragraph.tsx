/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ParagraphElement } from "@ndla/editor";
import type { ReactNode } from "react";
import type { Editor } from "slate";
import type { RenderElementProps } from "slate-react";

interface Props {
  attributes: RenderElementProps["attributes"];
  element: ParagraphElement;
  children: ReactNode;
  editor: Editor;
}

const Paragraph = ({ attributes, children, element }: Props) => {
  return (
    <p data-align={element.data?.align ?? ""} {...attributes}>
      {children}
    </p>
  );
};

export default Paragraph;
