/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AddLine, ArrowDownShortLine, ArrowUpShortLine, DeleteBinLine, SubtractLine } from "@ndla/icons";
import {
  Button,
  CheckboxControl,
  CheckboxHiddenInput,
  CheckboxRoot,
  FieldInput,
  FieldLabel,
  FieldRoot,
  IconButton,
  RadioGroupItem,
  RadioGroupItemControl,
  RadioGroupItemHiddenInput,
  RadioGroupRoot,
  SwitchControl,
  SwitchHiddenInput,
  SwitchLabel,
  SwitchRoot,
  SwitchThumb,
  Text,
} from "@ndla/primitives";
import { HStack, styled } from "@ndla/styled-system/jsx";
import { type ReactNode, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { DragHandle } from "../../components/DragHandle";
import { makeDndTranslations } from "../../dndUtil";
import { QuestionSettingsDialog } from "./QuestionSettingsDialog";

export interface AlternativeFormValues {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuestionFormValues {
  id: string;
  serverId?: string;
  title: string;
  questionType: "SINGLE_CHOICE" | "MULTI_CHOICE";
  required: boolean;
  alternativesRandomOrder: boolean;
  alternatives: AlternativeFormValues[];
}

interface Props {
  question: QuestionFormValues;
  index: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  showMoveButtons: boolean;
  onChange: (question: QuestionFormValues) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

const Card = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    gap: "small",
    padding: "small",
    backgroundColor: "background.default",
    borderRadius: "xsmall",
    boxShadow: "xsmall",
    border: "1px solid",
    borderColor: "stroke.subtle",
    _hover: {
      borderColor: "stroke.hover",
    },
    _focusWithin: {
      borderColor: "stroke.hover",
    },
  },
});

const NumberCircle = styled(Text, {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: "0",
    borderRadius: "50%",
    border: "1px solid",
    borderColor: "stroke.default",
    width: "large",
    height: "large",
  },
});

const AlternativeRowWrapper = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "xsmall",
  },
});

const AlternativeRadioItem = styled(RadioGroupItem, {
  base: {
    flex: "1",
    alignItems: "flex-end",
    gap: "xsmall",
  },
});

const AlternativeCheckboxRoot = styled(CheckboxRoot, {
  base: {
    flex: "1",
    alignItems: "flex-end",
    gap: "xsmall",
  },
});

const AlternativeFieldRoot = styled(FieldRoot, {
  base: {
    flex: "1",
  },
});

