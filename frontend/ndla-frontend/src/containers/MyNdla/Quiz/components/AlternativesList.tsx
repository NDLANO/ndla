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
import { CheckLine, DeleteBinLine } from "@ndla/icons";
import {
  CheckboxControl,
  CheckboxHiddenInput,
  CheckboxIndicator,
  CheckboxRoot,
  FieldInput,
  FieldLabel,
  FieldRoot,
  IconButton,
  RadioGroupItem,
  RadioGroupItemControl,
  RadioGroupItemHiddenInput,
  RadioGroupRoot,
} from "@ndla/primitives";
import { Stack, styled } from "@ndla/styled-system/jsx";
import { type ReactNode, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { DragHandle } from "../../components/DragHandle";
import { makeDndTranslations } from "../../dndUtil";
import type { AlternativeFormValues, QuestionFormValues } from "./QuestionCard";

type QuestionType = QuestionFormValues["questionType"];

// Layout of a single alternative row:
//
// SortableRow                      – the element dnd-kit moves around
//   CorrectAnswerToggle            – radio item / checkbox root, so clicking anywhere in the row toggles "correct"
//     AlternativeField             – the form field (label + input), laid out horizontally
//       AlignedWithInput           – drag handle
//       label + input
//       AlignedWithInput           – CorrectAnswerMarker (visible radio/checkbox) + delete button

const SortableRow = styled("div", {
  base: {
    width: "100%",
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

// Same height as FieldInput, so controls are centered against the input rather than the label
const AlignedWithInput = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    height: "xxlarge",
  },
});

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
  const { t } = useTranslation();

  const alternativeIds = useMemo(() => alternatives.map((alt) => alt.id), [alternatives]);
  const dragDisabled = randomOrder || alternatives.length < 2;
  const canRemove = alternatives.length > 2;

  const announcements = useMemo(
    () => makeDndTranslations("quizalternative", t, alternatives.length),
    [alternatives.length, t],
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = alternativeIds.indexOf(active.id as string);
    const newIndex = alternativeIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(alternatives, oldIndex, newIndex));
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      accessibility={{ announcements }}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
    >
      <SortableContext items={alternativeIds} disabled={dragDisabled} strategy={verticalListSortingStrategy}>
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
      </SortableContext>
    </DndContext>
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
  const { setNodeRef, transform, transition, isDragging } = useSortable({
    id: alt.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : undefined,
  };

  const dragHandleName = alt.text || t("myNdla.quiz.form.alternativeNumber", { number: index + 1 });

  return (
    <SortableRow ref={setNodeRef} style={style}>
      <CorrectAnswerToggle alt={alt} questionType={questionType} onCorrectChange={onCorrectChange}>
        <AlternativeField>
          <AlignedWithInput>
            <DragHandle sortableId={alt.id} name={dragHandleName} disabled={dragDisabled} type="quizalternative" />
          </AlignedWithInput>
          <Stack gap="small" css={{ flex: "1" }}>
            <FieldLabel>{t("myNdla.quiz.form.alternative")}</FieldLabel>
            <FieldInput
              value={alt.text}
              onChange={(e) => onTextChange(alt.id, e.currentTarget.value)}
              placeholder={t("myNdla.quiz.form.alternativePlaceholder")}
            />
          </Stack>
          <AlignedWithInput css={{ paddingInlineStart: "xsmall" }}>
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
