/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ContentEditableFieldLabel } from "@ndla/editor-components";
import { AddLine } from "@ndla/icons";
import {
  Button,
  FieldRoot,
  SwitchControl,
  SwitchHiddenInput,
  SwitchLabel,
  SwitchRoot,
  SwitchThumb,
  Text,
} from "@ndla/primitives";
import { HStack, styled } from "@ndla/styled-system/jsx";
import { memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Descendant } from "slate";
import { RichTextEditor } from "../../../../components/RichTextEditor/RichTextEditor";
import {
  deserializeToSimpleRichText,
  serializeFromSimpleRichText,
} from "../../../../components/RichTextEditor/richTextSerialization";
import type { GQLQuestionType } from "../../../../graphqlTypes";
import { AlternativesList } from "./AlternativesList";
import { QuestionCardHeader } from "./QuestionCardHeader";
import { QuestionDeleteDialog } from "./QuestionDeleteDialog";

export interface AlternativeFormValues {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuestionFormValues {
  id: string;
  serverId?: string;
  title: string;
  questionType: GQLQuestionType;
  required: boolean;
  alternativesRandomOrder: boolean;
  alternatives: AlternativeFormValues[];
}

interface Props {
  question: QuestionFormValues;
  index: number;
  onChange: (id: string, updater: (question: QuestionFormValues) => QuestionFormValues) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onDelete: (id: string) => void;
  error?: string;
  focusOnMount?: boolean;
}

const Card = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    width: "full",
    gap: "medium",
    padding: "medium",
    backgroundColor: "background.default",
    borderRadius: "xsmall",
    boxShadow: "xsmall",
    _hover: {
      borderColor: "stroke.hover",
    },
    _focusWithin: {
      borderColor: "stroke.hover",
    },
  },
});

export const QuestionCard = memo(function QuestionCard({
  question,
  index,
  onChange,
  onMove,
  canMoveUp,
  canMoveDown,
  onDelete,
  error,
  focusOnMount,
}: Props) {
  const { t } = useTranslation();
  const [initialTitle] = useState(() => deserializeToSimpleRichText(question.title));
  const [focusAlternativeId, setFocusAlternativeId] = useState<string>();
  const questionId = question.id;

  const update = useCallback(
    (updater: (question: QuestionFormValues) => QuestionFormValues) => onChange(questionId, updater),
    [onChange, questionId],
  );

  const updateAlternatives = useCallback(
    (updater: (alternatives: AlternativeFormValues[]) => AlternativeFormValues[]) =>
      update((q) => ({ ...q, alternatives: updater(q.alternatives) })),
    [update],
  );

  const onReorder = useCallback(
    (alternatives: AlternativeFormValues[]) => updateAlternatives(() => alternatives),
    [updateAlternatives],
  );

  const onAddAlternative = () => {
    const id = crypto.randomUUID();
    setFocusAlternativeId(id);
    updateAlternatives((alternatives) => [...alternatives, { id, text: "", isCorrect: false }]);
  };

  const onRemoveAlternative = useCallback(
    (id: string) => updateAlternatives((alternatives) => alternatives.filter((alt) => alt.id !== id)),
    [updateAlternatives],
  );

  const onAlternativeTextChange = useCallback(
    (id: string, text: string) =>
      updateAlternatives((alternatives) => alternatives.map((alt) => (alt.id === id ? { ...alt, text } : alt))),
    [updateAlternatives],
  );

  const onAlternativeCorrectChange = useCallback(
    (id: string, isCorrect: boolean) =>
      update((q) => ({
        ...q,
        alternatives:
          q.questionType === "SINGLE_CHOICE"
            ? q.alternatives.map((alt) => ({ ...alt, isCorrect: alt.id === id && isCorrect }))
            : q.alternatives.map((alt) => (alt.id === id ? { ...alt, isCorrect } : alt)),
      })),
    [update],
  );

  const onQuestionTypeChange = useCallback(
    (multiChoice: boolean) => {
      setFocusAlternativeId(undefined);
      update((q) => ({
        ...q,
        questionType: multiChoice ? "MULTI_CHOICE" : "SINGLE_CHOICE",
        alternatives: q.alternatives.map((alt) => ({ ...alt, isCorrect: false })),
      }));
    },
    [update],
  );

  const onTitleChange = useCallback(
    (value: Descendant[]) => update((q) => ({ ...q, title: serializeFromSimpleRichText(value) })),
    [update],
  );

  const onMoveUp = useCallback(() => onMove(questionId, -1), [onMove, questionId]);
  const onMoveDown = useCallback(() => onMove(questionId, 1), [onMove, questionId]);
  const onDeleteQuestion = useCallback(() => onDelete(questionId), [onDelete, questionId]);

  return (
    <Card>
      <QuestionCardHeader
        index={index}
        questionType={question.questionType}
        onQuestionTypeChange={onQuestionTypeChange}
        onMoveUp={canMoveUp ? onMoveUp : undefined}
        onMoveDown={canMoveDown ? onMoveDown : undefined}
        focusOnMount={focusOnMount}
      />
      <FieldRoot css={{ gap: "xsmall" }}>
        <ContentEditableFieldLabel>{t("myNdla.quiz.form.questionTitle")}</ContentEditableFieldLabel>
        <RichTextEditor
          variant="simple"
          initialValue={initialTitle}
          onChange={onTitleChange}
          placeholder={t("myNdla.quiz.form.questionTitlePlaceholder")}
        />
      </FieldRoot>
      <HStack justify="flex-end" css={{ width: "full", paddingInlineEnd: "xsmall" }}>
        <SwitchRoot
          checked={question.alternativesRandomOrder}
          onCheckedChange={(details) => update((q) => ({ ...q, alternativesRandomOrder: details.checked }))}
        >
          <SwitchLabel textStyle="label.small">{t("myNdla.quiz.form.settings.randomOrder")}</SwitchLabel>
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
          <SwitchHiddenInput />
        </SwitchRoot>
      </HStack>
      <AlternativesList
        alternatives={question.alternatives}
        questionType={question.questionType}
        randomOrder={question.alternativesRandomOrder}
        onReorder={onReorder}
        onTextChange={onAlternativeTextChange}
        onCorrectChange={onAlternativeCorrectChange}
        onRemove={onRemoveAlternative}
        focusAlternativeId={focusAlternativeId}
      />
      {!!error && (
        <Text textStyle="label.small" color="text.error">
          {error}
        </Text>
      )}
      <HStack justify="space-between" gap="small">
        <HStack gap="small">
          <Button variant="tertiary" size="small" onClick={onAddAlternative}>
            <AddLine />
            {t("myNdla.quiz.form.addAlternative")}
          </Button>
        </HStack>
        <QuestionDeleteDialog onDelete={onDeleteQuestion} />
      </HStack>
    </Card>
  );
});
