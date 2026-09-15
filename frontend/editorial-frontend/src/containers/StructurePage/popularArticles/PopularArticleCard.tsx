/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ImageLine, LineChartLine } from "@ndla/icons";
import { CardContent, CardHeading, CardImage, CardRoot, Text } from "@ndla/primitives";
import { SafeLink } from "@ndla/safelink";
import { styled } from "@ndla/styled-system/jsx";
import { linkOverlay } from "@ndla/styled-system/patterns";
import type { MultiSearchSummaryDTO } from "@ndla/types-backend/search-api";
import type { Node } from "@ndla/types-backend/taxonomy-api";
import { useTranslation } from "react-i18next";
import { useBadges } from "../../../util/getBadges";
import { getContentTypeFromResourceTypes } from "../../../util/resourceHelpers";
import { routes } from "../../../util/routeHelpers";

const StyledCardContent = styled(CardContent, {
  base: {
    gap: "xsmall",
    paddingBlockEnd: "small",
  },
});

const TextWrapper = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "4xsmall",
    flex: "1",
    minWidth: "0",
  },
});

const StyledCardHeading = styled(CardHeading, {
  base: {
    textStyle: "label.medium",
  },
});

const StatsWrapper = styled("div", {
  base: {
    display: "flex",
    gap: "4xsmall",
    alignItems: "center",
    color: "text.subtle",
  },
});

interface Props {
  node: Node;
  contentMeta: MultiSearchSummaryDTO | undefined;
  numHits: number;
}

export const PopularArticleCard = ({ node, contentMeta, numHits }: Props) => {
  const { t, i18n } = useTranslation();

  const badges = useBadges({
    traits: contentMeta?.traits,
    resourceTypes: node.resourceTypes,
    relevanceId: node.context?.relevanceId ?? node.relevanceId,
    resourceType: node.url?.startsWith("/e/") ? "topic" : undefined,
  });

  const contentType = getContentTypeFromResourceTypes(node.resourceTypes);
  const numericId = parseInt(node.contentUri?.split(":").pop() ?? "");
  const editUrl = Number.isNaN(numericId)
    ? undefined
    : contentType === "learning-path"
      ? routes.learningpath.edit(numericId, i18n.language)
      : routes.editArticle(numericId, contentType);

  return (
    <CardRoot asChild consumeCss>
      <li>
        <CardImage
          src={contentMeta?.metaImage?.url ?? ""}
          alt=""
          height={200}
          fallbackWidth={360}
          fallbackElement={<ImageLine />}
        />
        <StyledCardContent>
          <TextWrapper>
            {!!badges.length && (
              <Text textStyle="label.small" color="text.subtle">
                {badges.join(", ")}
              </Text>
            )}
            {editUrl ? (
              <StyledCardHeading asChild css={linkOverlay.raw()}>
                <SafeLink to={editUrl} target="_blank" rel="noopener noreferrer">
                  {node.name}
                </SafeLink>
              </StyledCardHeading>
            ) : (
              <StyledCardHeading>{node.name}</StyledCardHeading>
            )}
          </TextWrapper>
          <StatsWrapper>
            <LineChartLine size="small" />
            <Text textStyle="label.small" color="text.subtle">
              {t("taxonomy.popularArticles.hits", { count: numHits })}
            </Text>
          </StatsWrapper>
        </StyledCardContent>
      </li>
    </CardRoot>
  );
};
