/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { gql, type TypedDocumentNode } from "@apollo/client";
import { useSuspenseQuery } from "@apollo/client/react";
import { CloseLine } from "@ndla/icons";
import { Button, Heading, Spinner } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import { type ReactNode, Suspense, useCallback, useDeferredValue, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { GQLGrepFilterQuery, GQLGrepFilterQueryVariables } from "../../graphqlTypes";
import { FilterContainer } from "./FilterContainer";
import { useStableSearchPageParams } from "./useStableSearchPageParams";

const FiltersWrapper = styled("div", {
  base: {
    display: "flex",
    gap: "small",
    flexWrap: "wrap",
  },
});

// const CompetenceWrapper = styled("div", {
//   base: {
//     display: "flex",
//     flexDirection: "column",
//     gap: "small",
//   },
// });
// const CompetenceItemWrapper = styled("div", {
//   base: {
//     display: "flex",
//     flexDirection: "column",
//     gap: "xxsmall",
//   },
// });

const grepFilterQuery: TypedDocumentNode<GQLGrepFilterQuery, GQLGrepFilterQueryVariables> = gql`
  query grepFilter($codes: [String!], $language: String!) {
    competenceGoals(codes: $codes, language: $language) {
      id
      title
      type
      curriculum {
        id
        title
      }
      competenceGoalSet {
        id
        title
      }
    }
    coreElements(codes: $codes, language: $language) {
      id
      title
      description
    }
  }
`;

export const GrepFilter = () => {
  const [searchParams] = useStableSearchPageParams();
  const codes = useMemo(() => searchParams.get("grepCodes")?.split(",") ?? [], [searchParams]);

  if (!codes.length) return;

  return (
    <Suspense
      fallback={
        <GrepFilterContainer>
          <Spinner />
        </GrepFilterContainer>
      }
    >
      <GrepFilterContent />
    </Suspense>
  );
};

const GrepFilterContainer = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation();

  return (
    <FilterContainer>
      <Heading asChild consumeCss textStyle="label.medium" fontWeight="bold">
        <h3>{t("searchPage.grepFilter.heading")}</h3>
      </Heading>
      {children}
    </FilterContainer>
  );
};

const GrepFilterContent = () => {
  const [searchParams, setSearchParams] = useStableSearchPageParams();
  const { t, i18n } = useTranslation();
  const codes = useMemo(() => searchParams.get("grepCodes")?.split(",") ?? [], [searchParams]);

  // Deferring the codes keeps the previously resolved chips on screen while the next ones load.
  const deferredCodes = useDeferredValue(codes);
  const grepQuery = useSuspenseQuery(grepFilterQuery, {
    variables: { language: i18n.language, codes: deferredCodes },
    skip: !deferredCodes.length,
  });

  // const groupedCompetenceGoals = useMemo(() => {
  //   return groupCompetenceGoals(grepQuery.data?.competenceGoals ?? [], true, "LK20");
  // }, [grepQuery.data?.competenceGoals]);
  //
  // const mappedCoreElements = useMemo(() => {
  //   return (
  //     grepQuery.data?.coreElements?.map((element) => ({
  //       title: element.title,
  //       text: element.description ?? "",
  //       id: element.id,
  //       url: "",
  //     })) ?? []
  //   );
  // }, [grepQuery.data?.coreElements]);

  const data = grepQuery.data;

  const grepElements = useMemo(
    () => [data?.competenceGoals, data?.coreElements].filter((arr) => !!arr).flat(),
    [data?.competenceGoals, data?.coreElements],
  );

  const onRemoveCode = useCallback(
    (value: string) => {
      const newCodes = codes.filter((code) => code !== value);
      setSearchParams({ grepCodes: newCodes.join(",") });
    },
    [codes, setSearchParams],
  );

  if (!data?.competenceGoals?.length && !data?.coreElements?.length) {
    return;
  }

  return (
    <GrepFilterContainer>
      {/* <CompetenceWrapper> */}
      {/*   {!!groupedCompetenceGoals?.length && ( */}
      {/*     <CompetenceItemWrapper> */}
      {/*       <Heading textStyle="title.large" asChild consumeCss> */}
      {/*         <h4>{t("competenceGoals.competenceGoalItem.title")}</h4> */}
      {/*       </Heading> */}
      {/*       {groupedCompetenceGoals.map((goal, index) => ( */}
      {/*         <CompetenceItem item={goal} key={index} /> */}
      {/*       ))} */}
      {/*     </CompetenceItemWrapper> */}
      {/*   )} */}
      {/*   {!!grepQuery.data?.coreElements?.length && ( */}
      {/*     <CompetenceItemWrapper> */}
      {/*       <Heading textStyle="title.large" asChild consumeCss> */}
      {/*         <h2>{t("competenceGoals.competenceTabCorelabel")}</h2> */}
      {/*       </Heading> */}
      {/*       <CompetenceItem item={{ elements: mappedCoreElements }} /> */}
      {/*     </CompetenceItemWrapper> */}
      {/*   )} */}
      {/* </CompetenceWrapper> */}
      <FiltersWrapper>
        {codes.map((grep) => {
          const item = grepElements.find((g) => g.id === grep);
          if (!item) return null;
          return (
            <Button
              key={item.id}
              size="small"
              variant="primary"
              onClick={() => onRemoveCode(item.id)}
              aria-label={t("searchPage.grepFilter.removeFilter", { code: item.id, title: item.title })}
              title={t("searchPage.grepFilter.removeFilter", { code: item.id, title: item.title })}
            >
              {item.id}
              {" - "}
              {item.title}
              <CloseLine />
            </Button>
          );
        })}
      </FiltersWrapper>
    </GrepFilterContainer>
  );
};
