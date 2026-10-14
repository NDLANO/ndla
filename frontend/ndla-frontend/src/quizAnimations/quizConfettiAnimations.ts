/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { buildTrack, type Step } from "./quizLetterPopAnimations";

const FALL_EASING = "cubic-bezier(0.22, 0, 0.36, 1)";
const FADE_IN = 7.5;
const SETTLE = 15;
// After landing, every piece slides back a little: x by 10 %, y by 2px and rotation by 15 %
const SETTLE_X = 0.9;
const SETTLE_Y = 2;
const SETTLE_ROTATE = 0.85;

export type ConfettiShape = "rectangle" | "circle";
export type ConfettiColor = "pink" | "purple" | "green" | "yellow";

export interface ConfettiSpec {
  id: string;
  shape: ConfettiShape;
  color: ConfettiColor;
  // Position and size in the 744x446 design frame. Rectangles rotate around their top left corner, like in the SVG.
  left: number;
  top: number;
  width: number;
  height: number;
  // Percent of the 2s timeline where the piece starts fading in and falling
  start: number;
  // Percent of the 2s timeline where the fall ends
  land: number;
  startY: number;
  to: readonly [x: number, y: number];
  rotate: readonly [from: number, to: number];
  fadeOut?: boolean;
}

const round = (value: number) => Math.round(value * 1000) / 1000;

const confettiKeyframes = ({ id, start, land, startY, to: [x, y], rotate: [r0, r1], fadeOut }: ConfettiSpec) => {
  const settled = round(land + SETTLE);
  const visible = round(start + FADE_IN);
  const rotateEnd = `${round(r0 + (r1 - r0) * SETTLE_ROTATE)}rad`;
  const translateEnd = `${round(x * SETTLE_X)}px ${round(y - SETTLE_Y)}px`;

  const opacity: readonly Step[] = fadeOut
    ? [
        [0, "0"],
        [start, "0", "ease-out"],
        [visible, "1", "ease-in-out"],
        [land, "0.7", "ease-in-out"],
        [settled, "0"],
        [100, "0"],
      ]
    : [
        [0, "0"],
        [start, "0", "ease-out"],
        [visible, "1"],
        [100, "1"],
      ];

  return {
    [`confetti-${id}-opacity`]: buildTrack("opacity", opacity),
    [`confetti-${id}-rotate`]: buildTrack("rotate", [
      [0, `${r0}rad`],
      [start, `${r0}rad`, "ease-in-out"],
      [land, `${r1}rad`, "ease-out"],
      [settled, rotateEnd],
      [100, rotateEnd],
    ]),
    [`confetti-${id}-translate`]: buildTrack("translate", [
      [0, `0px ${startY}px`],
      [start, `0px ${startY}px`, FALL_EASING],
      [land, `${x}px ${y}px`, "ease-out"],
      [settled, translateEnd],
      [100, translateEnd],
    ]),
  };
};

export const CONFETTI_FRAME = { width: 744, height: 446 };

