/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StripSuffix } from "@ndla/locales";
import type { ParseKeys } from "i18next";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import type messages from "../messages/messagesNB";

type ValidationMessages = (typeof messages)["validation"];
type SupportedFields = keyof ValidationMessages["fields"];

/** Validation types that have a `<type>Field` variant, i.e. can be rendered with a field name. */
type FieldedType = StripSuffix<Extract<keyof ValidationMessages, `${string}Field`>, "Field">;
type PlainType = Exclude<Extract<keyof ValidationMessages, string>, "fields" | `${string}Field`>;

type TranslationProps =
  | { type: FieldedType; field: SupportedFields; vars?: Record<string, any> }
  | { type: PlainType; field?: undefined; vars?: Record<string, any> };

type Props = TranslationProps | ParseKeys;

export const useValidationTranslation = () => {
  const { t: internalT } = useTranslation();

  const validationT = useCallback(
    (translation: Props) => {
      if (typeof translation === "string") {
        return internalT(translation);
      } else if (translation.field) {
        const { type, field, vars } = translation;
        return internalT(`validation.${type}Field`, { field, ...vars });
      } else {
        return internalT(`validation.${translation.type}`);
      }
    },
    [internalT],
  );

  return { validationT };
};
