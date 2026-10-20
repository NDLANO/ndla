/**
 * Copyright (c) 2022-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Draggable } from "@ndla/icons";
import { IconButton, type IconButtonProps } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import type { Ref } from "react";
import { useTranslation } from "react-i18next";

interface Props extends Omit<IconButtonProps, "type"> {
  type: "learningpathstep" | "quizquestion" | "quizalternative";
  name: string;
  ref?: Ref<HTMLButtonElement>;
}

const StyledDragHandle = styled(IconButton, {
  base: {
    touchAction: "none",
    _disabled: {
      display: "none",
    },
    tabletDown: {
      display: "none",
    },
  },
});

export const DragHandle = ({ type, name, ...rest }: Props) => {
  const { t } = useTranslation();
  return (
    <StyledDragHandle
      tabIndex={0}
      {...rest}
      aria-label={t(`myNdla.${type}.dragHandle`, { name })}
      type={"button"}
      variant="clear"
    >
      <Draggable />
    </StyledDragHandle>
  );
};