export const QuestionCard = ({
  question,
  index,
  canMoveUp,
  canMoveDown,
  showMoveButtons,
  onChange,
  onMoveUp,
  onMoveDown,
  onDelete,
}: Props) => {
  const { t } = useTranslation();

  const setAlternatives = (alternatives: AlternativeFormValues[]) => onChange({ ...question, alternatives });

  const onAddAlternative = () => {
    setAlternatives([...question.alternatives, { id: crypto.randomUUID(), text: "", isCorrect: false }]);
  };

  const onRemoveLastAlternative = () => {
    setAlternatives(question.alternatives.slice(0, -1));
  };

  const onAlternativeTextChange = (id: string, text: string) => {
    setAlternatives(question.alternatives.map((alt) => (alt.id === id ? { ...alt, text } : alt)));
  };

  const onAlternativeCorrectChange = (id: string, isCorrect: boolean) => {
    if (question.questionType === "SINGLE_CHOICE") {
      setAlternatives(question.alternatives.map((alt) => ({ ...alt, isCorrect: alt.id === id && isCorrect })));
    } else {
      setAlternatives(question.alternatives.map((alt) => (alt.id === id ? { ...alt, isCorrect } : alt)));
    }
  };

  const alternativeIds = useMemo(() => question.alternatives.map((alt) => alt.id), [question.alternatives]);

  const announcements = useMemo(
    () => makeDndTranslations("quizalternative", t, question.alternatives.length),
    [question.alternatives.length, t],
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = alternativeIds.indexOf(active.id as string);
    const newIndex = alternativeIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    setAlternatives(arrayMove(question.alternatives, oldIndex, newIndex));
  };

  return (
    <Card>
      <HStack justify="space-between" gap="xsmall">
        <HStack gap="xsmall">
          <NumberCircle textStyle="label.small" fontWeight="bold" asChild consumeCss>
            <span>{index + 1}</span>
          </NumberCircle>
          <Text fontWeight="bold" textStyle="label.medium">
            {t("myNdla.quiz.form.cardTitle")}
          </Text>
        </HStack>
        <HStack gap="small">
          <QuestionSettingsDialog question={question} onChange={onChange} />
          <SwitchRoot
            checked={question.questionType === "MULTI_CHOICE"}
            onCheckedChange={(details) =>
              onChange({
                ...question,
                questionType: details.checked ? "MULTI_CHOICE" : "SINGLE_CHOICE",
                alternatives: question.alternatives.map((alt) => ({ ...alt, isCorrect: false })),
              })
            }
          >
            <SwitchLabel textStyle="label.small">{t("myNdla.quiz.form.settings.multipleAnswers")}</SwitchLabel>
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
            <SwitchHiddenInput />
          </SwitchRoot>
          {showMoveButtons ? (
            <>
              <IconButton
                aria-label={t("myNdla.quiz.form.moveUp")}
                title={t("myNdla.quiz.form.moveUp")}
                variant="tertiary"
                size="small"
                onClick={onMoveUp}
                disabled={!canMoveUp}
              >
                <ArrowUpShortLine />
              </IconButton>
              <IconButton
                aria-label={t("myNdla.quiz.form.moveDown")}
                title={t("myNdla.quiz.form.moveDown")}
                variant="tertiary"
                size="small"
                onClick={onMoveDown}
                disabled={!canMoveDown}
              >
                <ArrowDownShortLine />
              </IconButton>
            </>
          ) : null}
        </HStack>
      </HStack>
      <FieldRoot>
        <FieldLabel>{t("myNdla.quiz.form.questionTitle")}</FieldLabel>
        <FieldInput
          value={question.title}
          onChange={(e) => onChange({ ...question, title: e.currentTarget.value })}
          placeholder={t("myNdla.quiz.form.questionTitlePlaceholder")}
        />
      </FieldRoot>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
        accessibility={{ announcements }}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      >
        <SortableContext
          items={alternativeIds}
          disabled={question.alternatives.length < 2}
          strategy={verticalListSortingStrategy}
        >
          {question.questionType === "SINGLE_CHOICE" ? (
            <RadioGroupRoot
              value={question.alternatives.find((alt) => alt.isCorrect)?.id ?? null}
              onValueChange={(details) => details.value && onAlternativeCorrectChange(details.value, true)}
            >
              {question.alternatives.map((alt, altIndex) => (
                <SortableAlternativeRow
                  key={alt.id}
                  id={alt.id}
                  name={alt.text || t("myNdla.quiz.form.alternativeNumber", { number: altIndex + 1 })}
                  itemCount={question.alternatives.length}
                >
                  <AlternativeRadioItem value={alt.id} title={t("myNdla.quiz.correctAnswer")}>
                    <AlternativeFieldRoot>
                      <FieldLabel>{t("myNdla.quiz.form.alternative")}</FieldLabel>
                      <FieldInput
                        value={alt.text}
                        onChange={(e) => onAlternativeTextChange(alt.id, e.currentTarget.value)}
                        placeholder={t("myNdla.quiz.form.alternativePlaceholder")}
                      />
                    </AlternativeFieldRoot>
                    <RadioGroupItemControl />
                    <RadioGroupItemHiddenInput />
                  </AlternativeRadioItem>
                </SortableAlternativeRow>
              ))}
            </RadioGroupRoot>
          ) : (
            question.alternatives.map((alt, altIndex) => (
              <SortableAlternativeRow
                key={alt.id}
                id={alt.id}
                name={alt.text || t("myNdla.quiz.form.alternativeNumber", { number: altIndex + 1 })}
                itemCount={question.alternatives.length}
              >
                <AlternativeCheckboxRoot
                  checked={alt.isCorrect}
                  onCheckedChange={(details) => onAlternativeCorrectChange(alt.id, !!details.checked)}
                  title={t("myNdla.quiz.correctAnswer")}
                >
                  <AlternativeFieldRoot>
                    <FieldLabel>{t("myNdla.quiz.form.alternative")}</FieldLabel>
                    <FieldInput
                      value={alt.text}
                      onChange={(e) => onAlternativeTextChange(alt.id, e.currentTarget.value)}
                      placeholder={t("myNdla.quiz.form.alternativePlaceholder")}
                    />
                  </AlternativeFieldRoot>
                  <CheckboxControl />
                  <CheckboxHiddenInput />
                </AlternativeCheckboxRoot>
              </SortableAlternativeRow>
            ))
          )}
        </SortableContext>
      </DndContext>
      <HStack justify="space-between" gap="small">
        <HStack gap="small">
          <Button variant="tertiary" size="small" onClick={onAddAlternative}>
            <AddLine />
            {t("myNdla.quiz.form.addAlternative")}
          </Button>
          {question.alternatives.length > 2 && (
            <Button variant="tertiary" size="small" onClick={onRemoveLastAlternative}>
              <SubtractLine />
              {t("myNdla.quiz.form.removeAlternative")}
            </Button>
          )}
        </HStack>
        <Button variant="tertiary" size="small" onClick={onDelete}>
          <DeleteBinLine />
          {t("myNdla.quiz.form.settings.delete")}
        </Button>
      </HStack>
    </Card>
  );
};

interface SortableAlternativeRowProps {
  id: string;
  name: string;
  itemCount: number;
  children: ReactNode;
}

const SortableAlternativeRow = ({ id, name, itemCount, children }: SortableAlternativeRowProps) => {
  const { setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : undefined,
  };

  return (
    <AlternativeRowWrapper ref={setNodeRef} style={style}>
      <DragHandle sortableId={id} name={name} disabled={itemCount < 2} type="quizalternative" />
      {children}
    </AlternativeRowWrapper>
  );
};
