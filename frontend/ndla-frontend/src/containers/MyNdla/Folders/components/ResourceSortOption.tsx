/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useStableSearchParams } from "../../../../util/useStableSearchParams";
import { SortSelect, type SortOption } from "../../components/SortSelect";
import {
  parseResourceSort,
  type ResourceSort,
  SORT_CONTENT_TYPE,
  SORT_LAST_ADDED,
  SORT_NAME_ASC,
  SORT_NAME_DESC,
} from "../util";

export const ResourceSortOption = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useStableSearchParams();
  const sort = parseResourceSort(searchParams.get("sort"));

  const options: SortOption<ResourceSort>[] = useMemo(
    () => [
      { value: SORT_LAST_ADDED, label: t("myNdla.sort.lastAdded") },
      { value: SORT_NAME_ASC, label: t("myNdla.sort.nameAsc") },
      { value: SORT_NAME_DESC, label: t("myNdla.sort.nameDesc") },
      { value: SORT_CONTENT_TYPE, label: t("myNdla.sort.contentType") },
    ],
    [t],
  );

  return (
    <SortSelect
      value={sort}
      options={options}
      onValueChange={(value) =>
        setSearchParams({ sort: value === SORT_LAST_ADDED ? null : value, page: null }, { preventScrollReset: true })
      }
    />
  );
};
