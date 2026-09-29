/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useTranslation } from "react-i18next";
import type { GQLQuizFragment } from "../../../../graphqlTypes";
import { ShareLink } from "../../components/ShareLink";
import { sharedQuizLink } from "../utils";

interface Props {
  quiz: GQLQuizFragment;
}

export const QuizShareLink = ({ quiz }: Props) => {
  const { t, i18n } = useTranslation();

  return (
    <ShareLink
      url={sharedQuizLink(quiz.id, i18n.language)}
      description={t("myNdla.quiz.sharing.description.shared")}
      copyLabel={t("myNdla.quiz.sharing.description.copy")}
      buttonLabel={t("myNdla.quiz.sharing.link")}
      copiedMessage={t("myNdla.quiz.sharing.copied")}
    />
  );
};
