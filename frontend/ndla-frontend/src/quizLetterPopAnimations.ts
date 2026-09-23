/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */


export const bounceEasing =
  "linear(0, 0.0328, 0.1177, 0.2359, 0.3715, 0.5117, 0.6464, 0.7686, 0.8739, 0.9601, 1.0267, 1.0745, 1.1054, 1.1218, 1.1263, 1.1218, 1.1108, 1.0958, 1.0786, 1.0609, 1.0439, 1.0286, 1.0154, 1.0046, 0.9963, 0.9904, 0.9866, 0.9846, 0.984, 0.9847, 0.9861, 0.988, 0.9902, 0.9924, 0.9945, 0.9965, 0.9981, 0.9995, 1.0005, 1.0012, 1.0017, 1.002, 1.002, 1.0019, 1.0017, 1.0015, 1.0012, 1.0009, 1.0007, 1.0004, 1.0002)";

type Step = readonly [percent: number, value: string, timingFunction?: string];

interface LetterPopSpec {
  id: string;
  opacity: readonly Step[];
  rotate: readonly Step[];
  translate: readonly Step[];
  scale: readonly Step[];
}

const buildTrack = (property: string, steps: readonly Step[]): Record<string, Record<string, string>> =>
  Object.fromEntries(
    steps.map(([percent, value, timingFunction]) => [
      `${percent}%`,
      { [property]: value, ...(timingFunction ? { animationTimingFunction: timingFunction } : {}) },
    ]),
  );

const letterPopKeyframes = (spec: LetterPopSpec) => ({
  [`letter-pop-${spec.id}-opacity`]: buildTrack("opacity", spec.opacity),
  [`letter-pop-${spec.id}-rotate`]: buildTrack("rotate", spec.rotate),
  [`letter-pop-${spec.id}-translate`]: buildTrack("translate", spec.translate),
  [`letter-pop-${spec.id}-scale`]: buildTrack("scale", spec.scale),
});

const letterPopAnimation = (id: string) => ({
  value: (["opacity", "rotate", "translate", "scale"] as const)
    .map((property) => `letter-pop-${id}-${property} 2000ms linear infinite`)
    .join(", "),
});


const KVISS_LETTERS: readonly LetterPopSpec[] = [
  {
    id: "kviss-1", // K
    opacity: [
      [0, "0"],
      [5, "0"],
      [10, "1"],
      [100, "1"],
    ],
    rotate: [
      [0, "0.262rad"],
      [5, "0.262rad", bounceEasing],
      [25, "0rad"],
      [100, "0rad"],
    ],
    translate: [
      [0, "0px 0px", "ease"],
      [35, "3px 8px", "cubic-bezier(0.45, 0, 0.15, 1)"],
      [55, "0px 0px"],
      [100, "0px 0px"],
    ],
    scale: [
      [0, "0 0"],
      [5, "0 0", bounceEasing],
      [25, "1 1"],
      [100, "1 1"],
    ],
  },
  {
    id: "kviss-2", // V
    opacity: [
      [0, "0"],
      [9, "0"],
      [14, "1"],
      [100, "1"],
    ],
    rotate: [
      [0, "0.262rad"],
      [9, "0.262rad", bounceEasing],
      [29, "0rad"],
      [100, "0rad"],
    ],
    translate: [
      [0, "0px 0px", "cubic-bezier(0.5, 0, 0.5, 1)"],
      [9, "24px -130px", "ease"],
      [44, "-3.6px 8px", "cubic-bezier(0.45, 0, 0.15, 1)"],
      [64, "0px 0px"],
      [100, "0px 0px"],
    ],
    scale: [
      [0, "0 0"],
      [9, "0 0", bounceEasing],
      [29, "1 1"],
      [100, "1 1"],
    ],
  },
  {
    id: "kviss-3", // I
    opacity: [
      [0, "0"],
      [13, "0"],
      [18, "1"],
      [100, "1"],
    ],
    rotate: [
      [0, "0.262rad"],
      [13, "0.262rad", bounceEasing],
      [33, "0rad"],
      [100, "0rad"],
    ],
    translate: [
      [0, "0px 0px", "cubic-bezier(0.5, 0, 0.5, 1)"],
      [18, "-16px -180px", "ease"],
      [53, "2.4px 8px", "cubic-bezier(0.45, 0, 0.15, 1)"],
      [73, "0px 0px"],
      [100, "0px 0px"],
    ],
    scale: [
      [0, "0 0"],
      [13, "0 0", bounceEasing],
      [33, "1 1"],
      [100, "1 1"],
    ],
  },
  {
    id: "kviss-4", // S1
    opacity: [
      [0, "0"],
      [17, "0"],
      [22, "1"],
      [100, "1"],
    ],
    rotate: [
      [0, "0.262rad"],
      [17, "0.262rad", bounceEasing],
      [37, "0rad"],
      [100, "0rad"],
    ],
    translate: [
      [0, "0px 0px", "cubic-bezier(0.5, 0, 0.5, 1)"],
      [27, "30px -140px", "ease"],
      [62, "-4.5px 8px", "cubic-bezier(0.45, 0, 0.15, 1)"],
      [82, "0px 0px"],
      [100, "0px 0px"],
    ],
    scale: [
      [0, "0 0"],
      [17, "0 0", bounceEasing],
      [37, "1 1"],
      [100, "1 1"],
    ],
  },
  {
    id: "kviss-5", // S2
    opacity: [
      [0, "0"],
      [21, "0"],
      [26, "1"],
      [100, "1"],
    ],
    rotate: [
      [0, "0.262rad"],
      [21, "0.262rad", bounceEasing],
      [41, "0rad"],
      [100, "0rad"],
    ],
    translate: [
      [0, "0px 0px", "cubic-bezier(0.5, 0, 0.5, 1)"],
      [36, "-10px -170px", "ease"],
      [71, "1.5px 8px", "cubic-bezier(0.45, 0, 0.15, 1)"],
      [91, "0px 0px"],
      [100, "0px 0px"],
    ],
    scale: [
      [0, "0 0"],
      [21, "0 0", bounceEasing],
      [41, "1 1"],
      [100, "1 1"],
    ],
  },
];

const VISSK_LETTERS: readonly LetterPopSpec[] = [
  {
    id: "vissk-5", // K
    opacity: [
      [0, "0"],
      [21, "0"],
      [26, "1"],
      [100, "1"],
    ],
    rotate: [
      [0, "0.262rad"],
      [21, "0.262rad", bounceEasing],
      [41, "0rad", "cubic-bezier(0.5, 0, 0.5, 1)"],
      [90.5, "0.281rad"],
      [100, "0.281rad"],
    ],
    translate: [
      [0, "0px 0px", "cubic-bezier(0.5, 0, 0.5, 1)"],
      [36, "-10px -170px", "ease"],
      [71, "1.5px 8px", "cubic-bezier(0.45, 0, 0.15, 1)"],
      [91, "0px 0px"],
      [100, "0px 0px"],
    ],
    scale: [
      [0, "0 0"],
      [21, "0 0", bounceEasing],
      [41, "1 1"],
      [100, "1 1"],
    ],
  },
];

const ALL_LETTER_SPECS: readonly LetterPopSpec[] = [...KVISS_LETTERS, ...VISSK_LETTERS];

export const quizLetterPopKeyframes = Object.assign({}, ...ALL_LETTER_SPECS.map(letterPopKeyframes));

export const quizLetterPopAnimations = Object.fromEntries(
  ALL_LETTER_SPECS.map((spec) => [`letter-pop-${spec.id}`, letterPopAnimation(spec.id)]),
);
