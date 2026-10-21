/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { arrayMove } from "@dnd-kit/helpers";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { isSortable, useSortable } from "@dnd-kit/react/sortable";
import { ContentEditableFieldLabel } from "@ndla/editor-components";
import { CheckLine, DeleteBinLine } from "@ndla/icons";
import {
  CheckboxControl,
  CheckboxHiddenInput,
  CheckboxIndicator,
  CheckboxRoot,
  FieldRoot,
  IconButton,
  RadioGroupItem,
  RadioGroupItemControl,
  RadioGroupItemHiddenInput,
  RadioGroupRoot,
} from "@ndla/primitives";
import { Stack, styled } from "@ndla/styled-system/jsx";
import { type MouseEvent, type ReactNode, type SyntheticEvent, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Node } from "slate";
import { RichTextEditor } from "../../../../components/RichTextEditor/RichTextEditor";
import {
  deserializeToSimpleRichText,
  serializeFromSimpleRichText,
} from "../../../../components/RichTextEditor/richTextSerialization";
import { DragHandle } from "../../components/DragHandle";
import { dndModifiers, makeDndPlugins } from "../../dndUtil";
import type { AlternativeFormValues, QuestionFormValues } from "./QuestionCard";

type QuestionType = QuestionFormValues["questionType"];

const SortableRow = styled("div", {
  base: {
    width: "full",
    display: "flex",
  },
});

const RadioToggle = styled(RadioGroupItem, {
  base: {
    flex: "1",
    alignItems: "flex-start",
    gap: "xsmall",
    "&:has(input:focus-visible)": {
      outline: "none!",
    },
  },
});

const CheckboxToggle = styled(CheckboxRoot, {
  base: {
    flex: "1",
    alignItems: "flex-start",
    gap: "xsmall",
  },
});

const AlternativeField = styled(FieldRoot, {
  base: {
    flex: "1",
    flexDirection: "row",
    alignItems: "flex-end",
  },
});

const AlignedWithInput = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    height: "xxlarge",
  },
});

const stopPropagation = (e: SyntheticEvent) => e.stopPropagation();

const preventLabelActivation = (e: MouseEvent<HTMLDivElement>) => {
  e.stopPropagation();
  if (e.currentTarget.contains(e.target as globalThis.Node)) {
    e.preventDefault();
  }
};

interface Props {
  alternatives: AlternativeFormValues[];
  questionType: QuestionType;
  randomOrder: boolean;
  onReorder: (alternatives: AlternativeFormValues[]) => void;
  onTextChange: (id: string, text: string) => void;
  onCorrectChange: (id: string, isCorrect: boolean) => void;
  onRemove: (id: string) => void;
}

export const AlternativesList = ({
  alternatives,
  questionType,
  randomOrder,
  onReorder,
  onTextChange,
  onCorrectChange,
  onRemove,
}: Props) => {
  const { i18n } = useTranslation();

  const dragDisabled = randomOrder || alternatives.length < 2;
  const canRemove = alternatives.length > 2;

  const plugins = useMemo(() => makeDndPlugins("quizalternative", i18n), [i18n]);

  const onDragEnd = (event: DragEndEvent) => {
    const { source } = event.operation;
    if (event.canceled || !isSortable(source) || source.initialIndex === source.index) return;
    onReorder(arrayMove(alternatives, source.initialIndex, source.index));
  };

  const rows = alternatives.map((alt, index) => (
    <AlternativeRow
      key={alt.id}
      alt={alt}
      index={index}
      questionType={questionType}
      dragDisabled={dragDisabled}
      canRemove={canRemove}
      onTextChange={onTextChange}
      onCorrectChange={onCorrectChange}
      onRemove={onRemove}
    />
  ));

  return (
    <DragDropProvider onDragEnd={onDragEnd} plugins={plugins} modifiers={dndModifiers}>
      {questionType === "SINGLE_CHOICE" ? (
        <RadioGroupRoot
          value={alternatives.find((alt) => alt.isCorrect)?.id ?? null}
          onValueChange={(details) => details.value && onCorrectChange(details.value, true)}
        >
          {rows}
        </RadioGroupRoot>
      ) : (
        rows
      )}
    </DragDropProvider>
  );
};

