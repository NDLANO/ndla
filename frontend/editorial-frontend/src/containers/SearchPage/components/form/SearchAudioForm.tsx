/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { FieldRoot } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import type { SearchParamsDTO } from "@ndla/types-backend/audio-api";
import type { UserDataDTO } from "@ndla/types-backend/draft-api";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import SearchHeader from "../../../../components/Form/SearchHeader";
import { getTagName } from "../../../../components/Form/utils";
import ObjectSelector, { type SelectElement } from "../../../../components/ObjectSelector";
import type { CamelToKebab } from "../../../../interfaces";
import { licenseQuery } from "../../../../modules/draft/draftQueries";
import { getLicensesWithTranslations } from "../../../../util/licenseHelpers";
import { getResourceLanguages } from "../../../../util/resourceHelpers";
import { useStableSearchPageParams } from "../../useStableSearchPageParams";
import { SearchActiveFilters } from "./SearchActiveFilters";
import { SearchFilters } from "./SearchFilters";
import { SearchQueryField } from "./SearchQueryField";

type SearchParams = { [k in keyof SearchParamsDTO as CamelToKebab<k>]: SearchParamsDTO[k] };

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
  const [params, setParams] = useStableSearchPageParams();
  const queryParam = useMemo(() => params.get("query") || "", [params]);
  const [input, setInput] = useState(queryParam);
  const [prevQueryParam, setPrevQueryParam] = useState(queryParam);
  const { t, i18n } = useTranslation();
  const { data: licenses } = useQuery({
    ...licenseQuery(),
    select: (licenses) =>
      getLicensesWithTranslations(licenses, i18n.language).map((license) => ({
        id: license.license,
        name: license.title,
      })),
  });

  if (queryParam !== prevQueryParam) {
    setPrevQueryParam(queryParam);
    setInput(queryParam);
  }

  const removeTagItem = (parameterName: keyof SearchParams) => {
    setParams({ [parameterName]: null });
  };

  const emptySearch = () => {
    setParams({
      "audio-type": null,
      page: null,
      "page-size": null,
      query: null,
      language: null,
      sort: null,
      license: null,
    });
  };

  const getAudioTypes = () => [
    { id: "standard", name: t("searchForm.audioType.standard") },
    { id: "podcast", name: t("searchForm.audioType.podcast") },
  ];

  const filters = {
    query: queryParam,
    "audio-type": getTagName(params.get("audio-type"), getAudioTypes()),
    license: getTagName(params.get("license"), licenses),
    language: params.get("language"),
  };

  const selectElements = [
    { name: "audio-type", options: getAudioTypes() },
    { name: "license", options: licenses ?? [] },
    { name: "language", options: getResourceLanguages(t) },
  ] satisfies SelectElement<SearchParams>[];

  return (
    <>
      <SearchHeader type="audio" filters={filters} userData={userData} />
      <StyledForm
        onSubmit={(e) => {
          e.preventDefault();
          setParams({ query: input });
        }}
      >
        <SearchFilters>
          <SearchQueryField value={input} onChange={setInput} placeholder={t("searchForm.types.audioQuery")} />
          {selectElements.map((selectElement) => (
            <FieldRoot key={selectElement.name}>
              <ObjectSelector
                name={selectElement.name}
                placeholder={t(`searchForm.types.${selectElement.name}`)}
                value={params.get(selectElement.name) ?? ""}
                options={selectElement.options}
                onChange={(value) => setParams({ [selectElement.name]: value.join(",") })}
              />
            </FieldRoot>
          ))}
        </SearchFilters>
      </StyledForm>
      <SearchActiveFilters onReset={emptySearch} onRemoveTag={removeTagItem} tags={filters} />
    </>
  );
};

export default SearchAudioForm;
