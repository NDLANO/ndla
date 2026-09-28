/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { expect, test } from "vitest";
import { creditLine, shortCredit } from "../format/credits";

const copyright = {
  license: { license: "CC-BY-NC-4.0", url: "https://creativecommons.org/licenses/by-nc/4.0/" },
  creators: [
    { type: "writer", name: "Kari" },
    { type: "photographer", name: "Kari" },
    { type: "writer", name: " Ola " },
  ],
  rightsholders: [{ type: "supplier", name: "NTB" }],
};

test("creditLine includes license, unique creators, rightsholders and source", () => {
  expect(creditLine({ copyright, source: "https://ndla.no/article/1" })).toBe(
    "License: CC-BY-NC-4.0 (https://creativecommons.org/licenses/by-nc/4.0/) · Creators: Kari, Ola · Rightsholders: NTB · Source: https://ndla.no/article/1",
  );
});

test("creditLine falls back to a bare license code", () => {
  expect(creditLine({ license: "COPYRIGHTED" })).toBe("License: COPYRIGHTED");
});

test("shortCredit lists license and all names once", () => {
  expect(shortCredit(copyright)).toBe("CC-BY-NC-4.0, Kari, Ola, NTB");
});
