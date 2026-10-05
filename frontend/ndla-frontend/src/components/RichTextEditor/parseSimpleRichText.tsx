/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import parse, { type DOMNode, domToReact, Element, type HTMLReactParserOptions } from "html-react-parser";
import { createElement, Fragment } from "react";

const options: HTMLReactParserOptions = {
  replace: (node) => {
    if (!(node instanceof Element)) return;
    const children = domToReact(node.children as DOMNode[], options);
    switch (node.name) {
      case "strong":
        return <strong>{children}</strong>;
      case "em":
        return <em>{children}</em>;
      case "br":
        return <br />;
      case "span":
        return (
          <span lang={node.attribs.lang} dir={node.attribs.dir}>
            {children}
          </span>
        );
      default:
        return createElement(Fragment, null, children);
    }
  },
};

export const parseSimpleRichText = (html: string) => parse(html, options);
