/**
 * Copyright (c) 2024-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ContentEditableFieldLabel } from "@ndla/editor-components";
import { Button, FieldErrorMessage, FieldHelper, FieldRoot, Heading } from "@ndla/primitives";
import { SafeLinkButton } from "@ndla/safelink";
import { Stack, styled } from "@ndla/styled-system/jsx";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { Descendant } from "slate";
import { RichTextEditor } from "../../../../components/RichTextEditor/RichTextEditor";
import { deserializeToRichText } from "../../../../components/RichTextEditor/richTextSerialization";
import { routes } from "../../../../routeHelpers";
import { LearningpathTitleField } from "./LearningpathTitleField";

const StyledForm = styled("form", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "xsmall",
    width: "100%",
  },
});

export interface TitleFormValues {
  title: string;
  imageUrl: string | undefined;
  introduction: Descendant[];
}
interface Props {
  onSave: (data: TitleFormValues) => Promise<void>;
  initialValues?: TitleFormValues;
}

export const TitleForm = ({ onSave, initialValues }: Props) => {
  const { t } = useTranslation();

  const { control, handleSubmit } = useForm<TitleFormValues>({
    values: {
      title: initialValues?.title ?? "",
      imageUrl: initialValues?.imageUrl ?? undefined,
      introduction: initialValues?.introduction ?? deserializeToRichText(""),
    },
  });

  return (
    <StyledForm onSubmit={handleSubmit(onSave)} id="titleForm">
      <Heading textStyle="heading.small" asChild consumeCss>
        <h2>{t("myNdla.learningpath.form.metadata.title")}</h2>
      </Heading>
      <LearningpathTitleField control={control} name="title" />
      <Controller
        control={control}
        name="introduction"
        render={({ field: { value, ...rest }, fieldState }) => (
          <FieldRoot invalid={!!fieldState.error?.message}>
            <ContentEditableFieldLabel>{t("validation.fields.introduction")}</ContentEditableFieldLabel>
            <FieldHelper>{t("myNdla.learningpath.form.metadata.introductionHelper")}</FieldHelper>
            <FieldErrorMessage>{fieldState.error?.message}</FieldErrorMessage>
            <RichTextEditor initialValue={value} {...rest} />
          </FieldRoot>
        )}
      />
      {/* May be added later
        <Controller
        control={control}
        name="imageUrl"
        rules={{
          required: t("myNdla.learningpath.form.title.imageRequired"),
          validate: (value) => !!value,
        }}
        render={({ field, fieldState }) => (
          <>
            <Text fontWeight="bold" textStyle="label.large">
              {t("myNdla.learningpath.form.title.metaImage")}
            </Text>
            <Text textStyle="label.small">{t("myNdla.learningpath.form.title.metaImageHelper")}</Text>
            {fieldState.error?.message ? <Text color="stroke.error">{fieldState.error.message}</Text> : null}
            <ImagePicker
              imageUrl={field.value}
              onSelectImage={(image) =>
                image?.id ? setValue("imageUrl", image.metaUrl) : resetField("imageUrl", { defaultValue: "" })
              }
            />
          </>
        )}
      /> */}
      {!initialValues ? (
        <Stack direction="row" justify="space-between">
          <SafeLinkButton to={routes.myNdla.learningpath} variant="secondary">
            {t("cancel")}
          </SafeLinkButton>
          <Button variant="secondary" type="submit">
            {t("myNdla.learningpath.form.next")}
          </Button>
        </Stack>
      ) : null}
    </StyledForm>
  );
};
