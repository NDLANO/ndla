/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { tDynamic } from "@ndla/locales";
import { Button } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import SearchTagGroup from "../../../../components/Form/SearchTagGroup";
import { useStableSearchPageParams } from "../../useStableSearchPageParams";

const Wrapper = styled("div", {
  base: {
    display: "flex",
    gap: "3xsmall",
    alignItems: "center",
    flexWrap: "wrap",
  },
});

const getSortLabel = (sort: string, t: TFunction) => {
  const descending = sort.startsWith("-");
  const sortType = descending ? sort.slice(1) : sort;
  const order = t(descending ? "searchForm.desc" : "searchForm.asc").toLowerCase();
  return `${tDynamic(t, `searchForm.sort.${sortType}`)} (${order})`;
};

interface Props<Tags extends {}> {
  tags: Tags;
  onRemoveTag: (parameterName: keyof Tags, index: number | undefined) => void;
  onReset: () => void;
}

export const SearchActiveFilters = <Tags extends {}>({ tags, onRemoveTag, onReset }: Props<Tags>) => {
  const { t } = useTranslation();
  const [params, setParams] = useStableSearchPageParams();
  const sort = params.get("sort");

  const allTags = {
    ...tags,
    sort: sort ? getSortLabel(sort, t) : undefined,
    "page-size": params.get("page-size"),
  };

  const hasTags = Object.values(allTags).some((value) => (Array.isArray(value) ? value.length > 0 : !!value));
  if (!hasTags) return null;

  return (
    <Wrapper>
      <SearchTagGroup
        tags={allTags}
        onRemoveTag={(name, index) => {
          if (name === "sort" || name === "page-size") {
            setParams({ [name]: null });
          } else {
            onRemoveTag(name as keyof Tags, index);
          }
        }}
      />
      <Button variant="link" size="small" onClick={onReset}>
        {t("searchForm.empty")}
      </Button>
    </Wrapper>
  );
};
