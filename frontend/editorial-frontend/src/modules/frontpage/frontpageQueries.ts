/**
 * Copyright (c) 2023-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { queryOptions } from "@tanstack/react-query";
import type { LocaleType } from "../../interfaces";
import { FRONTPAGE, SUBJECTPAGE } from "../../queryKeys";
import { fetchFrontpage, fetchSubjectpage } from "./frontpageApi";

interface UseSubjectpageParams {
  id: number;
  language: LocaleType;
}

export const frontpageQueryKeys = {
  frontpage: [FRONTPAGE] as const,
  subjectpage: (params?: Partial<UseSubjectpageParams>) => [SUBJECTPAGE, params] as const,
};

export const frontpageQueryOptions = () => {
  return queryOptions({ queryKey: frontpageQueryKeys.frontpage, queryFn: () => fetchFrontpage() });
};

export const subjectpageQueryOptions = (params: UseSubjectpageParams) => {
  return queryOptions({
    queryKey: frontpageQueryKeys.subjectpage(params),
    queryFn: () => fetchSubjectpage(params.id, params.language),
  });
};
