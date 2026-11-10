/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ErrorWarningFill } from "@ndla/icons";
import { styled } from "@ndla/styled-system/jsx";

export const CompetenceGoalWarningIcon = styled(ErrorWarningFill, {
  base: {
    color: "icon.warning",
    flexShrink: "0",
  },
});
