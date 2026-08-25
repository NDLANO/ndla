/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { styled } from "@ndla/styled-system/jsx";
import { useTranslation } from "react-i18next";
import { DragHandle } from "../../components/DragHandle";
import { DraggableListItem } from "../../components/DraggableListItem";
import { type QuestionFormValues, QuestionCard } from "./QuestionCard";

const DragWrapper = styled("div", {
  base: {
    minWidth: "0",
    width: "100%",
  },
});

interface Props {
  question: QuestionFormValues;
  index: number;
  isActive: boolean;
  itemCount: number;
  onFocus: () => void;
  onChange: (question: QuestionFormValues) => void;
}

export const DraggableQuestionListItem = ({ question, index, isActive, itemCount, onFocus, onChange }: Props) => {
  const { t } = useTranslation();

  const name = question.title || t("myNdla.quiz.form.questionNumber", { number: index + 1 });
  const { setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
    data: { index: index + 1 },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <DraggableListItem ref={setNodeRef} style={style} isDragging={isDragging} css={{ display: "block" }}>
      <DragHandle
        sortableId={question.id}
        name={name}
        disabled={itemCount < 2}
        type="quizquestion"
        css={{ position: "absolute", left: "-47px", top: "4xsmall", zIndex: "docked" }}
      />
      <DragWrapper>
        <QuestionCard question={question} isActive={isActive} onFocus={onFocus} onChange={onChange} />
      </DragWrapper>
    </DraggableListItem>
  );
};