interface AlternativeRowProps {
  alt: AlternativeFormValues;
  index: number;
  questionType: QuestionType;
  dragDisabled: boolean;
  canRemove: boolean;
  onTextChange: (id: string, text: string) => void;
  onCorrectChange: (id: string, isCorrect: boolean) => void;
  onRemove: (id: string) => void;
}

const AlternativeRow = ({
  alt,
  index,
  questionType,
  dragDisabled,
  canRemove,
  onTextChange,
  onCorrectChange,
  onRemove,
}: AlternativeRowProps) => {
  const { t } = useTranslation();
  const [initialText] = useState(() => deserializeToSimpleRichText(alt.text));
  const plainText = useMemo(
    () =>
      deserializeToSimpleRichText(alt.text)
        .map((node) => Node.string(node))
        .join("")
        .trim(),
    [alt.text],
  );

  const dragHandleName = plainText || t("myNdla.quiz.form.alternativeNumber", { number: index + 1 });

  const { ref, handleRef } = useSortable({
    id: alt.id,
    index,
    disabled: dragDisabled,
    data: { name: dragHandleName },
  });

  return (
    <SortableRow ref={ref}>
      <CorrectAnswerToggle alt={alt} questionType={questionType} onCorrectChange={onCorrectChange}>
        <AlternativeField>
          <AlignedWithInput>
            <DragHandle ref={handleRef} name={dragHandleName} disabled={dragDisabled} type="quizalternative" />
          </AlignedWithInput>
          <Stack gap="xsmall" css={{ flex: "1" }}>
            <ContentEditableFieldLabel>{t("myNdla.quiz.form.alternative")}</ContentEditableFieldLabel>
            <div role="presentation" onClick={preventLabelActivation} onPointerDown={stopPropagation}>
              <RichTextEditor
                variant="simple"
                initialValue={initialText}
                onChange={(value) => onTextChange(alt.id, serializeFromSimpleRichText(value))}
                placeholder={t("myNdla.quiz.form.alternativePlaceholder")}
              />
            </div>
          </Stack>
          <AlignedWithInput css={{ paddingInlineStart: "xsmall", gap: "xxsmall" }}>
            <CorrectAnswerMarker questionType={questionType} />
            {!!canRemove && (
              <IconButton
                aria-label={t("myNdla.quiz.form.removeAlternative")}
                title={t("myNdla.quiz.form.removeAlternative")}
                variant="tertiary"
                size="small"
                onClick={() => onRemove(alt.id)}
              >
                <DeleteBinLine />
              </IconButton>
            )}
          </AlignedWithInput>
        </AlternativeField>
      </CorrectAnswerToggle>
    </SortableRow>
  );
};

interface CorrectAnswerToggleProps {
  alt: AlternativeFormValues;
  questionType: QuestionType;
  onCorrectChange: (id: string, isCorrect: boolean) => void;
  children: ReactNode;
}

// Wraps the row in a radio item or checkbox root, so clicking anywhere in the row marks it as correct
const CorrectAnswerToggle = ({ alt, questionType, onCorrectChange, children }: CorrectAnswerToggleProps) => {
  const { t } = useTranslation();

  if (questionType === "SINGLE_CHOICE") {
    return (
      <RadioToggle value={alt.id} title={t("myNdla.quiz.correctAnswer")}>
        {children}
        <RadioGroupItemHiddenInput />
      </RadioToggle>
    );
  }

  return (
    <CheckboxToggle
      checked={alt.isCorrect}
      onCheckedChange={(details) => onCorrectChange(alt.id, !!details.checked)}
      title={t("myNdla.quiz.correctAnswer")}
    >
      {children}
      <CheckboxHiddenInput />
    </CheckboxToggle>
  );
};

// The visible radio button / checkbox. Must be rendered inside CorrectAnswerToggle.
const CorrectAnswerMarker = ({ questionType }: { questionType: QuestionType }) => {
  if (questionType === "SINGLE_CHOICE") {
    return <RadioGroupItemControl />;
  }

  return (
    <CheckboxControl>
      <CheckboxIndicator asChild>
        <CheckLine />
      </CheckboxIndicator>
    </CheckboxControl>
  );
};
