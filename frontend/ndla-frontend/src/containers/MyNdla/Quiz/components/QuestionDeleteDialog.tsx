/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DeleteBinLine } from "@ndla/icons";
import { Button, DialogRoot, DialogTrigger } from "@ndla/primitives";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DeleteModalContent } from "../../../../components/MyNdla/DeleteModalContent";

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
      <DeleteModalContent
        title={t("myNdla.quiz.form.settings.delete")}
        description={t("myNdla.quiz.form.settings.deleteWarning")}
        removeText={t("myNdla.quiz.form.settings.delete")}
        onDelete={deleteAndClose}
      />
    </DialogRoot>
  );
};
