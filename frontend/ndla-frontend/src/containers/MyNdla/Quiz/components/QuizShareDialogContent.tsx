/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Button, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@ndla/primitives";
import { SafeLinkButton } from "@ndla/safelink";
import { styled } from "@ndla/styled-system/jsx";
import { useTranslation } from "react-i18next";
import { DialogCloseButton } from "../../../../components/DialogCloseButton";
import type { GQLQuizFragment } from "../../../../graphqlTypes";
import { routes } from "../../../../routeHelpers";
import { QuizItem } from "./QuizItem";
import { QuizShareLink } from "./QuizShareLink";

const StyledDialogBody = styled(DialogBody, {
  base: {
    gap: "medium",
  },
});

const StyledDialogFooter = styled(DialogFooter, {
  base: {
    justifyContent: "space-between",
    mobileWideDown: {
      flexDirection: "column",
      alignItems: "initial",
    },
  },
});

interface Props {
  onClose: () => void;
  quiz: GQLQuizFragment;
}

export const QuizShareDialogContent = ({ quiz, onClose }: Props) => {
  const { t } = useTranslation();

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{t("myNdla.quiz.sharing.title")}</DialogTitle>
        <DialogCloseButton />
      </DialogHeader>
      <StyledDialogBody>
        <QuizItem quiz={quiz} />
        <QuizShareLink quiz={quiz} />
      </StyledDialogBody>
      <StyledDialogFooter>
        <SafeLinkButton variant="tertiary" to={routes.myNdla.quizView(quiz.id)}>
          {t("myNdla.quiz.sharing.button.preview")}
        </SafeLinkButton>
        <Button variant="primary" onClick={onClose}>
          {t("myNdla.quiz.sharing.button.done")}
        </Button>
      </StyledDialogFooter>
    </DialogContent>
  );
};
