/**
 * Copyright (c) 2019-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Hero, HeroBackground, HeroContent, PageContent } from "@ndla/primitives";
import { ArticleWrapper } from "@ndla/ui";
import { dehydrate, HydrationBoundary, noop, QueryClient, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import PreviewDraft, { toFormArticle } from "../../components/PreviewDraft/PreviewDraft";
import {
  transformedContentQueryOptions,
  transformedDisclaimerQueryOptions,
} from "../../components/PreviewDraft/useTransformedArticle";
import { useArticleIsWide } from "../../components/WideArticleEditorProvider";
import { TAXONOMY_VERSION_DEFAULT } from "../../constants";
import { draftQueryOptions } from "../../modules/draft/draftQueries";
import { nodesQueryOptions } from "../../modules/nodes/nodeQueries";
import { getContentTypeFromResourceTypes } from "../../util/resourceHelpers";
import { useTaxonomyVersion } from "../StructureVersion/TaxonomyVersionProvider";
import type { Route } from "./+types/PreviewDraftPage";
import LanguageSelector from "./LanguageSelector";

const resourcesQueryOptions = (draftId: number, language: string, taxonomyVersion: string) =>
  nodesQueryOptions({
    contentURI: `urn:article:${draftId}`,
    taxonomyVersion,
    language,
    nodeType: ["RESOURCE"],
  });

// Fetching the preview on the server lets drafts in external review be read without running JavaScript.
// If the draft can't be fetched here, the page fetches it in the browser instead.
export const loader = async ({ params }: Route.LoaderArgs) => {
  const draftId = Number(params.draftId);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const draft = await queryClient.query(draftQueryOptions({ id: draftId, language: params.language })).catch(noop);
  if (draft) {
    const formArticle = toFormArticle(draft, params.language);
    await Promise.all([
      queryClient.query(resourcesQueryOptions(draftId, params.language, TAXONOMY_VERSION_DEFAULT)).catch(noop),
      queryClient.query(transformedContentQueryOptions(formArticle, params.language, false)).catch(noop),
      formArticle.disclaimer
        ? queryClient.query(transformedDisclaimerQueryOptions(formArticle, params.language)).catch(noop)
        : undefined,
    ]);
  }
  return dehydrate(queryClient);
};

export const clientLoader = () => null;

const Component = ({ loaderData }: Route.ComponentProps) => (
  <HydrationBoundary state={loaderData}>
    <PreviewDraftPage />
  </HydrationBoundary>
);

const PreviewDraftPage = () => {
  const params = useParams<"draftId" | "language">();
  const draftId = Number(params.draftId!);
  const language = params.language!;
  const { t } = useTranslation();
  const { taxonomyVersion } = useTaxonomyVersion();
  const draft = useQuery(draftQueryOptions({ id: draftId, language }));
  const resources = useQuery(resourcesQueryOptions(draftId, language, taxonomyVersion));
  const isWide = useArticleIsWide(draftId);

  if (resources.isLoading || draft.isLoading) {
    return null;
  }

  const firstResource = resources.data?.[0];
  const contentType = firstResource ? getContentTypeFromResourceTypes(firstResource.resourceTypes) : undefined;

  if (isWide) {
    return (
      <PageContent variant="page">
        <LanguageSelector supportedLanguages={draft.data?.supportedLanguages ?? []} />
        <ArticleWrapper>
          <PreviewDraft
            type="article"
            draft={draft.data!}
            contentType={contentType}
            language={language}
            previewAlt={false}
          />
        </ArticleWrapper>
        <title>{`${draft.data?.title?.title} ${t("htmlTitles.titleTemplate")}`}</title>
      </PageContent>
    );
  }

  return (
    <Hero variant="primary">
      <HeroBackground />
      <PageContent variant="article" asChild>
        <HeroContent>
          <LanguageSelector supportedLanguages={draft.data?.supportedLanguages ?? []} />
        </HeroContent>
      </PageContent>
      <PageContent variant="article" gutters="tabletUp">
        <PageContent variant="content" asChild>
          <ArticleWrapper>
            <PreviewDraft
              type="article"
              draft={draft.data!}
              contentType={contentType}
              language={language}
              previewAlt={false}
            />
          </ArticleWrapper>
        </PageContent>
      </PageContent>
      <title>{`${draft.data?.title?.title} ${t("htmlTitles.titleTemplate")}`}</title>
    </Hero>
  );
};

export default Component;
