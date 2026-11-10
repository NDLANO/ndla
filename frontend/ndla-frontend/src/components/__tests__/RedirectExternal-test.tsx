/**
 * Copyright (c) 2017-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { render } from "@testing-library/react";
import { MemoryRouter, StaticRouter } from "react-router";
import { replaceLocation } from "../../util/browserLocation";
import { RedirectContext } from "../RedirectContext";
import { RedirectExternal } from "../RedirectExternal";

vi.mock("../../util/browserLocation", () => ({ replaceLocation: vi.fn() }));

test("External redirect for static router", () => {
  const context = {};
  render(
    <RedirectContext value={(info) => Object.assign(context, info)}>
      <StaticRouter location="">
        <RedirectExternal to="https://google.com/" />
      </StaticRouter>
    </RedirectContext>,
  );

  expect(context).toEqual({
    url: "https://google.com/",
  });
});

test("External redirect for static router with basename", () => {
  const context = {};
  render(
    <RedirectContext value={(info) => Object.assign(context, info)}>
      <StaticRouter basename="nb" location={"/nb"}>
        <RedirectExternal to="https://google.com/" />
      </StaticRouter>
    </RedirectContext>,
  );

  expect(context).toEqual({
    url: "https://google.com/",
  });
});

test("External redirect for (memory/dom) router", () => {
  render(
    <MemoryRouter basename="nb" initialEntries={["/nb"]}>
      <RedirectExternal to="https://google.com/" />
    </MemoryRouter>,
  );

  expect(replaceLocation).toHaveBeenCalledWith("https://google.com/");
});
