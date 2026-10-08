/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { FileCopyLine } from "@ndla/icons";
import {
  DialogRoot,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  Button,
  DialogFooter,
  Text,
} from "@ndla/primitives";
import { SafeLink } from "@ndla/safelink";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DialogCloseButton } from "../../../components/DialogCloseButton";
import { useToast } from "../../../components/ToastContext";
import { useCloneQuizMutation } from "../../../mutations/quiz/quizMutations";
import { routes } from "../../../routeHelpers";

interface Props {
  quizId: string;
}

export const CopyQuiz = ({ quizId }: Props) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [cloneQuiz] = useCloneQuizMutation();

  const onError = () => toast.create({ title: t("myNdla.quiz.copy.error") });

  const onCloneQuiz = async () => {
    try {
      const res = await cloneQuiz({
        variables: {
          quizId: quizId,
        },
      });
      if (!res.error) {
        setOpen(false);
        toast.create({
          title: t("myNdla.quiz.copy.success.title"),
          description: (
            <div>
              {t("myNdla.quiz.copy.success.description")}
              <SafeLink to={routes.myNdla.quiz}>{`"${t("myNdla.quiz.title")}"`}</SafeLink>
            </div>
          ),
        });
      } else {
        onError();
      }
    } catch {
      onError();
    }
  };

  return (
    <DialogRoot open={open} onOpenChange={(details) => setOpen(details.open)}>
      <DialogTrigger asChild>
        <Button variant="tertiary">{t("myNdla.quiz.take.copyQuiz")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("myNdla.quiz.copy.title")}</DialogTitle>
          <DialogCloseButton />
        </DialogHeader>
        <DialogBody>
          <Text>{t("myNdla.quiz.copy.description")}</Text>
        </DialogBody>
        <DialogFooter>
          <Button onClick={onCloneQuiz}>
            <FileCopyLine />
            {t("myNdla.quiz.copy.button")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
};
