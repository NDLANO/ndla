/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { styled } from "@ndla/styled-system/jsx";
import { type ReactElement, useState } from "react";

const Wrapper = styled("span", {
  base: {
    position: "relative",
    display: "inline-flex",
  },
});

const Hat = styled("img", {
  base: {
    position: "absolute",
    top: "[-27px]",
    left: "[-8px]",
    maxWidth: "[none]",
    transform: "[rotate(12deg)]",
    pointerEvents: "none",
    tabletToDesktop: {
      display: "none",
    },
  },
});

interface Props {
  icon: ReactElement;
}

export const SantaHatIcon = ({ icon }: Props) => {
  const [isDecember] = useState(() => new Date().getMonth() === 11);

  if (!isDecember) return icon;

  return (
    <Wrapper>
      {icon}
      <Hat src="/static/santa-hat.svg" alt="" />
    </Wrapper>
  );
};
