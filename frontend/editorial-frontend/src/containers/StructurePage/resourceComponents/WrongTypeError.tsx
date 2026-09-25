/**
 * Copyright (c) 2023-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ErrorWarningFill } from "@ndla/icons";
import { styled } from "@ndla/styled-system/jsx";
import type { LearningResourceType } from "@ndla/types-backend/search-api";
import type { NodeChild } from "@ndla/types-backend/taxonomy-api";
import { useTranslation } from "react-i18next";
import { getContentUriInfo } from "../../../util/taxonomyHelpers";
import type { ArticleTypeKey } from "../../../util/translationKeys";

const StyledErrorWarningFill = styled(ErrorWarningFill, { base: { fill: "icon.danger" } });

const isArticleType = (value: LearningResourceType | undefined): value is ArticleTypeKey =>
  value === "standard" || value === "topic-article" || value === "frontpage-article";

const getArticleTypeFromId = (id?: string) => {
  if (id?.startsWith("urn:topic:")) return "topic-article";
  else if (id?.startsWith("urn:resource:")) return "standard";
  else if (id?.startsWith("urn:frontpage:")) return "frontpage-article";
  return undefined;
};

interface Props {
  resource: NodeChild;
  articleType: LearningResourceType | undefined;
}

const WrongTypeError = ({ resource, articleType }: Props) => {
  const { t } = useTranslation();
  const isArticle = resource.contentUri?.startsWith("urn:article");
  if (!isArticle) return null;

  const expectedArticleType = getArticleTypeFromId(resource.id);
  if (expectedArticleType === articleType) return null;

  const errorText: string = (() => {
    if (!articleType) return t("taxonomy.info.missingArticleType", { id: getContentUriInfo(resource.contentUri)?.id });
    if (!expectedArticleType) return t("taxonomy.info.noExpectedArticleType");
    return t("taxonomy.info.wrongArticleType", {
      placedAs: t(`articleType.${expectedArticleType}`),
      isType: isArticleType(articleType) ? t(`articleType.${articleType}`) : articleType,
    });
  })();

  return <StyledErrorWarningFill title={errorText} aria-label={errorText} />;
};

export default WrongTypeError;
