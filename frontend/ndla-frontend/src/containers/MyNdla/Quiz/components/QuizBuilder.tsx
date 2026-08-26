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
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { AddLine, PencilLine } from "@ndla/icons";
import { Button, FieldErrorMessage, FieldInput, FieldRoot } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MyNdlaBreadcrumb } from "../../../../components/MyNdla/MyNdlaBreadcrumb";
import { MyNdlaTitle } from "../../../../components/MyNdla/MyNdlaTitle";
import { PageTitle } from "../../../../components/PageTitle";
import { useValidationTranslation } from "../../../../util/useValidationTranslation";
import { MyNdlaPageContent, MyNdlaPageSection } from "../../components/MyNdlaPageSection";
import { MyNdlaPageWrapper } from "../../components/MyNdlaPageWrapper";
import { makeDndTranslations } from "../../dndUtil";
import { QuizFormButtonContainer } from "../QuizFormButtonContainer";
import { DraggableQuestionListItem } from "./DraggableQuestionListItem";
import type { QuestionFormValues } from "./QuestionCard";
import { emptyQuestion } from "./quizBuilderUtils";
import { QuizSettingsPanel } from "./QuizSettingsPanel";
import { QuizStepper } from "./QuizStepper";

export interface QuizBuilderState {
  title: string;
  description: string;
  randomOrder: boolean;
  questions: QuestionFormValues[];
}

interface Props {
  pageTitle: string;
  breadcrumbName: string;
  saveLabel: string;
  quizId?: string;
  state: QuizBuilderState;
  onChange: (state: QuizBuilderState) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}

const PageGrid = styled("div", {
  base: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "medium",
    alignItems: "start",
    tabletWide: {
      gridTemplateColumns: "1fr 300px",
    },
  },
});

const ContentColumn = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "xxlarge",
    minWidth: "0",
  },
});

const StyledOl = styled("ol", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "small",
    width: "100%",
    listStyle: "none",
  },
});

const TitleRow = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "xsmall",
  },
});

const StyledButton = styled(Button, {
  base: {
    backgroundColor: "background.default",
    border: "1px solid",
    borderColor: "stroke.primary",
  },
});

