/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { gql, type TypedDocumentNode } from "@apollo/client";
import { useSuspenseQuery } from "@apollo/client/react";
import { transform } from "@ndla/article-converter";
import { MessageBox, Spinner, Text } from "@ndla/primitives";
import { SafeLink } from "@ndla/safelink";
import { styled } from "@ndla/styled-system/jsx";
import { ArticleContent, ArticleTitle, ArticleWrapper } from "@ndla/ui";
import { Suspense, useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Article } from "../../../components/Article/Article";
import { RestrictedBlock } from "../../../components/RestrictedBlock";
import { useRestrictedMode } from "../../../components/RestrictedModeContext";
import config from "../../../config";
import type {
  GQLFolderPrintArticleQuery,
  GQLFolderPrintArticleQueryVariables,
  GQLMyNdlaResourceFragment,
} from "../../../graphqlTypes";
import { getArticleScripts } from "../../../util/getArticleScripts";
import { transformArticle } from "../../../util/transformArticle";
import {
  metaToProperties,
  ResourceEmbedQuery,
  type StandaloneEmbed,
} from "../../ResourceEmbed/components/ResourceEmbed";

const articleResourceTypes = ["article", "topic", "multidisciplinary"];
const embedResourceTypes: StandaloneEmbed[] = ["image", "audio", "video", "concept"];

export const isPrintableResource = (resource: GQLMyNdlaResourceFragment) =>
  articleResourceTypes.includes(resource.resourceType) ||
  embedResourceTypes.includes(resource.resourceType as StandaloneEmbed);

const PrintSection = styled("section", {
  base: {
    _print: {
      breakBefore: "page",
    },
  },
});

const folderPrintArticleQuery: TypedDocumentNode<GQLFolderPrintArticleQuery, GQLFolderPrintArticleQueryVariables> = gql`
  query folderPrintArticle($articleId: String!, $transformArgs: TransformedArticleContentInput) {
    article(id: $articleId) {
      requiredLibraries {
        url
        mediaType
      }
      ...Article_Article
    }
  }
  ${Article.fragments.article}
`;

interface Props {
  resource: GQLMyNdlaResourceFragment;
}

type TypesetElement = (element: HTMLElement) => void;

export const printResourceId = (resource: GQLMyNdlaResourceFragment) => `print-resource-${resource.id}`;

// MathJax does not support overlapping typeset calls, so the articles are typeset one at a time.
export const useTypesetQueue = (): TypesetElement => {
  const queue = useRef<Promise<void>>(Promise.resolve());
  return useCallback((element: HTMLElement) => {
    queue.current = queue.current
      .then(() => {
        if (window.MathJax && typeof window.MathJax.typesetPromise === "function") {
          return window.MathJax.typesetPromise([element]);
        }
      })
      .catch(() => {});
  }, []);
};

const ResourceUnavailable = () => {
  const { t } = useTranslation();
  return (
    <MessageBox variant="warning">
      <Text>{t("myNdla.sharedFolder.resourceRemovedTitle")}</Text>
    </MessageBox>
  );
};

interface PrintArticleProps extends Props {
  typesetElement: TypesetElement;
}

const PrintArticle = ({ resource, typesetElement }: PrintArticleProps) => {
  const { i18n } = useTranslation();
  const { data, error } = useSuspenseQuery(folderPrintArticleQuery, {
    variables: {
      articleId: resource.resourceId,
      transformArgs: { showVisualElement: "true", path: resource.path, isOembed: "false" },
    },
  });

  const articleRef = useRef<HTMLDivElement>(null);
  const rawArticle = data?.article;
  const [article, scripts] = useMemo(() => {
    if (!rawArticle) return [undefined, []];
    return [
      transformArticle(rawArticle, i18n.language, {
        path: `${config.ndlaFrontendDomain}/article/${rawArticle.id}`,
        articleLanguage: rawArticle.language,
      }),
      getArticleScripts(rawArticle.requiredLibraries, rawArticle.transformedContent.content, i18n.language),
    ];
  }, [rawArticle, i18n.language]);

  useEffect(() => {
    if (article && articleRef.current) {
      typesetElement(articleRef.current);
    }
  }, [article, typesetElement]);

  if (error || !article) {
    return <ResourceUnavailable />;
  }

  return (
    <div ref={articleRef}>
      {scripts.map((script) => (
        <script key={script.src} src={script.src} type={script.type} async={script.async} defer={script.defer} />
      ))}
      <Article article={article} hideLicenseBox />
    </div>
  );
};

const PrintEmbed = ({ resource }: Props) => {
  const type = resource.resourceType as StandaloneEmbed;
  const { data, error } = useSuspenseQuery(ResourceEmbedQuery, { variables: { id: resource.resourceId, type } });
  const restrictedInfo = useRestrictedMode();

  const properties = useMemo(() => metaToProperties(data?.resourceEmbed.meta, type), [data?.resourceEmbed.meta, type]);
  const content = data?.resourceEmbed.content;
  const transformedContent = useMemo(
    () => (content ? transform(content, { frontendDomain: "", path: resource.path, renderContext: "embed" }) : null),
    [content, resource.path],
  );

  if (error || !transformedContent || !properties) {
    return <ResourceUnavailable />;
  }

  return (
    <ArticleWrapper>
      <ArticleTitle id={`${type}-${resource.resourceId}`} title={properties.title} />
      {restrictedInfo.restricted ? (
        <RestrictedBlock />
      ) : (
        <ArticleContent>
          <section>{transformedContent}</section>
        </ArticleContent>
      )}
    </ArticleWrapper>
  );
};

export const PrintResource = ({ resource, typesetElement }: PrintArticleProps) => {
  const { t } = useTranslation();
  const isArticle = articleResourceTypes.includes(resource.resourceType);
  const sourceUrl = `${config.ndlaFrontendDomain}${resource.path}`;
  return (
    <PrintSection id={printResourceId(resource)}>
      <Suspense fallback={<Spinner />}>
        {isArticle ? (
          <PrintArticle resource={resource} typesetElement={typesetElement} />
        ) : (
          <PrintEmbed resource={resource} />
        )}
      </Suspense>
      <Text>
        {`${t("source")}: `}
        <SafeLink to={sourceUrl}>{sourceUrl}</SafeLink>
      </Text>
    </PrintSection>
  );
};
