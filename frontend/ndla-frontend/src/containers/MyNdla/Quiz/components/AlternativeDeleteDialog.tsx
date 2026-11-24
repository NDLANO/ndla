/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DeleteBinLine } from "@ndla/icons";
import { DialogRoot, DialogTrigger, IconButton } from "@ndla/primitives";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DeleteModalContent } from "../../../../components/MyNdla/DeleteModalContent";

interface Props {
  onDelete: () => void;
}

export const AlternativeDeleteDialog = ({ onDelete }: Props) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const deleteAndClose = () => {
    onDelete();
    setOpen(false);
  };

  return (
    <DialogRoot open={open} onOpenChange={(details) => setOpen(details.open)}>
      <DialogTrigger asChild>
        <IconButton
          aria-label={t("myNdla.quiz.form.removeAlternative")}
          title={t("myNdla.quiz.form.removeAlternative")}
          variant="tertiary"
          size="small"
        >
          <DeleteBinLine />
        </IconButton>
      </DialogTrigger>
      <DeleteModalContent
        title={t("myNdla.quiz.form.removeAlternativeTitle")}
        description={t("myNdla.quiz.form.removeAlternativeWarning")}
        removeText={t("myNdla.quiz.form.removeAlternative")}
        onDelete={deleteAndClose}
      />
    </DialogRoot>
  );
};
