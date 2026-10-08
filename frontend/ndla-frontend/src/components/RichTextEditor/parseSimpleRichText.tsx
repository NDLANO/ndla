/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import parse, { type DOMNode, domToReact, type Element, type HTMLReactParserOptions } from "html-react-parser";

const options: HTMLReactParserOptions = {
  replace: (node) => {
    // Check node.type rather than instanceof Element, which fails open if multiple versions of domhandler are bundled
    if (node.type === "script" || node.type === "style") return <></>;
    if (node.type !== "tag") return;
    const element = node as Element;
    const children = () => domToReact(element.children as DOMNode[], options);
    switch (element.name) {
      case "strong":
        return <strong>{children()}</strong>;
      case "em":
        return <em>{children()}</em>;
      case "br":
        return <br />;
      case "span":
        return (
          <span lang={element.attribs.lang} dir={element.attribs.dir}>
            {children()}
          </span>
        );
      default:
        return <>{children()}</>;
    }
  },
};

export const parseSimpleRichText = (html: string) => parse(html, options);
