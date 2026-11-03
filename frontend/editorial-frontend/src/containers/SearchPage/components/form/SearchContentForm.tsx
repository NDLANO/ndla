/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { tDynamic } from "@ndla/locales";
import type { UserDataDTO } from "@ndla/types-backend/draft-api";
import type { DraftSearchField } from "@ndla/types-backend/search-api";
import type { Node, ResourceType } from "@ndla/types-backend/taxonomy-api";
import { partition, sortBy } from "@ndla/util";
import { useQuery } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import SearchHeader from "../../../../components/Form/SearchHeader";
import { getTagName } from "../../../../components/Form/utils";
import ObjectSelector, { type SelectOption } from "../../../../components/ObjectSelector";
import {
  DA_SUBJECT_ID,
  FAVOURITES_SUBJECT_ID,
  SA_SUBJECT_ID,
  LMA_SUBJECT_ID,
  NO_SUBJECT_ID,
  NO_RESPONSIBLES,
  TAXONOMY_CUSTOM_FIELD_SUBJECT_SA,
  TAXONOMY_CUSTOM_FIELD_SUBJECT_DA,
  TAXONOMY_CUSTOM_FIELD_SUBJECT_LMA,
  TAXONOMY_CUSTOM_FIELD_SUBJECT_FOR_CONCEPT,
  RESOURCE_TYPE_LEARNING_PATH,
} from "../../../../constants";
import { auth0UsersQueryOptions } from "../../../../modules/auth0/auth0Queries";
import {
  licenseQuery,
  draftStatusStateMachineQueryOptions,
  draftResponsiblesQueryOptions,
  draftEditorsQueryOptions,
} from "../../../../modules/draft/draftQueries";
import { resourceTypesQueryOptions } from "../../../../modules/taxonomy/resourcetypes/resourceTypesQueries";
import formatDate from "../../../../util/formatDate";
import { getLicensesWithTranslations } from "../../../../util/licenseHelpers";
import { getResourceLanguages } from "../../../../util/resourceHelpers";
import { lowerCased } from "../../../../util/translationKeys";
import InlineDatePicker from "../../../FormikForm/components/InlineDatePicker";
import { useTaxonomyVersion } from "../../../StructureVersion/TaxonomyVersionProvider";
import { useStableSearchPageParams } from "../../useStableSearchPageParams";
import { CheckboxFilter } from "../filters/CheckboxFilter";
import { FilterGroup } from "../filters/FilterGroup";
import { RadioFilter } from "../filters/RadioFilter";
import { countActiveFilters, SearchFiltersToggle, SearchLayout } from "../SearchLayout";
import CheckboxSelector from "./CheckboxSelector";
import { SearchActiveFilters } from "./SearchActiveFilters";
import { SearchQueryField } from "./SearchQueryField";

interface ContextType {
  name: string;
  id: string;
}

const getContextTypes = (resourceTypes: ResourceType[], t: TFunction) => {
  const contextTypes = resourceTypes.reduce<ContextType[]>((acc, type) => {
    if (type.id !== RESOURCE_TYPE_LEARNING_PATH) {
      acc.push({ name: type.name, id: type.id });
    }
    return acc;
  }, []);
  contextTypes.push({
    name: t("contextTypes.learningpath"),
    id: "learningpath",
  });
  contextTypes.push({ name: t("contextTypes.topic"), id: "topic-article" });
  contextTypes.push({
    name: t("contextTypes.frontpage"),
    id: "frontpage-article",
  });
  contextTypes.push({ name: t("contextTypes.standard"), id: "standard" });
  contextTypes.push({ name: t("contextTypes.concept"), id: "concept" });
  contextTypes.push({ name: t("contextTypes.gloss"), id: "gloss" });
  return contextTypes;
};

const getArticleTraits = (t: TFunction) => [
  { id: "VIDEO", name: t("articleTraits.VIDEO") },
  { id: "AUDIO", name: t("articleTraits.AUDIO") },
  { id: "INTERACTIVE", name: t("articleTraits.INTERACTIVE") },
  { id: "PODCAST", name: t("articleTraits.PODCAST") },
];

const getPriorityOptions = (t: TFunction) => [
  { id: "prioritized", name: t("editorFooter.prioritized") },
  { id: "on-hold", name: t("welcomePage.workList.onHold") },
];

