/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Button, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle, Text } from "@ndla/primitives";
import { useTranslation } from "react-i18next";
import { DialogCloseButton } from "../../../../components/DialogCloseButton";
import type { GQLQuizFragment } from "../../../../graphqlTypes";
import { QuizItem } from "./QuizItem";

interface Props {
  onDelete: () => void;
  onClose: () => void;
  quiz: GQLQuizFragment;
}

export const QuizDeleteDialogContent = ({ onDelete, onClose, quiz }: Props) => {
  const { t } = useTranslation();
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{t("myNdla.quiz.delete")}</DialogTitle>
        <DialogCloseButton />
      </DialogHeader>
      <DialogBody>
        <QuizItem quiz={quiz} />
        <Text>{t("myNdla.quiz.deleteWarning")}</Text>
      </DialogBody>
      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          {t("myNdla.quiz.form.cancel")}
        </Button>
        <Button onClick={onDelete} variant="danger">
          {t("myNdla.quiz.delete")}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};
