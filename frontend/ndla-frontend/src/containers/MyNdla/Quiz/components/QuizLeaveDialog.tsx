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
  DialogRoot,
  DialogTitle,
  Text,
} from "@ndla/primitives";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useBlocker } from "react-router";
import { DialogCloseButton } from "../../../../components/DialogCloseButton";

interface Props {
  shouldBlock: boolean;
}

export const QuizLeaveDialog = ({ shouldBlock }: Props) => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      shouldBlock && currentLocation.pathname !== nextLocation.pathname,
  );

  const onContinue = () => {
    blocker.proceed?.();
  };

  const onCancel = () => {
    blocker.reset?.();
  };

  useEffect(() => {
    setOpen(blocker.state === "blocked");
  }, [blocker]);

  return (
    <DialogRoot
      open={open}
      onOpenChange={(details) => setOpen(details.open)}
      closeOnEscape
      closeOnInteractOutside
      onExitComplete={onCancel}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("myNdla.quiz.leaveConfirm.title")}</DialogTitle>
          <DialogCloseButton />
        </DialogHeader>
        <DialogBody>
          <Text textStyle="body.large">
            {t("myNdla.quiz.leaveConfirm.content")}
          </Text>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={onCancel}>
            {t("myNdla.quiz.leaveConfirm.cancel")}
          </Button>
          <Button variant="primary" onClick={onContinue}>
            {t("myNdla.quiz.leaveConfirm.continue")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
};
