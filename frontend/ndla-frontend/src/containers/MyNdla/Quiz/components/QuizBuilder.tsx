/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { arrayMove } from "@dnd-kit/sortable";
import { AddLine } from "@ndla/icons";
import {
  Button,
  FieldErrorMessage,
  FieldInput,
  FieldLabel,
  FieldRoot,
  TabsContent,
  TabsList,
  TabsRoot,
  TabsTrigger,
} from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MyNdlaBreadcrumb } from "../../../../components/MyNdla/MyNdlaBreadcrumb";
import { MyNdlaTitle } from "../../../../components/MyNdla/MyNdlaTitle";
import { PageTitle } from "../../../../components/PageTitle";
import { useValidationTranslation } from "../../../../util/useValidationTranslation";
import { MyNdlaPageContent, MyNdlaPageSection } from "../../components/MyNdlaPageSection";
import { MyNdlaPageWrapper } from "../../components/MyNdlaPageWrapper";
import { QuizFormButtonContainer } from "../QuizFormButtonContainer";
import { type QuestionFormValues, QuestionCard } from "./QuestionCard";
import { emptyQuestion } from "./quizBuilderUtils";
import { QuizSettingsTab } from "./QuizSettingsTab";
import { QuizStepper } from "./QuizStepper";

export type QuestionCountOption = "5" | "10" | "15" | "20";

export interface QuizBuilderState {
  title: string;
  description: string;
  randomSubset: boolean;
  questionCount: QuestionCountOption;
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

const StyledOl = styled("ol", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "small",
    width: "100%",
    listStyle: "none",
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
  const [attemptedSave, setAttemptedSave] = useState(false);

  const titleError =
    attemptedSave && !state.title.trim() ? validationT({ type: "required", field: "title" }) : undefined;

  const onSaveClick = () => {
    if (!state.title.trim()) {
      setAttemptedSave(true);
      return;
    }
    onSave();
  };

  const onQuestionChange = (id: string, question: QuestionFormValues) => {
    onChange({ ...state, questions: state.questions.map((q) => (q.id === id ? question : q)) });
  };

  const onAddQuestion = () => {
    onChange({ ...state, questions: [...state.questions, emptyQuestion()] });
  };

  const onDeleteQuestion = (id: string) => {
    onChange({ ...state, questions: state.questions.filter((q) => q.id !== id) });
  };

  const onMoveQuestion = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= state.questions.length) return;
    onChange({ ...state, questions: arrayMove(state.questions, index, newIndex) });
  };

  return (
    <MyNdlaPageWrapper>
      <PageTitle title={pageTitle} useLocationForCustomPath={true} />
      <MyNdlaPageContent>
        <MyNdlaBreadcrumb breadcrumbs={[{ id: "quiz", name: breadcrumbName }]} page="quiz" />
        <MyNdlaTitle title={state.title || t("myNdla.quiz.newQuiz")} />
        <QuizStepper step="build" quizId={quizId} />
      </MyNdlaPageContent>
      <MyNdlaPageContent>
        <FieldRoot invalid={!!titleError}>
          <FieldLabel>{t("myNdla.quiz.form.title")}</FieldLabel>
          <FieldInput value={state.title} onChange={(e) => onChange({ ...state, title: e.currentTarget.value })} />
          <FieldErrorMessage>{titleError}</FieldErrorMessage>
        </FieldRoot>
        <TabsRoot
          defaultValue="questions"
          variant="line"
          translations={{ listLabel: t("myNdla.quiz.form.navigation") }}
        >
          <TabsList>
            <TabsTrigger value="questions">{t("myNdla.quiz.form.tabs.questions")}</TabsTrigger>
            <TabsTrigger value="settings">{t("myNdla.quiz.form.settings.title")}</TabsTrigger>
          </TabsList>
          <TabsContent value="questions">
            <MyNdlaPageSection>
              <StyledOl>
                {state.questions.map((question, index) => (
                  <li key={question.id}>
                    <QuestionCard
                      question={question}
                      index={index}
                      canMoveUp={index > 0}
                      canMoveDown={index < state.questions.length - 1}
                      showMoveButtons={state.questions.length > 2}
                      onChange={(q) => onQuestionChange(question.id, q)}
                      onMoveUp={() => onMoveQuestion(index, -1)}
                      onMoveDown={() => onMoveQuestion(index, 1)}
                      onDelete={() => onDeleteQuestion(question.id)}
                    />
                  </li>
                ))}
                <Button variant="secondary" onClick={onAddQuestion}>
                  <AddLine />
                  {t("myNdla.quiz.form.addQuestion")}
                </Button>
              </StyledOl>
            </MyNdlaPageSection>
          </TabsContent>
          <TabsContent value="settings">
            <QuizSettingsTab
              randomSubset={state.randomSubset}
              onRandomSubsetChange={(randomSubset) => onChange({ ...state, randomSubset })}
              questionCount={state.questionCount}
              onQuestionCountChange={(questionCount) => onChange({ ...state, questionCount })}
            />
          </TabsContent>
        </TabsRoot>
      </MyNdlaPageContent>
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
    </MyNdlaPageWrapper>
  );
};
