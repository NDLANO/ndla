/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { CombinedGraphQLErrors, type ErrorLike } from "@apollo/client";
import { act, render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { createMemoryRouter, MemoryRouter, RouterProvider } from "react-router";
import { initializeI18n } from "../../server/locales/locales";
import { NDLAError } from "../../util/error/NDLAError";
import { NotFoundError, StatusError } from "../../util/error/StatusError";
import { handleError } from "../../util/handleError";
import { log } from "../../util/logger/logger";
import { DefaultErrorMessagePage } from "../DefaultErrorMessage";
import { type RedirectInfo, RedirectContext } from "../RedirectContext";

vi.mock("../../util/handleError", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../util/handleError")>()),
  handleError: vi.fn(),
}));

vi.mock("../../util/logger/logger", () => ({
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const i18n = initializeI18n("nb");

const ErrorPageWithProviders = ({ error, redirect }: { error: ErrorLike; redirect: RedirectInfo }) => (
  <RedirectContext value={(info) => Object.assign(redirect, info)}>
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <DefaultErrorMessagePage error={error} />
      </MemoryRouter>
    </I18nextProvider>
  </RedirectContext>
);

const renderErrorPage = (error: ErrorLike) => {
  const redirect: RedirectInfo = {};
  render(<ErrorPageWithProviders error={error} redirect={redirect} />);
  return redirect.status;
};

beforeEach(() => {
  vi.mocked(handleError).mockClear();
  vi.mocked(log.info).mockClear();
});

test("a not found error renders the not found page and is logged as info", () => {
  const error = new NotFoundError("Quiz not found");
  const status = renderErrorPage(error);

  expect(status).toBe(404);
  expect(screen.getByText("404")).toBeTruthy();
  expect(log.info).toHaveBeenCalledWith(
    expect.objectContaining({ message: "DefaultErrorMessagePage rendered notFound page", cause: error }),
  );
  expect(handleError).not.toHaveBeenCalled();
});

test("a graphql error with not found status renders the not found page", () => {
  const error = new CombinedGraphQLErrors({ errors: [{ message: "Not found", extensions: { status: 404 } }] });
  const status = renderErrorPage(error);

  expect(status).toBe(404);
  expect(log.info).toHaveBeenCalledWith(
    expect.objectContaining({ message: "DefaultErrorMessagePage rendered notFound page", cause: error }),
  );
});

test("an access denied error renders the access denied page", () => {
  const error = new StatusError("Forbidden", 403);
  const status = renderErrorPage(error);

  expect(status).toBe(401);
  expect(log.info).toHaveBeenCalledWith(
    expect.objectContaining({ message: "DefaultErrorMessagePage rendered accessDenied page", cause: error }),
  );
  expect(handleError).not.toHaveBeenCalled();
});

test("a gone error renders the unpublished page", () => {
  const error = new StatusError("Gone", 410);
  const status = renderErrorPage(error);

  expect(status).toBe(410);
  expect(screen.getByText("410")).toBeTruthy();
  expect(log.info).toHaveBeenCalledWith(
    expect.objectContaining({ message: "DefaultErrorMessagePage rendered gone page", cause: error }),
  );
});

test("an NDLAError renders the internal error page and is reported", () => {
  const error = new NDLAError("Missing quiz in quiz response");
  const status = renderErrorPage(error);

  expect(status).toBe(500);
  expect(screen.getByText("500")).toBeTruthy();
  expect(handleError).toHaveBeenCalledTimes(1);
  expect(handleError).toHaveBeenCalledWith(
    expect.objectContaining({
      message: "DefaultErrorMessagePage rendered internal page",
      cause: error,
      logLevel: "error",
    }),
  );
  expect(log.info).not.toHaveBeenCalled();
});

test("the reported error keeps the log level of its cause", () => {
  const error = new NDLAError("Unexpected but harmless");
  error.logLevel = "warn";
  renderErrorPage(error);

  expect(handleError).toHaveBeenCalledWith(expect.objectContaining({ logLevel: "warn", cause: error }));
});

test("an apollo error renders the internal error page without reporting it again", () => {
  const error = new CombinedGraphQLErrors({ errors: [{ message: "Bad request", extensions: { status: 400 } }] });
  const status = renderErrorPage(error);

  expect(status).toBe(500);
  expect(handleError).not.toHaveBeenCalled();
  expect(log.info).toHaveBeenCalledWith(
    expect.objectContaining({ message: "DefaultErrorMessagePage rendered internal page", cause: error }),
  );
});

test("a network error from apollo renders the internal error page without reporting it again", () => {
  const error = new TypeError("fetch failed");
  const status = renderErrorPage(error);

  expect(status).toBe(500);
  expect(handleError).not.toHaveBeenCalled();
});

test("re-rendering with an equivalent newly constructed error is only reported once", () => {
  const redirect: RedirectInfo = {};
  const { rerender } = render(
    <ErrorPageWithProviders error={new NDLAError("Missing quiz in quiz response")} redirect={redirect} />,
  );
  rerender(<ErrorPageWithProviders error={new NDLAError("Missing quiz in quiz response")} redirect={redirect} />);

  expect(handleError).toHaveBeenCalledTimes(1);
});

test("the same error on a new path is reported again", async () => {
  const error = new NDLAError("Missing quiz in quiz response");
  const router = createMemoryRouter([{ path: "*", element: <DefaultErrorMessagePage error={error} /> }], {
    initialEntries: ["/quiz/1"],
  });
  render(
    <I18nextProvider i18n={i18n}>
      <RouterProvider router={router} />
    </I18nextProvider>,
  );
  await act(() => router.navigate("/quiz/2"));

  expect(handleError).toHaveBeenCalledTimes(2);
});
