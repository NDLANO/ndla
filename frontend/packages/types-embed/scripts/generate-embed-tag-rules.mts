/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type {
  createDataAttributes,
  parseElementAttributes,
} from "../../editor/src/serialization/html/htmlSerializationHelpers";
import type { EmbedTagRule } from "../src/embedTagRules";

const outputPath = join(import.meta.dirname, "../../../../backend/validation/src/main/resources/embed-tag-rules.json");

const rulesModule: { embedTagRules: Record<string, EmbedTagRule> } = await import(
  new URL("../src/embedTagRules.ts", import.meta.url).href
);

const serializationHelpers: {
  createDataAttributes: typeof createDataAttributes;
  parseElementAttributes: typeof parseElementAttributes;
} = await import(new URL("../../editor/src/serialization/html/htmlSerializationHelpers.ts", import.meta.url).href);

const toKey = (attribute: string) =>
  Object.keys(serializationHelpers.parseElementAttributes([{ name: attribute, value: "" }]))[0] ?? "";

const toAttribute = (key: string) => Object.keys(serializationHelpers.createDataAttributes({ [key]: "" }))[0] ?? "";

const validate = (resource: string, { fields }: EmbedTagRule) => {
  const names = new Set(fields.map((field) => field.name));
  const keys = new Set(fields.map((field) => toKey(field.name)));
  if (names.size !== fields.length) throw new Error(`${resource} has duplicate fields`);
  if (keys.size !== fields.length) throw new Error(`${resource} has fields mapping to the same frontend key`);
  if (!fields.some((field) => field.name === "data-resource" && field.validation.required)) {
    throw new Error(`${resource} must have a required data-resource field`);
  }
  for (const { name, validation } of fields) {
    if (toAttribute(toKey(name)) !== name) {
      throw new Error(
        `${resource}.${name} becomes "${toKey(name)}", which serializes back to ${toAttribute(toKey(name))}`,
      );
    }
    if (validation.dataType === "ENUM" && !validation.allowedValues?.length) {
      throw new Error(`${resource}.${name} is an ENUM without allowedValues`);
    }
    const unknown = validation.mustCoexistWith?.filter((other) => !names.has(other)) ?? [];
    if (unknown.length) throw new Error(`${resource}.${name} must coexist with unknown fields: ${unknown.join(", ")}`);
  }
};

Object.entries(rulesModule.embedTagRules).forEach(([resource, rule]) => validate(resource, rule));

const output = {
  $comment:
    "Generated from frontend/packages/types-embed/src/embedTagRules.ts. Do not edit. Run `pnpm --filter @ndla/types-embed generate` in frontend/ after changing the rules.",
  attributes: rulesModule.embedTagRules,
  tags: [],
};

await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
