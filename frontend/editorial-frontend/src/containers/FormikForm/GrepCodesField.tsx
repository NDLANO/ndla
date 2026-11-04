/**
 * Copyright (c) 2020-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AlertLine, DeleteBinLine } from "@ndla/icons";
import { FieldHelper, FieldLabel, FieldRoot, IconButton, ListItemContent, ListItemRoot, Text } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import type { GrepResultDTO, GrepSearchResultsDTO } from "@ndla/types-backend/search-api";
import { useQuery } from "@tanstack/react-query";
import { useField } from "formik";
import { memo, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { GenericComboboxInput, GenericComboboxItemContent } from "../../components/abstractions/Combobox";
import { GenericSearchCombobox } from "../../components/Form/GenericSearchCombobox";
import type { GrepFormat } from "../../interfaces";
import { searchGrepCodes } from "../../modules/search/searchApi";
import { searchGrepCodesQueryOptions } from "../../modules/search/searchQueries";
import { isGrepCodeValid } from "../../util/articleUtil";
import handleError from "../../util/handleError";
import { usePaginatedQuery } from "../../util/usePaginatedQuery";
import { UnmatchedGoalIcon } from "./GrepCodesPanelTitle";
import { useCompetenceGoalTaxonomy } from "./useCompetenceGoalTaxonomy";

const StyledList = styled("ul", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "xsmall",
    listStyle: "none",
  },
});

const StyledAlertLine = styled(AlertLine, {
  base: {
    color: "[red]",
  },
});

const grepCodeTitle = (grepResult: GrepResultDTO, subjectNames: Map<string, string>) => {
  if (grepResult.typename === "GrepKompetansemaalDTO") {
    const subjectName = subjectNames.get(grepResult.kompetansemaalSett.code);
    if (subjectName) return `${grepResult.code} (${subjectName}) - ${grepResult.title.title}`;
  }
  const laereplan = "laereplan" in grepResult ? ` (${grepResult.laereplan.code})` : "";
  const kompetansesett = "kompetansemaalSett" in grepResult ? ` (${grepResult.kompetansemaalSett.code})` : "";
  return `${grepResult.code}${laereplan}${kompetansesett} - ${grepResult.title.title}`;
};

interface Props {
  prefixFilter: GrepFormat[];
  contentURI?: string;
  language?: string;
}

const GrepCodesField = ({ prefixFilter, contentURI, language }: Props) => {
  const { t } = useTranslation();
  const [field, meta, helpers] = useField<string[]>("grepCodes");
  const [highlightedValue, setHighligtedValue] = useState<string | null>(null);
  const nonNullPrefix = prefixFilter.map((f) => f.prefix).filter(Boolean);

  const { query, setQuery, page, setPage } = usePaginatedQuery();
  const grepCodesQuery = useQuery(
    searchGrepCodesQueryOptions({
      prefixFilter: prefixFilter.map((f) => f.prefix),
      query: query,
      page: page,
    }),
  );

  const [grepCodes, setGrepCodes] = useState<Record<string, GrepResultDTO>>({});
  const missingCodes = useMemo(() => field.value.filter((code) => !grepCodes[code]), [field.value, grepCodes]);

  const missingGrepCodesQuery = useQuery({
    ...searchGrepCodesQueryOptions({ codes: missingCodes, pageSize: missingCodes.length }),
    enabled: !!missingCodes.length,
  });

  const [prevMissingGrepCodes, setPrevMissingGrepCodes] = useState<GrepSearchResultsDTO>();

  if (missingGrepCodesQuery.data !== prevMissingGrepCodes) {
    setPrevMissingGrepCodes(missingGrepCodesQuery.data);
    const results = missingGrepCodesQuery.data?.results ?? [];
    if (results.length) {
      setGrepCodes((prev) => ({ ...prev, ...Object.fromEntries(results.map((result) => [result.code, result])) }));
    }
  }

  const { subjectNames, unmatchedGoals } = useCompetenceGoalTaxonomy({
    grepCodes: field.value,
    contentURI,
    language,
  });

  const fetchGrepCodeTitles = async (
    newGrepCodes: string[],
  ): Promise<{ success: GrepResultDTO[]; failed: string[] }> => {
    try {
      const withoutSavedAndInvalid = newGrepCodes.filter(
        (code) => !field.value.includes(code) && isGrepCodeValid(code, prefixFilter),
      );
      if (!withoutSavedAndInvalid.length) return { success: [], failed: [] };
      const grepCodesData = await searchGrepCodes({ codes: withoutSavedAndInvalid });

      const failedCodes = newGrepCodes.filter((code) => !grepCodesData.results.some((c) => c.code === code));

      return { success: grepCodesData.results, failed: failedCodes };
    } catch (e) {
      handleError(e);
      helpers.setError(t("errorMessage.genericError"));
      return { success: [], failed: [] };
    }
  };

  const updateGrepCodes = async (newValue: string) => {
    const delimitedValues = newValue.split(",");
    helpers.setError(undefined);

    const addedGrepCodes = delimitedValues.reduce<string[]>((acc, v) => {
      const trimmedValue = v.toUpperCase().trim();
      // Delete grep code
      if (field.value.includes(trimmedValue)) {
        helpers.setValue(field.value.filter((v) => v !== trimmedValue));
        return acc;
      }
      //Add grep code
      acc.push(trimmedValue);
      return acc;
    }, []);
    if (!addedGrepCodes.length) return;

    const grepCodesWithName = await fetchGrepCodeTitles(addedGrepCodes);

    setGrepCodes((prev) => ({
      ...prev,
      ...Object.fromEntries(grepCodesWithName.success.map((result) => [result.code, result])),
    }));
    helpers.setValue([...field.value, ...grepCodesWithName.success.map((v) => v.code)]);

    if (grepCodesWithName.failed.length) {
      setTimeout(() => {
        helpers.setError(`${t("errorMessage.grepCodes")}${grepCodesWithName.failed.join(", ")}`);
      }, 0);
    }
  };

  return (
    <FieldRoot>
      <FieldLabel>{t("form.grepCodes.label")}</FieldLabel>
      <FieldHelper>{t("form.grepCodes.description", { codes: nonNullPrefix.join(", ") })}</FieldHelper>
      <Text color="text.error" aria-live="polite">
        {meta.error}
      </Text>
      <GenericSearchCombobox
        items={grepCodesQuery.data?.results ?? []}
        itemToString={(item) => item.title.title}
        itemToValue={(item) => item.code}
        onHighlightChange={(details) => setHighligtedValue(details.highlightedValue)}
        paginationData={grepCodesQuery.data}
        isSuccess={grepCodesQuery.isSuccess}
        onPageChange={(details) => setPage(details.page)}
        inputValue={query}
        onInputValueChange={(details) => setQuery(details.inputValue)}
        onValueChange={(details) => {
          const newValue = details.value[0];
          if (!newValue) return;
          setQuery("");
          updateGrepCodes(newValue);
        }}
        value={field.value}
        renderItem={(item) => (
          <GenericComboboxItemContent
            title={grepCodeTitle(item, subjectNames)}
            child={item.status !== "Published" ? <StyledAlertLine title={t("form.grepCodes.expired")} /> : undefined}
          />
        )}
        closeOnSelect={false}
        selectionBehavior="preserve"
      >
        <GenericComboboxInput
          placeholder={t("form.grepCodes.placeholder")}
          isFetching={grepCodesQuery.isFetching}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !highlightedValue) {
              event.preventDefault();
              setQuery("");
              updateGrepCodes(event.currentTarget.value);
            }
          }}
          triggerable
        />
      </GenericSearchCombobox>
      <StyledList>
        {field.value.map((code) => (
          <ListItemRoot key={code} asChild consumeCss id="list-item">
            <li>
              <ListItemContent>{grepCodes[code] ? grepCodeTitle(grepCodes[code], subjectNames) : code}</ListItemContent>
              {unmatchedGoals.has(code) && (
                <UnmatchedGoalIcon aria-label={t("form.grepCodes.unmatched")} title={t("form.grepCodes.unmatched")} />
              )}
              {!!grepCodes[code] && grepCodes[code].status !== "Published" && (
                <StyledAlertLine title={t("form.grepCodes.expired")} />
              )}
              <IconButton
                variant="danger"
                size="small"
                aria-label={t("delete")}
                title={t("delete")}
                onClick={() => {
                  updateGrepCodes(code);
                }}
              >
                <DeleteBinLine />
              </IconButton>
            </li>
          </ListItemRoot>
        ))}
      </StyledList>
    </FieldRoot>
  );
};

export default memo(GrepCodesField);