export const CONFETTI_SPECS: readonly ConfettiSpec[] = [
  // prettier-ignore
  { id: "pink-1", shape: "rectangle", color: "pink", left: 124, top: 31, width: 9, height: 14, start: 14.706, land: 81.176, startY: -122.353, to: [-15.294, 7.647], rotate: [0.698, 0.518] },
  // prettier-ignore
  { id: "pink-2", shape: "rectangle", color: "pink", left: 97, top: 144, width: 9, height: 14, start: 4.412, land: 58.529, startY: -192.941, to: [8.235, 16.471], rotate: [0.698, 1.022], fadeOut: true },
  // prettier-ignore
  { id: "pink-3", shape: "rectangle", color: "pink", left: 90, top: 280, width: 7, height: 11, start: 5.882, land: 61.765, startY: -80, to: [10.588, 17.353], rotate: [1.396, 1.648], fadeOut: true },
  // prettier-ignore
  { id: "pink-4", shape: "rectangle", color: "pink", left: 680, top: 70, width: 12, height: 18, start: 1.471, land: 52.059, startY: -178.824, to: [3.529, 14.706], rotate: [-0.785, -0.318] },
  // prettier-ignore
  { id: "purple-1", shape: "rectangle", color: "purple", left: 50, top: 60, width: 10, height: 15, start: 0, land: 48.824, startY: -171.765, to: [1.176, 13.824], rotate: [0.785, 1.324] },
  // prettier-ignore
  { id: "purple-2", shape: "rectangle", color: "purple", left: 620, top: 130, width: 8, height: 12, start: 11.765, land: 74.706, startY: -108.235, to: [-20, 5.882], rotate: [0.611, 0.575], fadeOut: true },
  // prettier-ignore
  { id: "purple-3", shape: "rectangle", color: "purple", left: 640, top: 330, width: 11, height: 17, start: 2.941, land: 55.294, startY: -185.882, to: [5.882, 15.588], rotate: [1.047, 1.442], fadeOut: true },
  // prettier-ignore
  { id: "green-1", shape: "rectangle", color: "green", left: 140, top: 90, width: 9, height: 14, start: 16.176, land: 84.412, startY: -129.412, to: [-12.941, 8.529], rotate: [1.92, 1.668] },
  // prettier-ignore
  { id: "green-2", shape: "rectangle", color: "green", left: 40, top: 200, width: 12, height: 18, start: 20.588, land: 64.118, startY: -150.588, to: [-5.882, 11.176], rotate: [-0.524, -0.991] },
  // prettier-ignore
  { id: "green-3", shape: "rectangle", color: "green", left: 586.59, top: 47.303, width: 8, height: 12, start: 0, land: 48.824, startY: -171.765, to: [1.176, 13.824], rotate: [-0.748, -0.209] },
  // prettier-ignore
  { id: "green-4", shape: "rectangle", color: "green", left: 707, top: 154.879, width: 8, height: 12, start: 10.294, land: 71.471, startY: -101.176, to: [17.647, 5], rotate: [-1.396, -1.36], fadeOut: true },
  // prettier-ignore
  { id: "green-5", shape: "rectangle", color: "green", left: 600, top: 270, width: 7, height: 11, start: 17.647, land: 57.647, startY: -136.471, to: [-10.588, 9.412], rotate: [-0.262, -0.585] },
  // prettier-ignore
  { id: "yellow-1", shape: "circle", color: "yellow", left: 74, top: 46, width: 6, height: 6, start: 13.235, land: 77.941, startY: -115.294, to: [-17.647, 6.765], rotate: [0, -0.108], fadeOut: true },
  // prettier-ignore
  { id: "yellow-2", shape: "circle", color: "yellow", left: 163, top: 51, width: 6, height: 6, start: 19.118, land: 60.882, startY: -143.529, to: [-8.235, 10.294], rotate: [0, -0.395] },
  // prettier-ignore
  { id: "yellow-3", shape: "circle", color: "yellow", left: 80, top: 120, width: 8, height: 8, start: 10.294, land: 71.471, startY: -101.176, to: [17.647, 5], rotate: [0, 0.036], fadeOut: true },
  // prettier-ignore
  { id: "yellow-4", shape: "circle", color: "yellow", left: 22, top: 278, width: 6, height: 6, start: 23.529, land: 70.588, startY: -164.706, to: [-1.176, 12.941], rotate: [0, 0.611] },
  // prettier-ignore
  { id: "yellow-5", shape: "circle", color: "yellow", left: 640, top: 67, width: 10, height: 10, start: 7.353, land: 65, startY: -87.059, to: [12.941, 18.235], rotate: [0, 0.18], fadeOut: true },
  // prettier-ignore
  { id: "yellow-6", shape: "circle", color: "yellow", left: 660, top: 220, width: 10, height: 10, start: 22.059, land: 67.353, startY: -157.647, to: [-3.529, 12.059], rotate: [0, -0.539] },
  // prettier-ignore
  { id: "yellow-7", shape: "circle", color: "yellow", left: 701, top: 327, width: 6, height: 6, start: 8.824, land: 68.235, startY: -94.118, to: [15.294, 19.118], rotate: [0, 0.108], fadeOut: true },
];

export const quizConfettiKeyframes = Object.assign({}, ...CONFETTI_SPECS.map(confettiKeyframes));

// Same 2s loop as the HURRA letters so the two stay in sync
export const confettiAnimation = (id: string) =>
  (["opacity", "rotate", "translate"] as const)
    .map((property) => `confetti-${id}-${property} 2000ms linear forwards`)
    .join(", ");
