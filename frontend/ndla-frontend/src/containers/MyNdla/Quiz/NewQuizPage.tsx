/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useTranslation } from "react-i18next";
import { PrivateRoute } from "../../PrivateRoute/PrivateRoute";
import { QuizBuilder } from "./components/QuizBuilder";
import { emptyQuizState } from "./components/quizBuilderUtils";
import { useQuizEditor } from "./components/useQuizEditor";

export const Component = () => {
  return <PrivateRoute element={<NewQuizPage />} />;
};

export const NewQuizPage = () => {
  const { t } = useTranslation();
  const { builderProps } = useQuizEditor({
    initialState: emptyQuizState,
    saveFailedMessage: t("myNdla.quiz.toast.createdFailed"),
  });

  return (
    <QuizBuilder pageTitle={t("htmlTitles.quizNewPage")} breadcrumbName={t("myNdla.quiz.newQuiz")} {...builderProps} />
  );
};
