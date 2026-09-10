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
  DialogRoot,
  FieldErrorMessage,
  FieldInput,
  FieldLabel,
  FieldRoot,
  TabsContent,
  TabsList,
  TabsRoot,
  TabsTrigger,
  Text,
} from "@ndla/primitives";
import { HStack, styled } from "@ndla/styled-system/jsx";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MyNdlaBreadcrumb } from "../../../../components/MyNdla/MyNdlaBreadcrumb";
import { MyNdlaTitle } from "../../../../components/MyNdla/MyNdlaTitle";
import { PageTitle } from "../../../../components/PageTitle";
import type { GQLQuizFragment } from "../../../../graphqlTypes";
import { useValidationTranslation } from "../../../../util/useValidationTranslation";
import { MyNdlaPageContent } from "../../components/MyNdlaPageSection";
import { MyNdlaPageWrapper } from "../../components/MyNdlaPageWrapper";
import { type QuestionFormValues, QuestionCard } from "./QuestionCard";
import {
  emptyQuestion,
  hasCorrectAnswer,
  isQuizFormComplete,
} from "./quizBuilderUtils";
import { QuizLeaveDialog } from "./QuizLeaveDialog";
import { QuizShareDialogContent } from "./QuizShareDialogContent";
import { QuizSettingsTab } from "./QuizSettingsTab";

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
  state: QuizBuilderState;
  onChange: (state: QuizBuilderState) => void;
  onSave: () => Promise<boolean>;
  onSaveAndClose: () => Promise<boolean>;
  onShare: () => Promise<GQLQuizFragment | undefined>;
  onCancel: () => void;
  saving: boolean;
  sharing: boolean;
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

const ButtonRow = styled("div", {
  base: {
    display: "flex",
    gap: "xsmall",
    justifyContent: "flex-end",
    width: "100%",
    flexWrap: "wrap",
  },
});

const StyledButton = styled(Button, {
  base: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",

    paddingInline: "small",
    paddingBlock: "xsmall",
    alignSelf: "center",
    textStyle: "label.medium",
    fontSize: "xsmall",
    fontWeight: "bold",
  },
});

