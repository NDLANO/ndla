/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Heading } from "@ndla/primitives";
import type { UserDataDTO } from "@ndla/types-backend/draft-api";
import type { SearchParamsDTO, ImageSearchField } from "@ndla/types-backend/image-api";
import { useQuery } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { getTagName } from "../../../../components/Form/utils";
import ObjectSelector, { type SelectOption } from "../../../../components/ObjectSelector";
import config from "../../../../config";
import type { CamelToKebab } from "../../../../interfaces";
import { auth0UsersQueryOptions } from "../../../../modules/auth0/auth0Queries";
import { licenseQuery } from "../../../../modules/draft/draftQueries";
import { imageEditorsQueryOptions } from "../../../../modules/image/imageQueries";
import { getLicensesWithTranslations } from "../../../../util/licenseHelpers";
import { getResourceLanguages } from "../../../../util/resourceHelpers";
import { useStableSearchPageParams } from "../../useStableSearchPageParams";
import { FilterGroup } from "../filters/FilterGroup";
import { RadioFilter } from "../filters/RadioFilter";
import { countActiveFilters, SearchLayout } from "../SearchLayout";
import { SearchQueryStack, SearchSummaryRow } from "../SearchSummaryRow";
import { SearchActiveFilters } from "./SearchActiveFilters";
import { SearchQueryField } from "./SearchQueryField";

type SearchParams = { [k in keyof SearchParamsDTO as CamelToKebab<k>]: SearchParamsDTO[k] } & {
  width: string;
  height: string;
  "ai-generated"?: string | null;
  "model-released"?: string | null;
  "query-fields"?: string | null;
  "content-type"?: string | null;
};

interface Props {
  userData: UserDataDTO | undefined;
  children?: ReactNode;
  summary?: ReactNode;
}

const getAiGeneratedOptions = (t: TFunction) => [
  { id: "Yes", name: t("imageSearch.aiGenerated.yes") },
  { id: "No", name: t("imageSearch.aiGenerated.no") },
  { id: "Partial", name: t("imageSearch.aiGenerated.partial") },
];

const getModelReleasedValues = (t: TFunction) => [
  { id: "yes", name: t("imageSearch.modelReleased.yes") },
  { id: "not-applicable", name: t("imageSearch.modelReleased.not-applicable") },
  { id: "no", name: t("imageSearch.modelReleased.no") },
  { id: "not-set", name: t("imageSearch.modelReleased.not-set") },
];

export const getInactiveOptions = (t: TFunction) => [
  { id: "true", name: t("imageSearch.inactive.true") },
  { id: "false", name: t("imageSearch.inactive.false") },
];

export const getImageSizeOptions = (t: TFunction) => [
  { id: "too-small", name: t("imageSearch.size.too-small") },
  { id: "small", name: t("imageSearch.size.small") },
  { id: "hd", name: t("imageSearch.size.hd") },
  { id: "4k", name: t("imageSearch.size.4k") },
  { id: "custom", name: t("imageSearch.size.custom"), disabled: true },
];

export interface ImageSizeRange {
  from?: string;
  to?: string;
}

type ImageSize = "too-small" | "small" | "hd" | "4k";

const imageSizeToRangeMap: Record<ImageSize, ImageSizeRange> = {
  "too-small": { from: undefined, to: "999" },
  small: { from: "1000", to: "2000" },
  hd: { from: "2000", to: "4000" },
  "4k": { from: "4000", to: undefined },
};

const rangeToImageSizeMap: Record<string, ImageSize> = {
  "undefined-999": "too-small",
  "1000-2000": "small",
  "2000-4000": "hd",
  "4000-undefined": "4k",
};

const getSizeValue = (from: string | undefined, to: string | undefined, t: TFunction) => {
  const value = [];
  if (from) value.push(t("imageSearch.imageWidth.from", { value: from }));
  if (to) value.push(t("imageSearch.imageWidth.to", { value: to }));

  return value.join(" ");
};

