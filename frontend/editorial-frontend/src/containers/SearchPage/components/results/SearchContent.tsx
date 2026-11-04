/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ArrowRightLine, ArrowRightShortLine, InformationFill } from "@ndla/icons";
import { tDynamic } from "@ndla/locales";
import { ListItemContent, ListItemHeading, ListItemRoot, Text } from "@ndla/primitives";
import { SafeLink, SafeLinkButton } from "@ndla/safelink";
import { styled } from "@ndla/styled-system/jsx";
import type { MultiSearchSummaryDTO } from "@ndla/types-backend/search-api";
import { Fragment, useMemo } from "react";
import { useTranslation } from "react-i18next";
import HeaderFavoriteStatus from "../../../../components/HeaderWithLanguage/HeaderFavoriteStatus";
import config from "../../../../config";
import { DRAFT_HTML_SCOPE } from "../../../../constants";
import formatDate from "../../../../util/formatDate";
import { useBadges } from "../../../../util/getBadges";
import { routes, toEditArticle, toEditConcept, toEditGloss } from "../../../../util/routeHelpers";
import { useSession } from "../../../Session/SessionProvider";
import SearchHighlight from "./SearchHighlight";

interface Props {
  content: MultiSearchSummaryDTO;
  responsibleName?: string;
}

const StyledListItemRoot = styled(ListItemRoot, {
  base: {
    paddingInline: "xsmall",
  },
});

const StyledListItemContent = styled(ListItemContent, {
  base: {
    alignItems: "stretch",
    gap: "small",
    tabletDown: {
      flexWrap: "wrap",
    },
  },
});

const MainColumn = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "4xsmall",
    minWidth: "0",
  },
});

const SideColumn = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "xsmall",
    flexShrink: "0",
    tabletDown: {
      alignItems: "flex-start",
    },
  },
});

const StyledListItemHeading = styled(ListItemHeading, {
  base: {
    textDecoration: "none",
    _hover: {
      textDecoration: "underline",
    },
  },
});

const Description = styled(Text, {
  base: {
    lineClamp: "2",
  },
});

const Breadcrumb = styled("div", {
  base: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "4xsmall",
    color: "text.subtle",
    "& svg": {
      fill: "icon.subtle",
    },
  },
});

const MetaList = styled("dl", {
  base: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    rowGap: "4xsmall",
    marginBlockStart: "4xsmall",
  },
});

const MetaItem = styled("div", {
  base: {
    display: "flex",
    gap: "5xsmall",
    whiteSpace: "nowrap",
    "&:not(:first-child)": {
      borderInlineStartWidth: "1px",
      borderInlineStartStyle: "solid",
      borderColor: "icon.subtle",
      marginInlineStart: "xxsmall",
      paddingInlineStart: "xxsmall",
    },
  },
});

const IconRow = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "xsmall",
    color: "icon.subtle",
  },
});

const LinkStack = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "3xsmall",
    tabletDown: {
      alignItems: "flex-start",
    },
  },
});

const StyledSafeLinkButton = styled(SafeLinkButton, {
  base: {
    color: "text.default",
    textStyle: "label.small",
    "& svg": {
      width: "small",
      height: "small",
    },
  },
});

const conceptTypes = ["concept", "gloss"];

const resourceToLink = (content: MultiSearchSummaryDTO, locale: string) => {
  const foundSupportedLanguage = content.supportedLanguages?.find((l) => l === locale);
  const languageOrDefault = foundSupportedLanguage ?? content.supportedLanguages?.[0] ?? "nb";

  if (content.learningResourceType === "concept") {
    return toEditConcept(content.id, languageOrDefault);
  } else if (content.learningResourceType === "gloss") {
    return toEditGloss(content.id, languageOrDefault);
  } else if (content.resultType === "learningpath") {
    return routes.learningpath.edit(Number(content.id), languageOrDefault);
  } else return toEditArticle(content.id, content.learningResourceType ?? "standard", languageOrDefault);
};

const SubjectBreadcrumb = ({ breadcrumbs }: { breadcrumbs: string[] }) => {
  if (!breadcrumbs.length) return null;
  return (
    <Breadcrumb>
      {breadcrumbs.map((crumb, index) => (
        <Fragment key={`${crumb}-${index}`}>
          {index > 0 && <ArrowRightShortLine size="small" aria-hidden />}
          <Text textStyle="label.xsmall" asChild consumeCss>
            <span>{crumb}</span>
          </Text>
        </Fragment>
      ))}
    </Breadcrumb>
  );
};

