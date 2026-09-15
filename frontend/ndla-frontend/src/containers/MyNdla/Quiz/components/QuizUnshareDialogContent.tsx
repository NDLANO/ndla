/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  Button,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Text,
} from "@ndla/primitives";
import { useTranslation } from "react-i18next";
import { DialogCloseButton } from "../../../../components/DialogCloseButton";

interface Props {
  onUnshare: () => void;
  onClose: () => void;
  loading?: boolean;
}

export const QuizUnshareDialogContent = ({ onUnshare, onClose, loading }: Props) => {
  const { t } = useTranslation();
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{t("myNdla.quiz.unshareConfirm.title")}</DialogTitle>
        <DialogCloseButton />
      </DialogHeader>
      <DialogBody>
        <Text>{t("myNdla.quiz.unshareConfirm.content")}</Text>
      </DialogBody>
      <DialogFooter>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {t("myNdla.quiz.form.cancel")}
        </Button>
        <Button onClick={onUnshare} variant="primary" loading={loading}>
          {t("myNdla.quiz.form.unshareQuiz")}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};
