/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { styled } from "@ndla/styled-system/jsx";

type LetterAnim = "kviss-1" | "kviss-2" | "kviss-3" | "kviss-4" | "kviss-5" | "vissk-5";

interface Letter {
  char: string;
  anim: LetterAnim;
  accent?: "primary" | "secondary";
}

const KVISS_LETTERS: readonly Letter[] = [
  { char: "K", anim: "kviss-1", accent: "primary" },
  { char: "V", anim: "kviss-2" },
  { char: "I", anim: "kviss-3" },
  { char: "S", anim: "kviss-4" },
  { char: "S", anim: "kviss-5" },
];

const VISSK_LETTERS: readonly Letter[] = [
  { char: "V", anim: "kviss-1" },
  { char: "I", anim: "kviss-2" },
  { char: "S", anim: "kviss-3" },
  { char: "S", anim: "kviss-4" },
  { char: "K", anim: "vissk-5", accent: "secondary" },
];

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
      primary: {
        backgroundColor: "surface.brand.1",
      },
      secondary: {
        backgroundColor: "surface.brand.5",
      },
    },
    anim: {
      "kviss-1": { animation: "letter-pop-kviss-1" },
      "kviss-2": { animation: "letter-pop-kviss-2" },
      "kviss-3": { animation: "letter-pop-kviss-3" },
      "kviss-4": { animation: "letter-pop-kviss-4" },
      "kviss-5": { animation: "letter-pop-kviss-5" },
      "vissk-5": { animation: "letter-pop-vissk-5" },
    },
  },
});

const LetterPopReveal = ({ letters }: { letters: readonly Letter[] }) => (
  <Wrapper aria-hidden="true">
    {letters.map(({ char, anim, accent }, index) => (
      <LetterTile key={index} accent={accent} anim={anim}>
        {char}
      </LetterTile>
    ))}
  </Wrapper>
);

export const KvissAnimation = () => <LetterPopReveal letters={KVISS_LETTERS} />;
export const VisskAnimation = () => <LetterPopReveal letters={VISSK_LETTERS} />;
