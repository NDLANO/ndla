/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SortSelect, type SortOption } from "../../components/SortSelect";

export const QUIZ_SORT_LAST_ADDED = "-created";
const QUIZ_SORT_FIRST_ADDED = "created";

export type QuizSort = typeof QUIZ_SORT_LAST_ADDED | typeof QUIZ_SORT_FIRST_ADDED;

export const parseQuizSort = (value: string | null): QuizSort =>
  value === QUIZ_SORT_FIRST_ADDED ? QUIZ_SORT_FIRST_ADDED : QUIZ_SORT_LAST_ADDED;

interface Props {
  value: QuizSort;
  onChange: (value: QuizSort) => void;
}

export const QuizSortSelect = ({ value, onChange }: Props) => {
  const { t } = useTranslation();

  const options: SortOption<QuizSort>[] = useMemo(
    () => [
      { value: QUIZ_SORT_LAST_ADDED, label: t("myNdla.sort.lastAdded") },
      { value: QUIZ_SORT_FIRST_ADDED, label: t("myNdla.sort.firstAdded") },
    ],
    [t],
  );

  return <SortSelect value={value} options={options} onValueChange={onChange} />;
};
