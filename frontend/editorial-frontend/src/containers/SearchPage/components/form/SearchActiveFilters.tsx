/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Button } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
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

interface Props<Tags extends {}> {
  tags: Tags;
  onRemoveTag: (parameterName: keyof Tags, index: number | undefined) => void;
  onReset: () => void;
}

export const SearchActiveFilters = <Tags extends {}>({ tags, onRemoveTag, onReset }: Props<Tags>) => {
  const { t } = useTranslation();
  const [params] = useStableSearchPageParams();

  if (!params.size) return null;

  return (
    <Wrapper>
      <SearchTagGroup tags={tags} onRemoveTag={onRemoveTag} />
      <Button variant="link" size="small" onClick={onReset}>
        {t("searchForm.empty")}
      </Button>
    </Wrapper>
  );
};