const SHORTCUT_SUBJECT_IDS = [FAVOURITES_SUBJECT_ID, LMA_SUBJECT_ID, SA_SUBJECT_ID, DA_SUBJECT_ID, NO_SUBJECT_ID];

const userHasCustomField = (subjects: Node[], ndlaId: string | undefined, customField: string) =>
  subjects.some((s) => s.metadata.customFields?.[customField] === ndlaId);

const queryFields = [
  "title",
  "introduction",
  "content",
  "metaDescription",
  "disclaimer",
  "tags",
  "embedAttributes",
  "creators",
  "processors",
  "rightsholders",
  "revisionMeta",
  "notes",
  "previousNotes",
] satisfies DraftSearchField[];

const getQueryFieldOptions = (t: TFunction): SelectOption[] =>
  queryFields.map((field) => ({
    id: field,
    name: t(`searchForm.queryFields.${field}`),
  }));

interface Props {
  subjects: Node[];
  userData: UserDataDTO | undefined;
  children?: ReactNode;
}

const SearchContentForm = ({ subjects, userData, children }: Props) => {
  const { t, i18n } = useTranslation();
  const { taxonomyVersion } = useTaxonomyVersion();
  const [params, setParams] = useStableSearchPageParams();
  const [queryInput, setQueryInput] = useState(params.get("query") ?? "");
  const [prevParams, setPrevParams] = useState(params);

  const { data: editorIds } = useQuery(draftEditorsQueryOptions());
  const { data: responsibleIds } = useQuery(draftResponsiblesQueryOptions());

  const { data: users } = useQuery({
    ...auth0UsersQueryOptions({ uniqueUserIds: editorIds?.join(",") ?? "" }),
    enabled: !!editorIds?.length,
    select: (users) => users.map((u) => ({ id: `${u.app_metadata.ndla_id}`, name: u.name })),
    placeholderData: [],
  });

  const { data: responsibles } = useQuery({
    ...auth0UsersQueryOptions({
      uniqueUserIds: responsibleIds?.join(",") ?? "",
    }),
    enabled: !!responsibleIds?.length,
    select: (users) => {
      const options = [{ id: NO_RESPONSIBLES, name: t("searchForm.noResponsibles") }];
      return options.concat(users.map((u) => ({ id: `${u.app_metadata.ndla_id}`, name: u.name })));
    },
    placeholderData: [],
  });

  const { data: resourceTypes } = useQuery({
    ...resourceTypesQueryOptions({ language: i18n.language, taxonomyVersion }),
    select: (resourceTypes) => getContextTypes(resourceTypes, t),
    placeholderData: [],
  });

  const { data: licenses } = useQuery({
    ...licenseQuery(),
    select: (licenses) =>
      getLicensesWithTranslations(licenses, i18n.language, true).map((license) => ({
        id: license.license,
        name: license.title,
      })),
  });

  if (params !== prevParams) {
    setPrevParams(params);
    setQueryInput(params.get("query") ?? "");
  }

  const emptySearch = () => {
    setParams({
      "draft-status": null,
      "resource-types": null,
      page: null,
      "page-size": null,
      sort: null,
      "revision-date-from": null,
      "revision-date-to": null,
      "responsible-ids": null,
      query: null,
      "query-fields": null,
      language: null,
      "article-types": null,
      subjects: null,
      users: null,
      license: null,
      traits: null,
      priority: null,
      "is-primary": null,
    });
  };

  const { data: statuses } = useQuery(draftStatusStateMachineQueryOptions());

  const draftStatuses: SelectOption[] = useMemo(() => {
    const arr = Object.keys(statuses ?? []) ?? [];
    arr.push("HAS_PUBLISHED", "UNLISTED", "PRIVATE");
    return sortBy(
      arr.map((s) => ({ id: s, name: tDynamic(t, `form.status.${lowerCased(s)}`) })),
      (s) => s.name,
    );
  }, [statuses, t]);

  const sortedSubjects: SelectOption[] = useMemo(() => {
    const [regularSubjects, conceptSubjects] = partition(
      sortBy(subjects, (s) => s.name),
      (s) => s.metadata.customFields[TAXONOMY_CUSTOM_FIELD_SUBJECT_FOR_CONCEPT] !== "true",
    );

    const finalSubjects: SelectOption[] = [{ id: FAVOURITES_SUBJECT_ID, name: t("searchForm.favourites") }];

    if (userHasCustomField(subjects, userData?.userId, TAXONOMY_CUSTOM_FIELD_SUBJECT_LMA)) {
      finalSubjects.push({
        id: LMA_SUBJECT_ID,
        name: t("searchForm.LMASubjects"),
      });
    }
    if (userHasCustomField(subjects, userData?.userId, TAXONOMY_CUSTOM_FIELD_SUBJECT_SA)) {
      finalSubjects.push({
        id: SA_SUBJECT_ID,
        name: t("searchForm.SASubjects"),
      });
    }
    if (userHasCustomField(subjects, userData?.userId, TAXONOMY_CUSTOM_FIELD_SUBJECT_DA)) {
      finalSubjects.push({
        id: DA_SUBJECT_ID,
        name: t("searchForm.DASubjects"),
      });
    }
    finalSubjects.push({ id: NO_SUBJECT_ID, name: t("searchForm.noSubjects") });
    finalSubjects.push(...regularSubjects.map((s) => ({ ...s, name: s.name ?? "" })));

    conceptSubjects.forEach((s) => {
      finalSubjects.push({
        ...s,
        name: t("searchForm.conceptSubject", { name: s.name }),
      });
    });

    return finalSubjects;
  }, [subjects, t, userData]);

  const filters = {
    query: params.get("query"),
    "query-fields": params
      .get("query-fields")
      ?.split(",")
      .map((f) => getTagName(f, getQueryFieldOptions(t)))
      .filter((t): t is string => !!t),
    subjects: params
      .get("subjects")
      ?.split(",")
      .map((f) => getTagName(f, sortedSubjects))
      .filter((t): t is string => !!t),
    "resource-types": params
      .get("resource-types")
      ?.split(",")
      .map((f) => getTagName(f, resourceTypes))
      .filter((t): t is string => !!t),
    "responsible-ids": params
      .get("responsible-ids")
      ?.split(",")
      .map((f) => getTagName(f, responsibles))
      .filter((t): t is string => !!t),
    "draft-status": params
      .get("draft-status")
      ?.split(",")
      .map((f) => f.toLowerCase())
      .filter((t): t is string => !!t),
    priority: params
      .get("priority")
      ?.split(",")
      .map((f) => getTagName(f, getPriorityOptions(t)))
      .filter((t): t is string => !!t),
    users: params
      .get("users")
      ?.split(",")
      .map((f) => getTagName(f, users))
      .filter((t): t is string => !!t),
    language: params.get("language"),
    license: getTagName(params.get("license"), licenses),
    "revision-date-from": formatDate(params.get("revision-date-from")) || undefined,
    "revision-date-to": formatDate(params.get("revision-date-to")) || undefined,
    traits:
      params
        .get("traits")
        ?.split(",")
        .map((trait) => tDynamic(t, `articleTraits.${trait}`)) ?? undefined,
    "is-primary": params.get("is-primary") || undefined,
  };

  const getValues = (name: string) => params.get(name)?.split(",") ?? [];
  const setValues = (name: string, values: string[]) => setParams({ [name]: values.join(",") });

  const [shortcutSubjects, regularSubjects] = partition(sortedSubjects, (s) => SHORTCUT_SUBJECT_IDS.includes(s.id));
  const [selectedShortcutSubjects, selectedRegularSubjects] = partition(getValues("subjects"), (id) =>
    SHORTCUT_SUBJECT_IDS.includes(id),
  );

  return (
    <SearchLayout
      activeFilterCount={countActiveFilters(filters)}
      sidebar={
        <>
          <CheckboxFilter
            title={t("searchForm.filterHeading.subjects")}
            name="subjects"
            options={shortcutSubjects}
            value={selectedShortcutSubjects}
            onChange={(values) => setValues("subjects", [...values, ...selectedRegularSubjects])}
          >
            <ObjectSelector
              name="subjects"
              placeholder={t("searchForm.types.subjects")}
              value={selectedRegularSubjects.join(",")}
              multiple
              options={regularSubjects}
              onChange={(values) => setValues("subjects", [...selectedShortcutSubjects, ...values])}
            />
            <CheckboxSelector
              disabled={params.get("subjects") == null}
              title={t("searchForm.primaryCheckbox")}
              name="is-primary"
              checked={params.get("is-primary") === "true"}
              onCheckedChange={(value) => setParams({ "is-primary": value ? "true" : undefined })}
            />
          </CheckboxFilter>
          <CheckboxFilter
            title={t("searchForm.filterHeading.draft-status")}
            name="draft-status"
            options={draftStatuses}
            value={getValues("draft-status")}
            onChange={(values) => setValues("draft-status", values)}
            collapsedCount={6}
          />
          <CheckboxFilter
            title={t("searchForm.filterHeading.resource-types")}
            name="resource-types"
            options={sortBy(resourceTypes, (rt) => rt.name)}
            value={getValues("resource-types")}
            onChange={(values) => setValues("resource-types", values)}
            collapsedCount={6}
          />
          <FilterGroup title={t("searchForm.filterHeading.responsible-ids")}>
            <ObjectSelector
              name="responsible-ids"
              placeholder={t("searchForm.types.responsible-ids")}
              value={params.get("responsible-ids") ?? ""}
              multiple
              options={responsibles ?? []}
              onChange={(values) => setValues("responsible-ids", values)}
            />
          </FilterGroup>
          <CheckboxFilter
            title={t("searchForm.filterHeading.priority")}
            name="priority"
            options={getPriorityOptions(t)}
            value={getValues("priority")}
            onChange={(values) => setValues("priority", values)}
          />
          <CheckboxFilter
            title={t("searchForm.filterHeading.traits")}
            name="traits"
            options={getArticleTraits(t)}
            value={getValues("traits")}
            onChange={(values) => setValues("traits", values)}
          />
          <FilterGroup title={t("searchForm.filterHeading.users")}>
            <ObjectSelector
              name="users"
              placeholder={t("searchForm.types.users")}
              value={params.get("users") ?? ""}
              multiple
              options={users ?? []}
              onChange={(values) => setValues("users", values)}
            />
          </FilterGroup>
          <RadioFilter
            title={t("searchForm.filterHeading.language")}
            name="language"
            options={getResourceLanguages(t)}
            value={params.get("language")}
            onChange={(value) => setParams({ language: value })}
            collapsedCount={4}
          />
          <FilterGroup title={t("searchForm.filterHeading.license")}>
            <ObjectSelector
              name="license"
              placeholder={t("searchForm.types.license")}
              value={params.get("license") ?? ""}
              options={sortBy(licenses, (lic) => lic.name)}
              onChange={(values) => setValues("license", values)}
            />
          </FilterGroup>
          <FilterGroup title={t("searchForm.filterHeading.revision-date")}>
            <InlineDatePicker
              name="revision-date-from"
              onChange={(e) => setParams({ "revision-date-from": e.currentTarget.value })}
              placeholder={t("searchForm.types.revision-date-from")}
              value={params.get("revision-date-from") ?? ""}
            />
            <InlineDatePicker
              name="revision-date-to"
              onChange={(e) => setParams({ "revision-date-to": e.currentTarget.value })}
              placeholder={t("searchForm.types.revision-date-to")}
              value={params.get("revision-date-to") ?? ""}
            />
          </FilterGroup>
        </>
      }
    >
      <SearchHeader type="content" filters={filters} userData={userData}>
        <SearchFiltersToggle />
      </SearchHeader>
      <form
        onSubmit={(e) => {
          setParams({ query: queryInput });
          e.preventDefault();
        }}
      >
        <SearchQueryField value={queryInput} onChange={setQueryInput} placeholder={t("searchForm.types.contentQuery")}>
          <ObjectSelector
            name="query-fields"
            placeholder={t("searchForm.types.query-fields")}
            value={params.get("query-fields") ?? ""}
            multiple
            options={getQueryFieldOptions(t)}
            onChange={(value) => setParams({ "query-fields": value.join(",") })}
          />
        </SearchQueryField>
      </form>
      <SearchActiveFilters
        onReset={emptySearch}
        onRemoveTag={(name, index) => {
          const val = params.get(name)?.split(",");
          if (val && val.length > 1 && index != null) {
            setParams({
              [name]: val.filter((_, idx) => idx !== index).join(","),
            });
          } else {
            setParams({ [name]: null });
          }
        }}
        tags={filters}
      />
      {children}
    </SearchLayout>
  );
};

export default SearchContentForm;
