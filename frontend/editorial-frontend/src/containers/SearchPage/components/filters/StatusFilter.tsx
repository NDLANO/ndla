/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Text } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import type { SelectOption } from "../../../../components/ObjectSelector";
import { FilterCheckboxGroup } from "./CheckboxFilter";
import { FilterGroup } from "./FilterGroup";
import { FilterRadioGroup } from "./RadioFilter";

const PublishedVersionWrapper = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "xxsmall",
    paddingBlockStart: "xsmall",
    borderBlockStart: "1px solid",
    borderColor: "stroke.subtle",
  },
});

interface Props {
  title: string;
  name: string;
  options: SelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  publishedVersionOptions: SelectOption[];
  publishedVersion: string | null | undefined;
  onPublishedVersionChange: (value: string | null) => void;
}

export const StatusFilter = ({
  title,
  name,
  options,
  value,
  onChange,
  publishedVersionOptions,
  publishedVersion,
  onPublishedVersionChange,
}: Props) => {
  const { t } = useTranslation();
  const headingId = useId();
  const publishedVersionLabelId = useId();

  return (
    <FilterGroup
      title={title}
      name={name}
      headingId={headingId}
      activeCount={value.length + (publishedVersion ? 1 : 0)}
    >
      <FilterCheckboxGroup options={options} value={value} onChange={onChange} labelledBy={headingId} />
      <PublishedVersionWrapper>
        <Text id={publishedVersionLabelId} textStyle="label.small">
          {t("searchForm.publishedVersion.label")}
        </Text>
        <FilterRadioGroup
          orientation="horizontal"
          options={publishedVersionOptions}
          value={publishedVersion}
          onChange={onPublishedVersionChange}
          labelledBy={publishedVersionLabelId}
        />
      </PublishedVersionWrapper>
    </FilterGroup>
  );
};
