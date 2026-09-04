/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DeleteBinLine, PencilLine } from "@ndla/icons";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "../../../../components/ToastContext";
import type { GQLQuizFragment } from "../../../../graphqlTypes";
import { useDeleteQuizMutation } from "../../../../mutations/quiz/quizMutations";
import { routes } from "../../../../routeHelpers";
import type { MenuItemProps } from "../../components/SettingsMenu";
import { QuizDeleteDialogContent } from "./QuizDeleteDialogContent";

export const useQuizActionHooks = (quiz: GQLQuizFragment) => {
  const toast = useToast();
  const { t } = useTranslation();
  const [deleteQuiz] = useDeleteQuizMutation();

  const actionItems: MenuItemProps[] = useMemo(() => {
    const editQuiz: MenuItemProps = {
      type: "link",
      text: t("myNdla.quiz.menu.edit"),
      link: routes.myNdla.quizEdit(quiz.id),
      value: "editQuiz",
      icon: <PencilLine />,
    };

    const deleteQuizItem: MenuItemProps = {
      type: "dialog",
      text: t("myNdla.quiz.menu.delete"),
      value: "deleteQuiz",
      variant: "destructive",
      icon: <DeleteBinLine />,
      modalContent: (close) => (
        <QuizDeleteDialogContent
          quiz={quiz}
          onClose={close}
          onDelete={async () => {
            const res = await deleteQuiz({ variables: { id: quiz.id } });
            if (res.data?.deleteQuiz) {
              toast.create({ title: t("myNdla.quiz.toast.deleted", { title: quiz.title }) });
              close();
            } else {
              toast.create({ title: t("myNdla.quiz.toast.deletedFailed") });
            }
          }}
        />
      ),
    };

    return [editQuiz, deleteQuizItem];
  }, [quiz, t, toast, deleteQuiz]);

  return actionItems;
};
