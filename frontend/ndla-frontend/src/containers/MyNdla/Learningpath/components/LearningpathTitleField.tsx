/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { FieldErrorMessage, FieldHelper, FieldInput, FieldLabel, FieldRoot } from "@ndla/primitives";
import { type Control, type FieldPathByValue, type FieldValues, useController } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useValidationTranslation } from "../../../../util/useValidationTranslation";
import { FieldLength } from "../../components/FieldLength";

const MAX_NAME_LENGTH = 64;

interface Props<T extends FieldValues> {
  control: Control<T>;
  name: FieldPathByValue<T, string>;
}

export const LearningpathTitleField = <T extends FieldValues>({ control, name }: Props<T>) => {
  const { t } = useTranslation();
  const { validationT } = useValidationTranslation();
  const { field, fieldState } = useController({
    control,
    name,
    rules: {
      required: validationT({ type: "required", field: "title" }),
      maxLength: {
        value: MAX_NAME_LENGTH,
        message: validationT({
          type: "maxLength",
          field: "title",
          vars: { count: MAX_NAME_LENGTH },
        }),
      },
    },
  });

  return (
    <FieldRoot invalid={!!fieldState.error?.message}>
      <FieldLabel fontWeight="bold" textStyle="label.large">
        {t("validation.fields.title")}
      </FieldLabel>
      <FieldHelper>{t("myNdla.learningpath.form.title.titleHelper")}</FieldHelper>
      <FieldErrorMessage>{fieldState.error?.message}</FieldErrorMessage>
      <FieldInput {...field} />
      <FieldLength value={field.value?.length ?? 0} maxLength={MAX_NAME_LENGTH} />
    </FieldRoot>
  );
};
