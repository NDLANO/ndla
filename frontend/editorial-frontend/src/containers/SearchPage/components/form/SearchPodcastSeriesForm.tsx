/**
 * Copyright (c) 2021-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { styled } from "@ndla/styled-system/jsx";
import type { UserDataDTO } from "@ndla/types-backend/draft-api";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import SearchHeader from "../../../../components/Form/SearchHeader";
import ObjectSelector from "../../../../components/ObjectSelector";
import { getResourceLanguages } from "../../../../util/resourceHelpers";
import { useStableSearchPageParams } from "../../useStableSearchPageParams";
import { SearchActiveFilters } from "./SearchActiveFilters";
import { SearchFilters } from "./SearchFilters";
import { SearchQueryField } from "./SearchQueryField";

const StyledForm = styled("form", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "3xsmall",
  },
});

interface Props {
  userData: UserDataDTO | undefined;
}

const SearchAudioForm = ({ userData }: Props) => {
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
    <>
      <SearchHeader type="podcast-series" filters={filters} userData={userData} />
      <StyledForm
        onSubmit={(e) => {
          setParams({ query: input });
          e.preventDefault();
        }}
      >
        <SearchFilters>
          <SearchQueryField value={input} onChange={setInput} placeholder={t("searchForm.types.audioQuery")} />
          <ObjectSelector
            name="language"
            value={params.get("language") ?? ""}
            options={getResourceLanguages(t)}
            onChange={(value) => setParams({ language: value[0] })}
            placeholder={t("searchForm.types.language")}
          />
        </SearchFilters>
      </StyledForm>
      <SearchActiveFilters onReset={emptySearch} onRemoveTag={(tag) => setParams({ [tag]: null })} tags={filters} />
    </>
  );
};

export default SearchAudioForm;
