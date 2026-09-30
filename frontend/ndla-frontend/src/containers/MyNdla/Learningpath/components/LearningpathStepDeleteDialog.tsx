/**
 * Copyright (c) 2024-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Button, DialogRoot, DialogTrigger } from "@ndla/primitives";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DeleteModalContent } from "../../../../components/MyNdla/DeleteModalContent";

interface Props {
  onDelete: (close: VoidFunction) => Promise<void>;
}
export const LearningpathStepDeleteDialog = ({ onDelete }: Props) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const deleteAndClose = async () => {
    await onDelete(() => setOpen(false));
  };

  return (
    <DialogRoot open={open} onOpenChange={(details) => setOpen(details.open)}>
      <DialogTrigger asChild>
        <Button variant="danger">{t("myNdla.learningpath.form.delete")}</Button>
      </DialogTrigger>
      <DeleteModalContent
        title={t("myNdla.learningpath.form.deleteStep")}
        description={t("myNdla.learningpath.form.deleteBody")}
        removeText={t("myNdla.learningpath.form.deleteStep")}
        onDelete={deleteAndClose}
      />
    </DialogRoot>
  );
};
