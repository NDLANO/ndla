/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createListCollection } from "@ark-ui/react/collection";
import { ComboboxContent, ComboboxItem, ComboboxItemText, ComboboxLabel, ComboboxRoot, Text } from "@ndla/primitives";
import { useComboboxTranslations } from "@ndla/ui";
import { uniq } from "@ndla/util";
import { useId, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { GenericComboboxInput, GenericComboboxItemIndicator } from "../../../../components/abstractions/Combobox";
import type { SelectOption } from "../../../../components/ObjectSelector";
import { FilterCheckboxGroup } from "./CheckboxFilter";
import { FilterGroup } from "./FilterGroup";

const positioning = { sameWidth: true, strategy: "fixed" } as const;

interface Props {
  title: string;
  name: string;
  placeholder: string;
  options: SelectOption[];
  pinnedOptions?: SelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  children?: ReactNode;
}

export const SearchableCheckboxFilter = ({
  title,
  name,
  placeholder,
  options,
  pinnedOptions = [],
  value,
  onChange,
  children,
}: Props) => {
  const { t } = useTranslation();
  const headingId = useId();
  const comboboxTranslations = useComboboxTranslations();
  const [query, setQuery] = useState("");
  const [touchedIds, setTouchedIds] = useState<string[]>([]);

  const collection = useMemo(() => {
    const lowerCaseQuery = query.toLowerCase();
    return createListCollection({
      items: options.filter((option) => option.name.toLowerCase().includes(lowerCaseQuery)),
      itemToValue: (option) => option.id,
      itemToString: (option) => option.name,
      isItemDisabled: (option) => !!option.disabled,
    });
  }, [options, query]);

  const pickedOptions = options.filter((option) => value.includes(option.id) || touchedIds.includes(option.id));

  const handleChange = (newValue: string[]) => {
    setTouchedIds((prev) => uniq([...prev, ...value, ...newValue]));
    onChange(newValue);
  };

  return (
    <FilterGroup title={title} name={name} headingId={headingId} activeCount={value.length}>
      {!!pinnedOptions.length && (
        <FilterCheckboxGroup options={pinnedOptions} value={value} onChange={handleChange} labelledBy={headingId} />
      )}
      <ComboboxRoot
        collection={collection}
        translations={comboboxTranslations}
        multiple
        closeOnSelect
        value={value}
        onValueChange={(details) => handleChange(details.value)}
        inputValue={query}
        onInputValueChange={(details) => setQuery(details.inputValue)}
        positioning={positioning}
      >
        <ComboboxLabel srOnly>{placeholder}</ComboboxLabel>
        <GenericComboboxInput triggerable componentSize="small" placeholder={placeholder} />
        <ComboboxContent>
          {collection.items.length ? (
            collection.items.map((option) => (
              <ComboboxItem key={option.id} item={option}>
                <ComboboxItemText>{option.name}</ComboboxItemText>
                <GenericComboboxItemIndicator />
              </ComboboxItem>
            ))
          ) : (
            <Text>{t("form.responsible.noResults")}</Text>
          )}
        </ComboboxContent>
      </ComboboxRoot>
      {!!pickedOptions.length && (
        <FilterCheckboxGroup options={pickedOptions} value={value} onChange={handleChange} labelledBy={headingId} />
      )}
      {children}
    </FilterGroup>
  );
};
