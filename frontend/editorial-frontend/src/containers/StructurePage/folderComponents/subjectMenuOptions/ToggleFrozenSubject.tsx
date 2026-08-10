/**
 * Copyright (c) 2021-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DeleteBinLine } from "@ndla/icons";
import { IconButton, SwitchControl, SwitchHiddenInput, SwitchLabel, SwitchRoot, SwitchThumb } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import { useTranslation } from "react-i18next";
import { TAXONOMY_CUSTOM_FIELD_FROZEN_SUBJECT } from "../../../../constants";

interface Props {
  customFields: Record<string, string>;
  updateFields: (newFields: Record<string, string>) => void;
}

const SwitchWrapper = styled("div", {
  base: {
    display: "flex",
    gap: "3xsmall",
    alignSelf: "flex-end",
  },
});

const ToggleFrozenSubject = ({ customFields, updateFields }: Props) => {
  const { t } = useTranslation();
  const isToggled = customFields[TAXONOMY_CUSTOM_FIELD_FROZEN_SUBJECT]?.toLowerCase() === "true";

  return (
    <SwitchWrapper>
      <SwitchRoot
        checked={isToggled}
        onCheckedChange={(details) =>
          updateFields({ ...customFields, [TAXONOMY_CUSTOM_FIELD_FROZEN_SUBJECT]: details.checked.toString() })
        }
      >
        <SwitchLabel>{t("taxonomy.metadata.customFields.frozenSubject")}</SwitchLabel>
        <SwitchControl>
          <SwitchThumb />
        </SwitchControl>
        <SwitchHiddenInput />
      </SwitchRoot>
      <IconButton
        variant="danger"
        size="small"
        onClick={() => {
          delete customFields[TAXONOMY_CUSTOM_FIELD_FROZEN_SUBJECT];
          updateFields({ ...customFields });
        }}
      >
        <DeleteBinLine />
      </IconButton>
    </SwitchWrapper>
  );
};

export default ToggleFrozenSubject;
