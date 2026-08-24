/**
 * Copyright (c) 2023-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { MetaData } from "@ndla/types-embed";
import { UnknownEmbed } from "@ndla/ui";
import parse, { type HTMLReactParserOptions } from "html-react-parser";
import { plugins } from "./plugins";
import { embedPlugins } from "./plugins/embed";
import { type TransformOptions } from "./plugins/types";

export const transform = (content: string, opts: TransformOptions) => {
  const options: HTMLReactParserOptions = {
    replace: (node) => {
      if (!("attribs" in node)) {
        return;
      }
      const plugin = plugins[node.name];
      if (plugin) {
        return plugin(node, options, opts, transform);
      }
      if (node.name === "ndlaembed") {
        const resource = node.attribs["data-resource"];
        const embedPlugin = resource ? embedPlugins[resource] : undefined;
        if (embedPlugin) {
          return embedPlugin(node, options, opts, transform);
        }
        const json = node.attribs["data-json"];
        if (!json) return undefined;
        const embed = JSON.parse(json) as MetaData<any, any>;
        return <UnknownEmbed embed={embed} />;
      }
      return undefined;
    },
  };
  const replaced = parse(content, options);

  return replaced;
};
