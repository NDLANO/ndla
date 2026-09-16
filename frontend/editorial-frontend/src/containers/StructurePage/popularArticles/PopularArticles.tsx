/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Heading, Spinner, Text } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import type { Node } from "@ndla/types-backend/taxonomy-api";
import { keyBy } from "@ndla/util";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { LocaleType } from "../../../interfaces";
import { subjectpageQueryOptions } from "../../../modules/frontpage/frontpageQueries";
import { nodesQueryOptions, nodesResourceMetasQueryOptions } from "../../../modules/nodes/nodeQueries";
import { getContentUriFromSearchSummary } from "../../../util/searchHelpers";
import { useTaxonomyVersion } from "../../StructureVersion/TaxonomyVersionProvider";
import { PopularArticleCard } from "./PopularArticleCard";

// Matches the number of popular articles shown on the subject page in ndla-frontend
const POPULAR_ARTICLES_LIMIT = 9;

const ListContainer = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "xsmall",
  },
});

const StyledGrid = styled("ol", {
  base: {
    listStyle: "none",
    display: "grid",
    gap: "small",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    desktopDown: {
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    },
    tabletDown: {
      gridTemplateColumns: "1fr",
    },
  },
});

interface Props {
  subjectNode: Node;
}

export const PopularArticles = ({ subjectNode }: Props) => {
  const { t, i18n } = useTranslation();
  const { taxonomyVersion } = useTaxonomyVersion();

  const subjectpageId = parseInt(subjectNode.contentUri?.replace("urn:frontpage:", "") ?? "");

  const subjectpageQuery = useQuery({
    ...subjectpageQueryOptions({ id: subjectpageId, language: i18n.language as LocaleType }),
    enabled: !Number.isNaN(subjectpageId),
  });

  const popularArticles = useMemo(
    () => subjectpageQuery.data?.popularArticles.slice(0, POPULAR_ARTICLES_LIMIT) ?? [],
    [subjectpageQuery.data],
  );

  const nodesQuery = useQuery({
    ...nodesQueryOptions({
      contextIds: popularArticles.map((article) => article.contextId),
      language: i18n.language,
      taxonomyVersion,
    }),
    enabled: !!popularArticles.length,
  });

  const articles = useMemo(() => {
    const nodes = nodesQuery.data ?? [];
    return popularArticles.reduce<{ node: Node; numHits: number }[]>((acc, article) => {
      const node = nodes.find((node) => node.contexts.some((context) => context.contextId === article.contextId));
      if (!node) return acc;
      const context = node.contexts.find((context) => context.contextId === article.contextId);
      acc.push({
        node: { ...node, context, contextId: article.contextId, url: context?.url },
        numHits: article.numHits,
      });
      return acc;
    }, []);
  }, [nodesQuery.data, popularArticles]);

  const contentUris = useMemo(
    () => articles.map((article) => article.node.contentUri).filter((uri): uri is string => !!uri),
    [articles],
  );

  const nodeResourceMetasQuery = useQuery({
    ...nodesResourceMetasQueryOptions({
      nodeId: subjectNode.id,
      contentUris,
      language: i18n.language,
    }),
    enabled: !!contentUris.length,
  });

  const keyedMetas = useMemo(
    () => keyBy(nodeResourceMetasQuery.data, (meta) => getContentUriFromSearchSummary(meta)),
    [nodeResourceMetasQuery.data],
  );

  if (Number.isNaN(subjectpageId)) return null;

  return (
    <ListContainer>
      <Heading asChild consumeCss textStyle="label.medium" fontWeight="bold">
        <h2>{t("taxonomy.popularArticles.title")}</h2>
      </Heading>
      <Text>{t("taxonomy.popularArticles.description")}</Text>
      {subjectpageQuery.isError || nodesQuery.isError ? (
        <Text color="text.error">{t("taxonomy.popularArticles.error")}</Text>
      ) : subjectpageQuery.isPending || (!!popularArticles.length && nodesQuery.isPending) ? (
        <Spinner />
      ) : articles.length ? (
        <StyledGrid>
          {articles.map(({ node, numHits }) => (
            <PopularArticleCard
              key={node.contextId}
              node={node}
              contentMeta={node.contentUri ? keyedMetas[node.contentUri] : undefined}
              numHits={numHits}
            />
          ))}
        </StyledGrid>
      ) : (
        <Text>{t("taxonomy.popularArticles.noResults")}</Text>
      )}
    </ListContainer>
  );
};