export const QuizBuilder = ({
  pageTitle,
  breadcrumbName,
  state,
  onChange,
  onSave,
  onSaveAndClose,
  onShare,
  onCancel,
  saving,
  sharing,
}: Props) => {
  const { t } = useTranslation();
  const { validationT } = useValidationTranslation();
  const [attemptedSave, setAttemptedSave] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [sharedQuiz, setSharedQuiz] = useState<GQLQuizFragment>();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const shareButtonRef = useRef<HTMLButtonElement>(null);

  const titleError =
    attemptedSave && !state.title.trim()
      ? validationT({ type: "required", field: "title" })
      : undefined;

  const hasMissingCorrectAnswer = state.questions.some(
    (question) => question.title.trim() && !hasCorrectAnswer(question),
  );

  const noQuestionsError =
    attemptedSave &&
    !hasMissingCorrectAnswer &&
    !isQuizFormComplete(state.questions)
      ? t("myNdla.quiz.form.noQuestions")
      : undefined;

  const onFormChange = (newState: QuizBuilderState) => {
    setDirty(true);
    onChange(newState);
  };

  const onSaveClick = async () => {
    if (!state.title.trim()) {
      setAttemptedSave(true);
      return;
    }
    const success = await onSave();
    if (success) {
      setDirty(false);
    }
  };

  const onSaveAndCloseClick = async () => {
    if (!state.title.trim()) {
      setAttemptedSave(true);
      return;
    }
    const success = await onSaveAndClose();
    if (success) {
      setDirty(false);
      onCancel();
    }
  };

  const onShareClick = async () => {
    if (!state.title.trim() || !isQuizFormComplete(state.questions)) {
      setAttemptedSave(true);
      return;
    }
    const quiz = await onShare();
    if (quiz) {
      setDirty(false);
      setSharedQuiz(quiz);
      setShareDialogOpen(true);
    }
  };

  const onQuestionChange = (id: string, question: QuestionFormValues) => {
    onFormChange({
      ...state,
      questions: state.questions.map((q) => (q.id === id ? question : q)),
    });
  };

  const onAddQuestion = () => {
    onFormChange({
      ...state,
      questions: [...state.questions, emptyQuestion()],
    });
  };

  const onDeleteQuestion = (id: string) => {
    onFormChange({
      ...state,
      questions: state.questions.filter((q) => q.id !== id),
    });
  };

  const onMoveQuestion = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= state.questions.length) return;
    onFormChange({
      ...state,
      questions: arrayMove(state.questions, index, newIndex),
    });
  };

  return (
    <MyNdlaPageWrapper>
      <PageTitle title={pageTitle} useLocationForCustomPath={true} />
      <MyNdlaPageContent>
        <MyNdlaBreadcrumb
          breadcrumbs={[{ id: "quiz", name: breadcrumbName }]}
          page="quiz"
        />
        <MyNdlaTitle title={state.title || t("myNdla.quiz.newQuiz")} />
      </MyNdlaPageContent>
      <MyNdlaPageContent>
        <FieldRoot invalid={!!titleError}>
          <FieldLabel>{t("myNdla.quiz.form.title")}</FieldLabel>
          <FieldInput
            value={state.title}
            onChange={(e) =>
              onFormChange({ ...state, title: e.currentTarget.value })
            }
          />
          <FieldErrorMessage>{titleError}</FieldErrorMessage>
        </FieldRoot>
        <TabsRoot
          defaultValue="questions"
          variant="line"
          translations={{ listLabel: t("myNdla.quiz.form.navigation") }}
        >
          <HStack justify="space-between" gap="xsmall">
            <TabsList>
              <TabsTrigger value="questions">
                {t("myNdla.quiz.form.tabs.questions")}
              </TabsTrigger>
              <TabsTrigger value="settings">
                {t("myNdla.quiz.form.settings.title")}
              </TabsTrigger>
            </TabsList>
            <Button
              variant="secondary"
              onClick={onSaveClick}
              loading={saving}
              disabled={sharing}
            >
              {t("myNdla.quiz.form.saveButton")}
            </Button>
          </HStack>
          <TabsContent value="questions">
            <MyNdlaPageContent>
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
                      error={
                        attemptedSave &&
                        question.title.trim() &&
                        !hasCorrectAnswer(question)
                          ? t("myNdla.quiz.form.noCorrectAnswer")
                          : undefined
                      }
                    />
                  </li>
                ))}
                <StyledButton variant="secondary" onClick={onAddQuestion}>
                  <AddLine />
                  {t("myNdla.quiz.form.addQuestion")}
                </StyledButton>
              </StyledOl>
            </MyNdlaPageContent>
          </TabsContent>
          <TabsContent value="settings">
            <QuizSettingsTab
              randomSubset={state.randomSubset}
              onRandomSubsetChange={(randomSubset) =>
                onFormChange({ ...state, randomSubset })
              }
              questionCount={state.questionCount}
              onQuestionCountChange={(questionCount) =>
                onFormChange({ ...state, questionCount })
              }
            />
          </TabsContent>
        </TabsRoot>
      </MyNdlaPageContent>
      <MyNdlaPageContent>
        {noQuestionsError ? (
          <Text textStyle="label.small" color="text.error">
            {noQuestionsError}
          </Text>
        ) : null}
        <ButtonRow>
          <Button
            variant="secondary"
            onClick={onSaveAndCloseClick}
            loading={saving}
            disabled={sharing}
          >
            {t("myNdla.quiz.saveQuiz.saveAndClose")}
          </Button>
          <Button
            variant="primary"
            onClick={onShareClick}
            loading={sharing}
            disabled={saving}
            ref={shareButtonRef}
          >
            {t("myNdla.quiz.form.shareQuiz")}
          </Button>
        </ButtonRow>
        <DialogRoot
          open={shareDialogOpen}
          onOpenChange={(details) => setShareDialogOpen(details.open)}
          finalFocusEl={() => shareButtonRef.current}
        >
          {sharedQuiz ? (
            <QuizShareDialogContent
              quiz={sharedQuiz}
              onClose={() => setShareDialogOpen(false)}
            />
          ) : null}
        </DialogRoot>
      </MyNdlaPageContent>
      <QuizLeaveDialog shouldBlock={dirty} />
    </MyNdlaPageWrapper>
  );
};
