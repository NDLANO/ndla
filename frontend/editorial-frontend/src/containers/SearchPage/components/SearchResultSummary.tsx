/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Text } from "@ndla/primitives";
import { Trans } from "react-i18next";

interface Props {
  totalCount: number | undefined;
  page: number | undefined;
  pageSize: number | undefined;
  query: string | null | undefined;
}

export const SearchResultSummary = ({ totalCount = 0, page = 1, pageSize = 0, query }: Props) => {
  const from = totalCount ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(page * pageSize, totalCount);
  return (
    <Text textStyle="label.small" data-testid="totalCount" aria-live="polite">
      <Trans
        i18nKey={query ? "searchPage.resultSummaryWithQuery" : "searchPage.resultSummary"}
        values={{ from, to, count: totalCount, query }}
        components={{ count: <span data-testid="searchTotalCount" /> }}
      />
    </Text>
  );
};
