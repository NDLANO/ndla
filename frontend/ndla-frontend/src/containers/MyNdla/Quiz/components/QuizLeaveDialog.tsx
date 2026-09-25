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
import { styled } from "@ndla/styled-system/jsx";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useBlocker } from "react-router";
import { DialogCloseButton } from "../../../../components/DialogCloseButton";

const StyledDialogFooter = styled(DialogFooter, {
  base: { justifyContent: "space-between", mobileWideDown: { flexDirection: "column", alignItems: "initial" } },
});

interface Props {
  shouldBlock: boolean;
}

export const QuizLeaveDialog = ({ shouldBlock }: Props) => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => shouldBlock && currentLocation.pathname !== nextLocation.pathname,
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
          <Text textStyle="body.large">{t("myNdla.quiz.leaveConfirm.content")}</Text>
        </DialogBody>
        <StyledDialogFooter>
          <Button variant="link" onClick={onCancel}>
            {t("myNdla.quiz.leaveConfirm.cancel")}
          </Button>
          <Button variant="primary" onClick={onContinue}>
            {t("myNdla.quiz.leaveConfirm.continue")}
          </Button>
        </StyledDialogFooter>
      </DialogContent>
    </DialogRoot>
  );
};
