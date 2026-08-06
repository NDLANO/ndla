/**
 * Copyright (c) 2022-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Translation } from "@ndla/types-backend/taxonomy-api";
import { useTranslation } from "react-i18next";
import { DiffField, DiffInnerField } from "./DiffField";
import { diffField, type DiffResult } from "./diffUtils";
import FieldWithTitle from "./FieldWithTitle";

interface Props {
  translations: DiffResult<Translation[]>;
}

type TagType = "original" | "other";
type KeyedTranslations = Record<string, { original?: string; other?: string }>;
interface TranslationWithType extends Translation {
  type: TagType;
}

type DiffedTranslations = Record<string, DiffResult<string>>;

const TranslationsDiff = ({ translations }: Props) => {
  const { t } = useTranslation();
  const originalTranslations: TranslationWithType[] =
    translations.original?.map((t) => ({ ...t, type: "original" })) ?? [];
  const otherTranslations: TranslationWithType[] = translations.other?.map((t) => ({ ...t, type: "other" })) ?? [];
  const keyedTranslations = originalTranslations.concat(otherTranslations).reduce<KeyedTranslations>((acc, curr) => {
    const existing = acc[curr.language];
    if (existing) {
      existing[curr.type] = curr.name;
    } else {
      acc[curr.language] = {
        [curr.type]: curr.name,
      };
    }
    return acc;
  }, {});

  const diff: DiffedTranslations = Object.entries(keyedTranslations).reduce<DiffedTranslations>((acc, [key, entry]) => {
    acc[key] = diffField(entry.original, entry.other, undefined);
    return acc;
  }, {});

  const entries = Object.entries(diff).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

  return (
    <DiffField>
      <FieldWithTitle title={t("diff.fields.translations.title")} key={"diff.fields.translations.left"}>
        {entries.map(([key, value], i) => (
          <DiffInnerField left type={value.diffType} key={`translations-left-${i}`}>
            {!!value.original && (
              <span>
                <strong>{`${key}: `}</strong>
                <span>{value.original}</span>
              </span>
            )}
          </DiffInnerField>
        ))}
      </FieldWithTitle>
      <FieldWithTitle title={t("diff.fields.translations.title")} key={"diff.fields.translations.right"}>
        {entries.map(([key, value], i) => (
          <DiffInnerField type={value.diffType} key={`translations-right-${i}`}>
            {!!value.other && (
              <span>
                <strong>{`${key}: `}</strong>
                <span>{value.other}</span>
              </span>
            )}
          </DiffInnerField>
        ))}
      </FieldWithTitle>
    </DiffField>
  );
};
export default TranslationsDiff;
