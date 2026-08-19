/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Button, FieldInput, FieldLabel, FieldRoot, FieldTextArea } from "@ndla/primitives";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { MyNdlaTitle } from "../../../components/MyNdla/MyNdlaTitle";
import { PageTitle } from "../../../components/PageTitle";
import { useToast } from "../../../components/ToastContext";
import { useAddQuizMutation, useAddQuizQuestionMutation } from "../../../mutations/quiz/quizMutations";
import { routes } from "../../../routeHelpers";
import { PrivateRoute } from "../../PrivateRoute/PrivateRoute";
import { MyNdlaPageContent, MyNdlaPageSection } from "../components/MyNdlaPageSection";
import { MyNdlaPageWrapper } from "../components/MyNdlaPageWrapper";
import { LocalQuestion, QuizQuestionForm } from "./components/QuizQuestionForm";

export const Component = () => {
  return <PrivateRoute element={<NewQuizPage />} />;
};

const emptyQuestion = (): LocalQuestion => ({
  id: crypto.randomUUID(),
  title: "",
  questionType: "SINGLE_CHOICE",
  alternatives: [
    { id: crypto.randomUUID(), text: "", isCorrect: false },
    { id: crypto.randomUUID(), text: "", isCorrect: false },
  ],
});

export const NewQuizPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<LocalQuestion[]>([emptyQuestion()]);
  const [saving, setSaving] = useState(false);

  const [addQuiz] = useAddQuizMutation();
  const [addQuizQuestion] = useAddQuizQuestionMutation();

  const onQuestionChange = (index: number, question: LocalQuestion) => {
    setQuestions(questions.map((q, i) => (i === index ? question : q)));
  };

  const onRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const onAddQuestion = () => setQuestions([...questions, emptyQuestion()]);

  const onSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const quizRes = await addQuiz({ variables: { title, description: description || undefined } });
      const quizId = quizRes.data?.addQuiz.id;
      if (!quizId) {
        toast.create({ title: t("myNdla.quiz.toast.createdFailed") });
        return;
      }
      for (const question of questions) {
        if (!question.title.trim()) continue;
        await addQuizQuestion({
          variables: {
            quizId,
            questionType: question.questionType,
            title: question.title,
            alternatives: question.alternatives
              .filter((alt) => alt.text.trim())
              .map((alt) => ({ text: alt.text, isCorrect: alt.isCorrect })),
          },
        });
      }
      toast.create({ title: t("myNdla.quiz.toast.created", { title }) });
      navigate(routes.myNdla.quiz);
    } catch {
      toast.create({ title: t("myNdla.quiz.toast.createdFailed") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <MyNdlaPageWrapper>
      <PageTitle title={t("htmlTitles.quizNewPage")} useLocationForCustomPath={true} />
      <MyNdlaPageContent>
        <MyNdlaTitle title={t("myNdla.quiz.newQuiz")} />
      </MyNdlaPageContent>
      <MyNdlaPageContent>
        <FieldRoot required>
          <FieldLabel>{t("myNdla.quiz.form.title")}</FieldLabel>
          <FieldInput value={title} onChange={(e) => setTitle(e.currentTarget.value)} />
        </FieldRoot>
        <FieldRoot>
          <FieldLabel>{t("myNdla.quiz.form.description")}</FieldLabel>
          <FieldTextArea value={description} onChange={(e) => setDescription(e.currentTarget.value)} />
        </FieldRoot>
      </MyNdlaPageContent>
      <MyNdlaPageSection>
        {questions.map((question, index) => (
          <QuizQuestionForm
            key={question.id}
            index={index}
            question={question}
            onChange={(q) => onQuestionChange(index, q)}
            onRemove={() => onRemoveQuestion(index)}
          />
        ))}
        <Button variant="secondary" size="small" onClick={onAddQuestion}>
          {t("myNdla.quiz.form.addQuestion")}
        </Button>
      </MyNdlaPageSection>
      <MyNdlaPageContent>
        <Button onClick={onSave} disabled={saving || !title.trim()}>
          {t("myNdla.quiz.form.save")}
        </Button>
      </MyNdlaPageContent>
    </MyNdlaPageWrapper>
  );
};
