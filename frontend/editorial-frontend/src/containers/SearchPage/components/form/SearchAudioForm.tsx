/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SearchParamsDTO } from "@ndla/types-backend/audio-api";
import type { UserDataDTO } from "@ndla/types-backend/draft-api";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import SearchHeader from "../../../../components/Form/SearchHeader";
import { getTagName } from "../../../../components/Form/utils";
import ObjectSelector from "../../../../components/ObjectSelector";
import type { CamelToKebab } from "../../../../interfaces";
import { licenseQuery } from "../../../../modules/draft/draftQueries";
import { getLicensesWithTranslations } from "../../../../util/licenseHelpers";
import { getResourceLanguages } from "../../../../util/resourceHelpers";
import { useStableSearchPageParams } from "../../useStableSearchPageParams";
import { FilterGroup } from "../filters/FilterGroup";
import { RadioFilter } from "../filters/RadioFilter";
import { countActiveFilters, SearchFiltersToggle, SearchLayout } from "../SearchLayout";
import { SearchActiveFilters } from "./SearchActiveFilters";
import { SearchQueryField } from "./SearchQueryField";

type SearchParams = { [k in keyof SearchParamsDTO as CamelToKebab<k>]: SearchParamsDTO[k] };

interface Props {
  userData: UserDataDTO | undefined;
  children?: ReactNode;
}

const SearchAudioForm = ({ userData, children }: Props) => {
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

  return (
    <SearchLayout
      activeFilterCount={countActiveFilters(filters)}
      sidebar={
        <>
          <RadioFilter
            title={t("searchForm.filterHeading.audio-type")}
            name="audio-type"
            options={getAudioTypes()}
            value={params.get("audio-type")}
            onChange={(value) => setParams({ "audio-type": value })}
          />
          <FilterGroup
            title={t("searchForm.filterHeading.license")}
            name="license"
            activeCount={params.get("license") ? 1 : 0}
          >
            <ObjectSelector
              name="license"
              placeholder={t("searchForm.types.license")}
              value={params.get("license") ?? ""}
              options={licenses ?? []}
              onChange={(value) => setParams({ license: value[0] })}
            />
          </FilterGroup>
          <RadioFilter
            title={t("searchForm.filterHeading.language")}
            name="language"
            options={getResourceLanguages(t)}
            value={params.get("language")}
            onChange={(value) => setParams({ language: value })}
            defaultOpen={false}
          />
        </>
      }
    >
      <SearchHeader type="audio" filters={filters} userData={userData}>
        <SearchFiltersToggle />
      </SearchHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setParams({ query: input });
        }}
      >
        <SearchQueryField value={input} onChange={setInput} placeholder={t("searchForm.types.audioQuery")} />
      </form>
      <SearchActiveFilters onReset={emptySearch} onRemoveTag={removeTagItem} tags={filters} />
      {children}
    </SearchLayout>
  );
};

export default SearchAudioForm;