const Meta = ({ label, value }: { label: string; value: string }) => (
  <MetaItem>
    <Text textStyle="label.xsmall" fontWeight="bold" asChild consumeCss>
      <dt>{label}:</dt>
    </Text>
    <Text textStyle="label.xsmall" color="text.subtle" asChild consumeCss>
      <dd>{value}</dd>
    </Text>
  </MetaItem>
);

const SearchContent = ({ content, responsibleName }: Props) => {
  const { t, i18n } = useTranslation();
  const { userPermissions } = useSession();

  const primaryContext = useMemo(
    () => content.contexts.find((context) => context.isPrimary) ?? content.contexts[0],
    [content.contexts],
  );

  const badges = useBadges({
    resourceTypes: primaryContext?.resourceTypes,
    traits: content.traits,
    relevanceId: primaryContext?.relevanceId,
    resourceType: content.learningResourceType !== "standard" ? content.learningResourceType : undefined,
  });

  const status = content.status?.current.toLowerCase();
  const statusLabel =
    content.learningResourceType === "learningpath"
      ? tDynamic(t, `form.status.learningpath_statuses.${status}`)
      : tDynamic(t, `form.status.${status}`);

  const metaDescription = content.metaDescription.metaDescription ?? "";
  const breadcrumbs = useMemo(() => {
    if (!primaryContext) return [];
    const contentType = primaryContext.resourceTypes[0]?.name;
    return contentType ? [...primaryContext.breadcrumbs, contentType] : primaryContext.breadcrumbs;
  }, [primaryContext]);

  const isPublished = content.status?.current === "PUBLISHED" || !!content.status?.other.includes("PUBLISHED");
  const showMarkupLink =
    !conceptTypes.includes(content.learningResourceType) &&
    !!content.id &&
    content.resultType === "draft" &&
    !!userPermissions?.includes(DRAFT_HTML_SCOPE);

  return (
    <StyledListItemRoot data-testid="content-search-result">
      <StyledListItemContent>
        <MainColumn>
          <StyledListItemHeading textStyle="label.large" asChild consumeCss>
            <SafeLink to={resourceToLink(content, i18n.language)}>{content.title.title}</SafeLink>
          </StyledListItemHeading>
          <SearchHighlight content={content} locale={i18n.language} />
          {!!metaDescription.length && (
            <Description textStyle="label.xsmall" color="text.subtle">
              {metaDescription}
            </Description>
          )}
          <SubjectBreadcrumb breadcrumbs={breadcrumbs} />
          <MetaList>
            {!!badges.length && <Meta label={t("searchPage.resultMeta.contentType")} value={badges.join(", ")} />}
            <Meta label={t("form.responsible.label")} value={responsibleName || t("form.responsible.noResponsible")} />
            <Meta label={t("form.workflow.statusLabel")} value={statusLabel || t("form.status.new")} />
            <Meta
              label={t("searchPage.resultMeta.published")}
              value={content.published ? formatDate(content.published) : t("searchPage.resultMeta.notPublished")}
            />
          </MetaList>
        </MainColumn>
        <SideColumn>
          <IconRow>
            {content.contexts.length > 1 && (
              <InformationFill
                size="medium"
                title={t("searchForm.multiTaxonomy", { count: content.contexts.length })}
              />
            )}
            {content.learningResourceType !== "frontpage-article" && (
              <HeaderFavoriteStatus
                id={content.id}
                type={content.learningResourceType}
                favoriteCount={content.favorited}
              />
            )}
          </IconRow>
          <LinkStack>
            {!!showMarkupLink && (
              <StyledSafeLinkButton
                variant="link"
                size="small"
                to={routes.editMarkup(
                  content.id,
                  content.supportedLanguages.includes(i18n.language)
                    ? i18n.language
                    : (content.supportedLanguages[0] ?? ""),
                )}
              >
                {t("editMarkup.title")}
                <ArrowRightLine />
              </StyledSafeLinkButton>
            )}
            {!!isPublished && (
              <StyledSafeLinkButton
                variant="link"
                size="small"
                target="_blank"
                to={`${config.ndlaFrontendDomain}/${conceptTypes.includes(content.learningResourceType) ? "concept" : "article"}/${content.id}`}
              >
                {t("searchPage.resultMeta.publishedVersion")}
                <ArrowRightLine />
              </StyledSafeLinkButton>
            )}
          </LinkStack>
        </SideColumn>
      </StyledListItemContent>
    </StyledListItemRoot>
  );
};

export default SearchContent;
