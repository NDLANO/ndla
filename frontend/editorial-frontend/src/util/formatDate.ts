/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { parseAbsolute } from "@internationalized/date";

// A fixed time zone makes the server and the browser format dates the same way
const timeZone = "Europe/Oslo";

const dateFormatter = new Intl.DateTimeFormat("no", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone,
});

export default function formatDate(date: string | number | undefined | null): string {
  if (!date) return "";

  if (typeof date === "string") {
    const parsedDate = parseAbsolute(date, timeZone);
    return dateFormatter.format(parsedDate.toDate());
  }

  return dateFormatter.format(date);
}

export function formatDateForBackend(date: Date): string {
  return date.toISOString().split(".").shift() + "Z";
}
