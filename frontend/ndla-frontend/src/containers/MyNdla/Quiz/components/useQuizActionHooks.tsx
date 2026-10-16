/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ArrowRightLine, DeleteBinLine } from "@ndla/icons";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "../../../../components/ToastContext";
import type { GQLQuizSummaryFragment } from "../../../../graphqlTypes";
import { useDeleteQuizMutation, useUnsaveQuizMutation } from "../../../../mutations/quiz/quizMutations";
import { routes } from "../../../../routeHelpers";
import type { MenuItemProps } from "../../components/SettingsMenu";
import { QuizDeleteDialogContent } from "./QuizDeleteDialogContent";

export const useQuizActionHooks = (quiz: GQLQuizSummaryFragment) => {
  const toast = useToast();
  const { t } = useTranslation();
  const [deleteQuiz, { loading: deleting }] = useDeleteQuizMutation();

  const actionItems: MenuItemProps[] = useMemo(() => {
    const goToSharedQuiz: MenuItemProps = {
      type: "link",
      text: t("myNdla.quiz.menu.goToShared"),
      link: routes.quiz(quiz.id),
      value: "goToSharedQuiz",
      icon: <ArrowRightLine />,
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
          loading={deleting}
          onDelete={async () => {
            const res = await deleteQuiz({ variables: { id: quiz.id } }).catch(() => undefined);
            if (res?.data?.deleteQuiz) {
              toast.create({
                title: t("myNdla.quiz.toast.deleted", { title: quiz.title }),
              });
              close();
            } else {
              toast.create({ title: t("myNdla.quiz.toast.deletedFailed") });
            }
          }}
        />
      ),
    };

    return [...(quiz.status === "PUBLIC" ? [goToSharedQuiz] : []), deleteQuizItem];
  }, [quiz, t, toast, deleteQuiz, deleting]);

  return actionItems;
};

export const useSavedQuizActionHooks = (quiz: GQLQuizSummaryFragment) => {
  const toast = useToast();
  const { t } = useTranslation();
  const [unsaveQuiz] = useUnsaveQuizMutation();

  const actionItems: MenuItemProps[] = useMemo(
    () => [
      {
        type: "link",
        text: t("myNdla.quiz.menu.goToQuiz"),
        link: routes.quiz(quiz.id),
        value: "goToQuiz",
        icon: <ArrowRightLine />,
      },
      {
        type: "action",
        text: t("myNdla.quiz.menu.unsave"),
        value: "unsaveQuiz",
        variant: "destructive",
        icon: <DeleteBinLine />,
        onClick: async () => {
          const res = await unsaveQuiz({ variables: { quizId: quiz.id } }).catch(() => undefined);
          toast.create({
            title: res?.data?.unsaveQuiz
              ? t("myNdla.quiz.toast.unsaved", { title: quiz.title })
              : t("myNdla.quiz.toast.unsaveFailed"),
          });
        },
      },
    ],
    [quiz, t, toast, unsaveQuiz],
  );

  return actionItems;
};
