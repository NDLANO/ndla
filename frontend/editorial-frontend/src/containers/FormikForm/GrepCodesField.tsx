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
import type { GrepResultDTO } from "@ndla/types-backend/search-api";
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

const grepCodeTitle = (grepResult: GrepResultDTO) => {
  const laereplan = "laereplan" in grepResult ? ` (${grepResult.laereplan.code})` : "";
  const kompetansesett = "kompetansemaalSett" in grepResult ? ` (${grepResult.kompetansemaalSett.code})` : "";
  return `${grepResult.code}${laereplan}${kompetansesett} - ${grepResult.title.title}`;
};

interface GrepCodeSuccess {
  code: string;
  title: string;
  isExpired: boolean;
  status: "success";
}
interface GrepCodeError {
  code: string;
  status: "error";
}
interface GrepObject {
  title: string;
  isExpired: boolean;
}

interface Props {
  prefixFilter: GrepFormat[];
}

const GrepCodesField = ({ prefixFilter }: Props) => {
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

  const [grepCodes, setGrepCodes] = useState<Record<string, GrepObject>>({});
  const missingCodes = useMemo(() => field.value.filter((code) => !grepCodes[code]), [field.value, grepCodes]);

  const missingGrepCodesQuery = useQuery({
    ...searchGrepCodesQueryOptions({ codes: missingCodes, pageSize: missingCodes.length }),
    enabled: !!missingCodes.length,
  });

  const [prevMissingGrepCodes, setPrevMissingGrepCodes] = useState(missingGrepCodesQuery.data);

  if (missingGrepCodesQuery.data !== prevMissingGrepCodes) {
    setPrevMissingGrepCodes(missingGrepCodesQuery.data);
    const results = missingGrepCodesQuery.data?.results ?? [];
    if (results.length) {
      setGrepCodes((prev) =>
        results.reduce<Record<string, GrepObject>>(
          (acc, grepCode) => {
            acc[grepCode.code] = { title: grepCodeTitle(grepCode), isExpired: grepCode.status !== "Published" };
            return acc;
          },
          { ...prev },
        ),
      );
    }
  }

  const fetchGrepCodeTitles = async (
    newGrepCodes: string[],
  ): Promise<{ success: GrepCodeSuccess[]; failed: GrepCodeError[] }> => {
    try {
      const withoutSavedAndInvalid = newGrepCodes.filter(
        (code) => !field.value.includes(code) && isGrepCodeValid(code, prefixFilter),
      );
      if (!withoutSavedAndInvalid.length) return { success: [], failed: [] };
      const grepCodesData = await searchGrepCodes({ codes: withoutSavedAndInvalid });

      const codes = grepCodesData.results.map((grepCode) => {
        return {
          code: grepCode.code,
          title: grepCodeTitle(grepCode),
          isExpired: grepCode.status !== "Published",
          status: "success",
        } as const;
      });

      const failedCodes = newGrepCodes
        .filter((code) => !codes.some((c) => c?.code === code))
        .map((code) => ({ code: code, status: "error" }) as const);

      return { success: codes, failed: failedCodes };
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

    setGrepCodes((prev) =>
      grepCodesWithName.success.reduce<Record<string, GrepObject>>(
        (acc, v) => {
          acc[v.code] = { title: v.title, isExpired: v.isExpired };
          return acc;
        },
        { ...prev },
      ),
    );
    helpers.setValue([...field.value, ...grepCodesWithName.success.map((v) => v.code)]);

    if (grepCodesWithName.failed.length) {
      setTimeout(() => {
        helpers.setError(`${t("errorMessage.grepCodes")}${grepCodesWithName.failed.map((e) => e.code).join(", ")}`);
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
            title={grepCodeTitle(item)}
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
              <ListItemContent>{grepCodes[code]?.title ?? code}</ListItemContent>
              {grepCodes[code]?.isExpired ? <StyledAlertLine title={t("form.grepCodes.expired")} /> : undefined}
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
