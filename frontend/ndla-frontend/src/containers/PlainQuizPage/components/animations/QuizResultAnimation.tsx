/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { styled } from "@ndla/styled-system/jsx";

const KVISS_LETTERS = [
  { char: "K", anim: "kviss-1" },
  { char: "V", anim: "kviss-2" },
  { char: "I", anim: "kviss-3" },
  { char: "S", anim: "kviss-4" },
  { char: "S", anim: "kviss-5" },
] as const;

const Wrapper = styled("div", {
  base: {
    display: "flex",
  },
});

const LetterTile = styled("span", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "xxlarge",
    height: "xxlarge",
    borderRadius: "small",
    borderWidth: "4px",
    borderStyle: "solid",
    borderColor: "stroke.default",
    backgroundColor: "background.default",
    fontSize: "28px",
    lineHeight: "3xlarge",
    fontWeight: "bold",
    textAlign: "center",
    color: "text.strong",
    transformOrigin: "50% 50%",
    _motionReduce: {
      animation: "none",
    },
  },
  variants: {
    accent: {
      true: {
        backgroundColor: "surface.brand.1",
      },
    },
    anim: {
      "kviss-1": { animation: "letter-pop-kviss-1" },
      "kviss-2": { animation: "letter-pop-kviss-2" },
      "kviss-3": { animation: "letter-pop-kviss-3" },
      "kviss-4": { animation: "letter-pop-kviss-4" },
      "kviss-5": { animation: "letter-pop-kviss-5" },
    },
  },
});

export const GoodJobAnimation = () => (
  <Wrapper aria-hidden="true">
    {KVISS_LETTERS.map(({ char, anim }, index) => (
      <LetterTile key={index} accent={index === 0} anim={anim}>
        {char}
      </LetterTile>
    ))}
  </Wrapper>
);
