/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { skipToken, useSuspenseQuery } from "@apollo/client/react";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { DefaultErrorMessagePage } from "../../../components/DefaultErrorMessage";
import { PageRainbowSpinner } from "../../../components/PageSpinner";
import type { GQLQuizFragment } from "../../../graphqlTypes";
import { quizQuery } from "../../../mutations/quiz/quizQueries";
import { PrivateRoute } from "../../PrivateRoute/PrivateRoute";
import { MyNdlaPageContent } from "../components/MyNdlaPageSection";
import { MyNdlaPageWrapper } from "../components/MyNdlaPageWrapper";
import { QuizBuilder } from "./components/QuizBuilder";
import { quizToState } from "./components/quizBuilderUtils";
import { useQuizEditor } from "./components/useQuizEditor";

const Component = () => {
  return <PrivateRoute element={<EditQuizPage />} />;
};

export const EditQuizPage = () => (
  <Suspense
    fallback={
      <MyNdlaPageWrapper>
        <MyNdlaPageContent quiz={true}>
          <PageRainbowSpinner />
        </MyNdlaPageContent>
      </MyNdlaPageWrapper>
    }
  >
    <EditQuizPageContent />
  </Suspense>
);

const EditQuizPageContent = () => {
  const { quizId } = useParams();
  const { data } = useSuspenseQuery(quizQuery, !quizId ? skipToken : { variables: { id: quizId } });

  if (!data?.quiz) {
    return <DefaultErrorMessagePage />;
  }

  return <EditQuizForm quiz={data.quiz} key={data.quiz.id} />;
};

interface EditQuizFormProps {
  quiz: GQLQuizFragment;
}

const EditQuizForm = ({ quiz }: EditQuizFormProps) => {
  const { t } = useTranslation();
  const { state, builderProps } = useQuizEditor({
    initialState: () => quizToState(quiz),
    initialQuiz: quiz,
    saveFailedMessage: t("myNdla.quiz.toast.updatedFailed"),
  });

  return <QuizBuilder pageTitle={t("htmlTitles.quizEditPage")} breadcrumbName={state.title} {...builderProps} />;
};

export default Component;
