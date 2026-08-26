/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { FileCopyLine } from "@ndla/icons";
import { Button, Text } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import { useTranslation } from "react-i18next";
import { useToast } from "../../../../components/ToastContext";
import type { GQLQuizFragment } from "../../../../graphqlTypes";
import { copyQuizSharingLink, sharedQuizLink } from "../utils";

const GapWrapper = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "xsmall",
  },
});

const CopyLinkButton = styled(Button, {
  base: {
    justifyContent: "space-between",
    overflowWrap: "anywhere",
  },
});

interface Props {
  quiz: GQLQuizFragment;
}

export const QuizShareLink = ({ quiz }: Props) => {
  const { t, i18n } = useTranslation();
  const toast = useToast();

  return (
    <>
      <Text>{t("myNdla.quiz.sharing.description.shared")}</Text>
      <GapWrapper>
        <Text textStyle="label.medium" fontWeight="bold" asChild consumeCss>
          <span>{t("myNdla.quiz.sharing.description.copy")}</span>
        </Text>
        <CopyLinkButton
          aria-label={t("myNdla.quiz.sharing.link")}
          title={t("myNdla.quiz.sharing.link")}
          variant="secondary"
          onClick={() => {
            copyQuizSharingLink(quiz.id, i18n.language);
            toast.create({
              title: t("myNdla.quiz.sharing.copied"),
            });
          }}
        >
          {sharedQuizLink(quiz.id, i18n.language)}
          <FileCopyLine />
        </CopyLinkButton>
      </GapWrapper>
    </>
  );
};
