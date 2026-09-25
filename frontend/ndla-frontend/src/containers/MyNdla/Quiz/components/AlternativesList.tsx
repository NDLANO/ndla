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
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
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
import { styled } from "@ndla/styled-system/jsx";
import { type ReactNode, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { DragHandle } from "../../components/DragHandle";
import { makeDndTranslations } from "../../dndUtil";
import type { AlternativeFormValues, QuestionFormValues } from "./QuestionCard";

const AlternativeRowWrapper = styled("div", {
  base: {
    width: "100%",
    display: "flex",
  },
});

const AlternativeRadioItem = styled(RadioGroupItem, {
  base: {
    flex: "1",
    alignItems: "flex-start",
    gap: "xsmall",
    "&:has(input:focus-visible)": {
      outline: "none!",
    },
  },
});

const AlternativeCheckboxRoot = styled(CheckboxRoot, {
  base: {
    flex: "1",
    alignItems: "flex-start",
    gap: "xsmall",
  },
});

const AlternativeFieldRoot = styled(FieldRoot, {
  base: {
    flex: "1",
    display: "grid",
    gridTemplateColumns: "auto 1fr auto auto",
    gridTemplateAreas: `". label . ." "drag input control delete"`,
    columnGap: "medium",
    rowGap: "3xsmall",
    alignItems: "center",
  },
});

const GridCell = styled("div", {
  base: {
    alignSelf: "center",
  },
});

interface Props {
  alternatives: AlternativeFormValues[];
  questionType: QuestionFormValues["questionType"];
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

  const alternativeIds = useMemo(
    () => alternatives.map((alt) => alt.id),
    [alternatives],
  );

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
      itemCount={alternatives.length}
      questionType={questionType}
      dragDisabled={randomOrder}
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
      <SortableContext
        items={alternativeIds}
        disabled={alternatives.length < 2 || randomOrder}
        strategy={verticalListSortingStrategy}
      >
        {questionType === "SINGLE_CHOICE" ? (
          <RadioGroupRoot
            value={alternatives.find((alt) => alt.isCorrect)?.id ?? null}
            onValueChange={(details) =>
              details.value && onCorrectChange(details.value, true)
            }
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
  itemCount: number;
  questionType: QuestionFormValues["questionType"];
  dragDisabled: boolean;
  onTextChange: (id: string, text: string) => void;
  onCorrectChange: (id: string, isCorrect: boolean) => void;
  onRemove: (id: string) => void;
}

const AlternativeRow = ({
  alt,
  index,
  itemCount,
  questionType,
  dragDisabled,
  onTextChange,
  onCorrectChange,
  onRemove,
}: AlternativeRowProps) => {
  const { t } = useTranslation();
  const name =
    alt.text || t("myNdla.quiz.form.alternativeNumber", { number: index + 1 });

  return (
    <SortableAlternativeRow
      id={alt.id}
      name={name}
      itemCount={itemCount}
      dragDisabled={dragDisabled}
    >
      {(dragHandle) => {
        const content = (
          <AlternativeFieldRoot>
            <GridCell css={{ gridArea: "drag" }}>{dragHandle}</GridCell>
            <FieldLabel css={{ gridArea: "label" }}>
              {t("myNdla.quiz.form.alternative")}
            </FieldLabel>
            <FieldInput
              css={{ gridArea: "input" }}
              value={alt.text}
              onChange={(e) => onTextChange(alt.id, e.currentTarget.value)}
              placeholder={t("myNdla.quiz.form.alternativePlaceholder")}
            />
            <GridCell css={{ gridArea: "control" }}>
              {questionType === "SINGLE_CHOICE" ? (
                <RadioGroupItemControl />
              ) : (
                <CheckboxControl>
                  <CheckboxIndicator asChild>
                    <CheckLine />
                  </CheckboxIndicator>
                </CheckboxControl>
              )}
            </GridCell>
            {itemCount > 2 && (
              <GridCell css={{ gridArea: "delete" }}>
                <IconButton
                  aria-label={t("myNdla.quiz.form.removeAlternative")}
                  title={t("myNdla.quiz.form.removeAlternative")}
                  variant="tertiary"
                  size="small"
                  onClick={() => onRemove(alt.id)}
                >
                  <DeleteBinLine />
                </IconButton>
              </GridCell>
            )}
          </AlternativeFieldRoot>
        );

        return questionType === "SINGLE_CHOICE" ? (
          <AlternativeRadioItem
            value={alt.id}
            title={t("myNdla.quiz.correctAnswer")}
          >
            {content}
            <RadioGroupItemHiddenInput />
          </AlternativeRadioItem>
        ) : (
          <AlternativeCheckboxRoot
            checked={alt.isCorrect}
            onCheckedChange={(details) =>
              onCorrectChange(alt.id, !!details.checked)
            }
            title={t("myNdla.quiz.correctAnswer")}
          >
            {content}
            <CheckboxHiddenInput />
          </AlternativeCheckboxRoot>
        );
      }}
    </SortableAlternativeRow>
  );
};

interface SortableAlternativeRowProps {
  id: string;
  name: string;
  itemCount: number;
  dragDisabled: boolean;
  children: (dragHandle: ReactNode) => ReactNode;
}

const SortableAlternativeRow = ({
  id,
  name,
  itemCount,
  dragDisabled,
  children,
}: SortableAlternativeRowProps) => {
  const { setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : undefined,
  };

  const dragHandle = (
    <DragHandle
      sortableId={id}
      name={name}
      disabled={itemCount < 2 || dragDisabled}
      type="quizalternative"
    />
  );

  return (
    <AlternativeRowWrapper ref={setNodeRef} style={style}>
      {children(dragHandle)}
    </AlternativeRowWrapper>
  );
};
