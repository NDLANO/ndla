/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { styled } from "@ndla/styled-system/jsx";

type LetterAnim = "pop-1" | "pop-2" | "pop-3" | "pop-4" | "pop-5" | "pop-6" | "pop-7" | "pop-8";

interface Letter {
  char: string;
  anim: LetterAnim;
  accent?: "kviss" | "vissk" | "hurra";
}

const KVISS_LETTERS: readonly Letter[] = [
  { char: "K", anim: "pop-1", accent: "kviss" },
  { char: "V", anim: "pop-2" },
  { char: "I", anim: "pop-3" },
  { char: "S", anim: "pop-4" },
  { char: "S", anim: "pop-5" },
];

const VISSK_LETTERS: readonly Letter[] = [
  { char: "V", anim: "pop-1" },
  { char: "I", anim: "pop-2" },
  { char: "S", anim: "pop-3" },
  { char: "S", anim: "pop-4" },
  { char: "K", anim: "pop-6", accent: "vissk" },
];

const HURRA_LETTERS: readonly Letter[] = [
  { char: "H", anim: "pop-7", accent: "hurra" },
  { char: "U", anim: "pop-2" },
  { char: "R", anim: "pop-3" },
  { char: "R", anim: "pop-4" },
  { char: "A", anim: "pop-5" },
  { char: "!", anim: "pop-8" },
];

const Wrapper = styled("div", { base: { display: "flex" } });

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
    _motionReduce: { animation: "none" },
  },
  variants: {
    accent: {
      kviss: { backgroundColor: "surface.brand.1" },
      vissk: { backgroundColor: "surface.brand.5" },
      hurra: { backgroundColor: "surface.brand.3" },
    },
    anim: {
      "pop-1": { animation: "letter-pop-1" },
      "pop-2": { animation: "letter-pop-2" },
      "pop-3": { animation: "letter-pop-3" },
      "pop-4": { animation: "letter-pop-4" },
      "pop-5": { animation: "letter-pop-5" },
      "pop-6": { animation: "letter-pop-6" },
      "pop-7": { animation: "letter-pop-7" },
      "pop-8": { animation: "letter-pop-8" },
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
export const HurraAnimation = () => <LetterPopReveal letters={HURRA_LETTERS} />;