const toSelectorValue = (from: string | null, to: string | null) => {
  const rangeString = `${from?.toString()}-${to?.toString()}`;
  return rangeToImageSizeMap[rangeString] ?? "custom";
};

export const getContentTypeOptions = (t: TFunction) => [
  { id: "image/svg+xml", name: t("imageSearch.contentType.svg") },
  { id: "image/jpeg", name: t("imageSearch.contentType.jpeg") },
  { id: "image/png", name: t("imageSearch.contentType.png") },
  { id: "image/gif", name: t("imageSearch.contentType.gif") },
  { id: "image/webp", name: t("imageSearch.contentType.webp") },
];

const queryFields = [
  "titles",
  "alttexts",
  "captions",
  "tags",
  "creators",
  "processors",
  "rightsholders",
  "editorNotes",
] satisfies ImageSearchField[];

const getQueryFieldOptions = (t: TFunction): SelectOption[] =>
  queryFields.map((field) => ({
    id: field,
    name: t(`searchForm.queryFields.${field}`),
  }));

const SearchImageForm = ({ userData, children, summary }: Props) => {
  const [params, setParams] = useStableSearchPageParams();
  const { t, i18n } = useTranslation();
  const [input, setInput] = useState(params.get("query") ?? "");
  const queryInput = params.get("query");
  const [prevQueryInput, setPrevQueryInput] = useState(queryInput);
  const { data: licenses } = useQuery({
    ...licenseQuery(),
    select: (licenses) =>
      getLicensesWithTranslations(licenses, i18n.language).map((license) => ({
        id: license.license,
        name: license.title,
      })),
  });
  const { data: editorIds } = useQuery(imageEditorsQueryOptions());

  const { data: users } = useQuery({
    ...auth0UsersQueryOptions({ uniqueUserIds: editorIds?.ids?.join(",") ?? "" }),
    enabled: !!editorIds?.ids?.length,
    select: (users) => users.map((u) => ({ id: `${u.app_metadata.ndla_id}`, name: u.name })),
    placeholderData: [],
  });

  if (queryInput !== prevQueryInput) {
    setPrevQueryInput(queryInput);
    setInput(queryInput ?? "");
  }

  const removeTagItem = (parameterName: keyof SearchParams) => {
    if (parameterName === "query") setInput("");
    if (parameterName === "width") {
      setParams({ "width-from": null, "width-to": null });
    }
    if (parameterName === "height") {
      setParams({ "height-from": null, "height-to": null });
    }
    setParams({ [parameterName]: null });
  };

  const emptySearch = () => {
    setParams({
      query: null,
      "query-fields": null,
      language: null,
      license: null,
      "model-released": null,
      "ai-generated": null,
      inactive: null,
      page: null,
      sort: null,
      "page-size": null,
      users: null,
      "width-from": null,
      "width-to": null,
      "height-from": null,
      "height-to": null,
      "content-type": null,
    });
  };

  const sizeOptions = getImageSizeOptions(t);

  const filters = {
    query: queryInput,
    "query-fields": params
      .get("query-fields")
      ?.split(",")
      .map((f) => getTagName(f, getQueryFieldOptions(t)))
      .filter((t): t is string => !!t),
    license: getTagName(params.get("license"), licenses),
    "model-released": getTagName(params.get("model-released"), getModelReleasedValues(t)),
    "ai-generated": getTagName(params.get("ai-generated"), getAiGeneratedOptions(t)),
    language: params.get("language"),
    inactive: getTagName(params.get("inactive"), getInactiveOptions(t)),
    // TODO: This is ugly
    users: getTagName(params.get("users")?.split(",")?.[0], users),
    width: getSizeValue(params.get("width-from") ?? undefined, params.get("width-to") ?? undefined, t),
    height: getSizeValue(params.get("height-from") ?? undefined, params.get("height-to") ?? undefined, t),
    "content-type": getTagName(params.get("content-type"), getContentTypeOptions(t)),
  };

  const setSizeRange = (prefix: "width" | "height", value: string | null) => {
    const { from, to } = value ? imageSizeToRangeMap[value as ImageSize] : { from: null, to: null };
    setParams({ [`${prefix}-from`]: from, [`${prefix}-to`]: to });
  };

  return (
    <SearchLayout
      activeFilterCount={countActiveFilters(filters)}
      sidebar={
        <>
          <FilterGroup
            title={t("searchForm.filterHeading.license")}
            name="license"
            activeCount={params.get("license") ? 1 : 0}
          >
            <ObjectSelector
              name="license"
              value={params.get("license") ?? ""}
              options={licenses ?? []}
              onChange={(value) => setParams({ license: value[0] })}
              placeholder={t("searchForm.types.license")}
            />
          </FilterGroup>
          <FilterGroup
            title={t("searchForm.filterHeading.users")}
            name="users"
            activeCount={params.get("users") ? 1 : 0}
          >
            <ObjectSelector
              name="users"
              value={params.get("users") ?? ""}
              options={users ?? []}
              onChange={(value) => setParams({ users: value[0] })}
              placeholder={t("searchForm.types.users")}
            />
          </FilterGroup>
          <RadioFilter
            title={t("searchForm.filterHeading.language")}
            name="language"
            options={getResourceLanguages(t)}
            value={params.get("language")}
            onChange={(value) => setParams({ language: value })}
          />
          <RadioFilter
            title={t("searchForm.filterHeading.content-type")}
            name="content-type"
            options={getContentTypeOptions(t)}
            value={params.get("content-type")}
            onChange={(value) => setParams({ "content-type": value })}
          />
          <RadioFilter
            title={t("searchForm.filterHeading.image-width")}
            name="image-width"
            options={sizeOptions}
            value={filters.width.length ? toSelectorValue(params.get("width-from"), params.get("width-to")) : null}
            onChange={(value) => setSizeRange("width", value)}
          />
          {config.displayImageHeightFilter ? (
            <RadioFilter
              title={t("searchForm.filterHeading.image-height")}
              name="image-height"
              options={sizeOptions}
              value={filters.height.length ? toSelectorValue(params.get("height-from"), params.get("height-to")) : null}
              onChange={(value) => setSizeRange("height", value)}
            />
          ) : undefined}
          <RadioFilter
            title={t("searchForm.filterHeading.model-released")}
            name="model-released"
            options={getModelReleasedValues(t)}
            value={params.get("model-released")}
            onChange={(value) => setParams({ "model-released": value })}
          />
          <RadioFilter
            title={t("searchForm.filterHeading.ai-generated")}
            name="ai-generated"
            options={getAiGeneratedOptions(t)}
            value={params.get("ai-generated")}
            onChange={(value) => setParams({ "ai-generated": value })}
          />
          <RadioFilter
            title={t("searchForm.filterHeading.inactive")}
            name="inactive"
            options={getInactiveOptions(t)}
            value={params.get("inactive")}
            onChange={(value) => setParams({ inactive: value })}
          />
        </>
      }
    >
      <Heading textStyle="heading.small">{t("searchPage.header.image")}</Heading>
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
            placeholder={t("searchForm.types.imageQuery")}
          >
            <ObjectSelector
              name="query-fields"
              value={params.get("query-fields") ?? ""}
              options={getQueryFieldOptions(t)}
              multiple
              onChange={(value) => setParams({ "query-fields": value.join(",") })}
              placeholder={t("searchForm.types.query-fields")}
            />
          </SearchQueryField>
        </form>
        <SearchSummaryRow type="image" summary={summary} filters={filters} userData={userData} />
      </SearchQueryStack>
      <SearchActiveFilters onReset={emptySearch} onRemoveTag={removeTagItem} tags={filters} />
      {children}
    </SearchLayout>
  );
};

export default SearchImageForm;
