/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DragDropLine, FileTextLine, QuestionLine } from "@ndla/icons";
import { styled } from "@ndla/styled-system/jsx";

const IconWrapper = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: "0",
    marginInlineStart: "xxsmall",
    width: "xxlarge",
    height: "xxlarge",
    borderRadius: "xsmall",
  },
  variants: {
    variant: {
      question: {
        backgroundColor: "surface.brand.3",
      },
      dragAndDrop: {
        backgroundColor: "surface.brand.1.moderate",
      },
      document: {
        backgroundColor: "surface.brand.4.moderate",
      },
    },
  },
});

const icons = {
  question: QuestionLine,
  dragAndDrop: DragDropLine,
  document: FileTextLine,
};

interface Props {
  variant: keyof typeof icons;
}

export const QuizTypeIcon = ({ variant }: Props) => {
  const Icon = icons[variant];
  return (
    <IconWrapper variant={variant}>
      <Icon css={{ width: "xlarge", height: "xlarge" }} />
    </IconWrapper>
  );
};
