/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const internalSymbols = [
  { name: "half", text: "½" },
  { name: "oneQuarter", text: "¼" },
  { name: "threeQuarters", text: "¾" },
  { name: "squared", text: "²" },
  { name: "cubed", text: "³" },
  { name: "copyright", text: "©" },
  { name: "trademark", text: "™" },
  { name: "degrees", text: "°" },
  { name: "yen", text: "¥" },
  { name: "nonBreakingHyphen", text: "‑" },
  { name: "enDash", text: "–" },
  { name: "nonBreakingSpace", text: " ", icon: "␣" },
  { name: "paragraph", text: "§" },
  { name: "invertedQuestionMark", text: "¿" },
  { name: "alpha", text: "α" },
  { name: "beta", text: "β" },
  { name: "gamma", text: "γ" },
  { name: "plusMinus", text: "±" },
  { name: "rightArrow", text: "→" },
  { name: "unknown", text: "�", hidden: true },
] as const;

type SymbolName = (typeof internalSymbols)[number]["name"];
export type SymbolData = { name: SymbolName; text: string; hidden?: boolean; icon?: string };
export const symbols: readonly SymbolData[] = internalSymbols;