export const QuizBuilder = ({
  pageTitle,
  breadcrumbName,
  saveLabel,
  quizId,
  state,
  onChange,
  onSave,
  onCancel,
  saving,
}: Props) => {
  const { t } = useTranslation();
  const { validationT } = useValidationTranslation();
  const [activeQuestionId, setActiveQuestionId] = useState<string | undefined>(state.questions[0]?.id);
  const [editingTitle, setEditingTitle] = useState(false);
  const [attemptedSave, setAttemptedSave] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const titleError = attemptedSave && !state.title.trim() ? validationT({ type: "required", field: "title" }) : undefined;

  useEffect(() => {
    if (editingTitle) titleInputRef.current?.focus();
  }, [editingTitle]);

  const onSaveClick = () => {
    if (!state.title.trim()) {
      setAttemptedSave(true);
      setEditingTitle(true);
      return;
    }
    onSave();
  };

  const activeQuestion = state.questions.find((q) => q.id === activeQuestionId);

  const onQuestionChange = (id: string, question: QuestionFormValues) => {
    onChange({ ...state, questions: state.questions.map((q) => (q.id === id ? question : q)) });
  };

  const onAddQuestion = () => {
    const question = emptyQuestion();
    onChange({ ...state, questions: [...state.questions, question] });
    setActiveQuestionId(question.id);
  };

  const onDuplicateQuestion = () => {
    if (!activeQuestion) return;
    const index = state.questions.findIndex((q) => q.id === activeQuestion.id);
    const duplicate: QuestionFormValues = {
      ...activeQuestion,
      id: crypto.randomUUID(),
      serverId: undefined,
      alternatives: activeQuestion.alternatives.map((alt) => ({ ...alt, id: crypto.randomUUID() })),
    };
    const questions = [...state.questions];
    questions.splice(index + 1, 0, duplicate);
    onChange({ ...state, questions });
    setActiveQuestionId(duplicate.id);
  };

  const onDeleteQuestion = () => {
    if (!activeQuestion) return;
    const remaining = state.questions.filter((q) => q.id !== activeQuestion.id);
    onChange({ ...state, questions: remaining });
    setActiveQuestionId(remaining[0]?.id);
  };

  const onQuestionTypeChange = (questionType: "SINGLE_CHOICE" | "MULTI_CHOICE") => {
    if (!activeQuestion) return;
    onQuestionChange(activeQuestion.id, {
      ...activeQuestion,
      questionType,
      alternatives: activeQuestion.alternatives.map((alt) => ({ ...alt, isCorrect: false })),
    });
  };

  const onRequiredChange = (required: boolean) => {
    if (!activeQuestion) return;
    onQuestionChange(activeQuestion.id, { ...activeQuestion, required });
  };

  const questionIds = useMemo(() => state.questions.map((question) => question.id), [state.questions]);

  const announcements = useMemo(
    () => makeDndTranslations("quizquestion", t, state.questions.length),
    [state.questions.length, t],
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = questionIds.indexOf(active.id as string);
    const newIndex = questionIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    onChange({ ...state, questions: arrayMove(state.questions, oldIndex, newIndex) });
  };

  return (
    <MyNdlaPageWrapper>
      <PageTitle title={pageTitle} useLocationForCustomPath={true} />
      <PageGrid>
        <ContentColumn>
          <MyNdlaPageContent>
            <MyNdlaBreadcrumb breadcrumbs={[{ id: "quiz", name: breadcrumbName }]} page="quiz" />
            <TitleRow>
              {editingTitle ? (
                <FieldRoot invalid={!!titleError}>
                  <FieldInput
                    ref={titleInputRef}
                    value={state.title}
                    onChange={(e) => onChange({ ...state, title: e.currentTarget.value })}
                    onBlur={() => setEditingTitle(false)}
                  />
                  <FieldErrorMessage>{titleError}</FieldErrorMessage>
                </FieldRoot>
              ) : (
                <>
                  <MyNdlaTitle title={state.title || t("myNdla.quiz.newQuiz")} />
                  <StyledButton variant="tertiary" size="small" onClick={() => setEditingTitle(true)}>
                    <PencilLine />
                    {t("myNdla.quiz.form.renameQuiz")}
                  </StyledButton>
                </>
              )}
            </TitleRow>
            <QuizStepper step="build" quizId={quizId} />
          </MyNdlaPageContent>
          <MyNdlaPageSection>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
              accessibility={{ announcements }}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            >
              <SortableContext
                items={questionIds}
                disabled={state.questions.length < 2}
                strategy={verticalListSortingStrategy}
              >
                <StyledOl>
                  {state.questions.map((question, index) => (
                    <DraggableQuestionListItem
                      key={question.id}
                      question={question}
                      index={index}
                      itemCount={state.questions.length}
                      isActive={question.id === activeQuestionId}
                      onFocus={() => setActiveQuestionId(question.id)}
                      onChange={(q) => onQuestionChange(question.id, q)}
                    />
                  ))}
                  <Button variant="secondary" onClick={onAddQuestion}>
                    <AddLine />
                    {t("myNdla.quiz.form.addQuestion")}
                  </Button>
                </StyledOl>
              </SortableContext>
            </DndContext>
          </MyNdlaPageSection>
          <MyNdlaPageContent>
            <QuizFormButtonContainer>
              <Button variant="tertiary" onClick={onCancel} disabled={saving}>
                {t("myNdla.quiz.form.cancel")}
              </Button>
              <Button variant="secondary" onClick={onSaveClick} disabled={saving}>
                {saveLabel}
              </Button>
            </QuizFormButtonContainer>
          </MyNdlaPageContent>
        </ContentColumn>
        <QuizSettingsPanel
          activeQuestion={activeQuestion}
          randomOrder={state.randomOrder}
          onRandomOrderChange={(randomOrder) => onChange({ ...state, randomOrder })}
          onQuestionTypeChange={onQuestionTypeChange}
          onRequiredChange={onRequiredChange}
          onDuplicateQuestion={onDuplicateQuestion}
          onDeleteQuestion={onDeleteQuestion}
        />
      </PageGrid>
    </MyNdlaPageWrapper>
  );
};
