/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { gql, type TypedDocumentNode } from "@apollo/client";
import { skipToken, useSuspenseQuery } from "@apollo/client/react";
import { Hero, HeroBackground } from "@ndla/primitives";
import { type ReactNode, useMemo } from "react";
import { useParams } from "react-router";
import { MobileLaunchpadMenu } from "../../components/Resource/Launchpad";
import { ResourceBreadcrumb } from "../../components/Resource/ResourceBreadcrumb";
import { LayoutWrapper, ResourceContentContainer, RootPageContent } from "../../components/Resource/ResourceLayout";
import { ResourceNavigation } from "../../components/Resource/ResourceNavigation";
import { useRestrictedMode } from "../../components/RestrictedModeContext";
import type { GQLArticleLayoutQuery, GQLArticleLayoutQueryVariables } from "../../graphqlTypes";
import type { Breadcrumb } from "../../interfaces";
import { partitionResources } from "../Resources/getResourceGroups";
import { ArticleLaunchpad } from "./ArticleLaunchpad";

interface Props {
  parentId: string | undefined;
  rootId: string | undefined;
  children: ReactNode;
}

interface ViewProps {
  topic?: GQLArticleLayoutQuery["node"];
  loading: boolean;
  children: ReactNode;
}

const articleLayoutQueryDef: TypedDocumentNode<GQLArticleLayoutQuery, GQLArticleLayoutQueryVariables> = gql`
  query articleLayout($id: String!, $rootId: String) {
    node(id: $id, rootId: $rootId) {
      id
      name
      url
      metadata {
        customFields
      }
      context {
        contextId
        parents {
          contextId
          id
          name
          url
        }
      }
      children(nodeType: "RESOURCE") {
        id
        rank
        context {
          contextId
          url
        }
        ...ArticleLaunchpad_Resource
      }
      ...ArticleLaunchpad_Node
    }
  }
  ${ArticleLaunchpad.fragments.resource}
  ${ArticleLaunchpad.fragments.node}
`;

type Resource = NonNullable<NonNullable<GQLArticleLayoutQuery["node"]>["children"]>[number];

const getId = (resource: Resource) => resource.context?.contextId;

const getUrl = (resource: Resource | undefined) => resource?.context?.url;

export const ArticleLayout = ({ parentId, rootId, children }: Props) => {
  const { contextId } = useParams();

  const topicQuery = useSuspenseQuery(
    articleLayoutQueryDef,
    !parentId || !rootId ? skipToken : { variables: { id: parentId, rootId } },
  );

  const topic = topicQuery.data?.node;

  // If the topic doesn't contain the current contextId, we've most likely navigated outside of the current topic.
  // If the current child is a learningpath, we should display loading until this component unmounts
  const isLoading = !topic?.children?.find(
    (child) => child.context?.contextId === contextId && child.contentUri?.includes("article"),
  );

  return (
    <ArticleLayoutView topic={topic} loading={isLoading}>
      {children}
    </ArticleLayoutView>
  );
};

export const ArticleLayoutSkeleton = ({ children }: { children: ReactNode }) => {
  if (import.meta.env.SSR) return null;

  return <ArticleLayoutView loading>{children}</ArticleLayoutView>;
};

const ArticleLayoutView = ({ topic, loading, children }: ViewProps) => {
  const restrictedInfo = useRestrictedMode();
  const { contextId } = useParams();

  const numbered = (topic?.metadata.customFields as any)?.numbered === "true";

  const { coreArticles, supplementaryArticles, learningpaths } = partitionResources<Resource>(topic?.children ?? []);

  const crumbs = useMemo(() => {
    if (!topic) return [];
    const crumb: Breadcrumb[] = topic.context?.parents?.slice() ?? [];

    crumb.push({ name: topic.name, url: topic.url ?? "" });
    const resource = topic.children?.find((child) => child.context?.contextId && child.context.contextId === contextId);
    if (resource) {
      crumb.push({ name: resource.name, url: resource.url ?? "" });
    }
    return crumb;
  }, [contextId, topic]);

  return (
    <Hero variant="brand1Subtle">
      <HeroBackground />
      <RootPageContent variant="wide">
        <ResourceBreadcrumb breadcrumbs={crumbs} loading={loading} />
        {!restrictedInfo.restricted && (
          <MobileLaunchpadMenu>
            <ArticleLaunchpad
              context="mobile"
              topic={topic}
              learningpaths={learningpaths}
              coreArticles={coreArticles}
              supplementaryArticles={supplementaryArticles}
              numbered={numbered}
              loading={loading}
            />
          </MobileLaunchpadMenu>
        )}
        <LayoutWrapper>
          {!restrictedInfo.restricted && (
            <ArticleLaunchpad
              context="desktop"
              topic={topic}
              loading={loading}
              learningpaths={learningpaths}
              coreArticles={coreArticles}
              supplementaryArticles={supplementaryArticles}
              numbered={numbered}
            />
          )}
          <ResourceContentContainer asChild consumeCss>
            <main>
              {children}
              <ResourceNavigation
                parentUrl={topic?.url}
                items={coreArticles}
                currentId={contextId}
                getUrl={getUrl}
                getId={getId}
              />
            </main>
          </ResourceContentContainer>
        </LayoutWrapper>
      </RootPageContent>
    </Hero>
  );
};
