/**
 * Copyright (c) 2021-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Heading } from "@ndla/primitives";
import type { UserDataDTO } from "@ndla/types-backend/draft-api";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { getResourceLanguages } from "../../../../util/resourceHelpers";
import { useStableSearchPageParams } from "../../useStableSearchPageParams";
import { RadioFilter } from "../filters/RadioFilter";
import { countActiveFilters, SearchLayout } from "../SearchLayout";
import { SearchQueryStack, SearchSummaryRow } from "../SearchSummaryRow";
import { SearchActiveFilters } from "./SearchActiveFilters";
import { SearchQueryField } from "./SearchQueryField";

interface Props {
  userData: UserDataDTO | undefined;
  children?: ReactNode;
  summary?: ReactNode;
}

const SearchAudioForm = ({ userData, children, summary }: Props) => {
  const { t } = useTranslation();
  const [params, setParams] = useStableSearchPageParams();
  const [input, setInput] = useState(params.get("query") ?? "");
  const queryInput = params.get("query");
  const [prevQueryInput, setPrevQueryInput] = useState(queryInput);

  if (queryInput !== prevQueryInput) {
    setPrevQueryInput(queryInput);
    setInput(queryInput ?? "");
  }

  const emptySearch = () => {
    setParams({
      page: null,
      "page-size": null,
      sort: null,
      query: null,
      language: null,
    });
  };

  const filters = {
    query: params.get("query"),
    language: params.get("language"),
  };

  return (
    <SearchLayout
      activeFilterCount={countActiveFilters(filters)}
      sidebar={
        <RadioFilter
          title={t("searchForm.filterHeading.language")}
          name="language"
          options={getResourceLanguages(t)}
          value={params.get("language")}
          onChange={(value) => setParams({ language: value })}
        />
      }
    >
      <Heading textStyle="heading.small">{t("searchPage.header.podcast-series")}</Heading>
      <SearchQueryStack>
        <form
          onSubmit={(e) => {
            setParams({ query: input });
            e.preventDefault();
          }}
        >
          <SearchQueryField
            value={input}
            onClear={() => setParams({ query: null })}
            onChange={setInput}
            placeholder={t("searchForm.types.audioQuery")}
          />
        </form>
        <SearchSummaryRow type="podcast-series" summary={summary} filters={filters} userData={userData} />
      </SearchQueryStack>
      <SearchActiveFilters onReset={emptySearch} onRemoveTag={(tag) => setParams({ [tag]: null })} tags={filters} />
      {children}
    </SearchLayout>
  );
};

export default SearchAudioForm;
