/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useTranslation } from "react-i18next";
import type { GQLMyNdlaLearningpathFragment } from "../../../../graphqlTypes";
import { ShareLink } from "../../components/ShareLink";
import { sharedLearningpathLink } from "../utils";

interface Props {
  learningpath: GQLMyNdlaLearningpathFragment;
}

export const LearningpathShareLink = ({ learningpath }: Props) => {
  const { t, i18n } = useTranslation();

  return (
    <ShareLink
      url={sharedLearningpathLink(learningpath.id, i18n.language)}
      description={t("myNdla.learningpath.sharing.description.shared")}
      copyLabel={t("myNdla.learningpath.sharing.description.copy")}
      buttonLabel={t("myNdla.learningpath.sharing.link")}
      copiedMessage={t("myNdla.learningpath.sharing.copied")}
    />
  );
};
