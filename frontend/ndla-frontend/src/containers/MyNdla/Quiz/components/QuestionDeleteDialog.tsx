/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DeleteBinLine } from "@ndla/icons";
import {
  Button,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@ndla/primitives";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DialogCloseButton } from "../../../../components/DialogCloseButton";

interface Props {
  onDelete: () => void;
}

export const QuestionDeleteDialog = ({ onDelete }: Props) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const deleteAndClose = () => {
    onDelete();
    setOpen(false);
  };

  return (
    <DialogRoot open={open} onOpenChange={(details) => setOpen(details.open)}>
      <DialogTrigger asChild>
        <Button variant="tertiary" size="small">
          <DeleteBinLine />
          {t("myNdla.quiz.form.settings.delete")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("myNdla.quiz.form.settings.delete")}</DialogTitle>
          <DialogCloseButton />
        </DialogHeader>
        <DialogBody>{t("myNdla.quiz.form.settings.deleteWarning")}</DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            {t("myNdla.quiz.form.cancel")}
          </Button>
          <Button variant="danger" onClick={deleteAndClose}>
            {t("myNdla.quiz.form.settings.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
};
