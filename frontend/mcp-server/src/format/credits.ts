/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

interface Author {
  name: string;
  type?: string;
}

export interface CopyrightLike {
  license?: { license: string; url?: string | null } | null;
  origin?: string | null;
  creators?: Author[];
  processors?: Author[];
  rightsholders?: Author[];
}

const uniqueNames = (authors: Author[] | undefined): string[] => [
  ...new Set((authors ?? []).map((a) => a.name.trim()).filter(Boolean)),
];

export const formatLicense = (license: string | undefined | null, url?: string | null): string | undefined => {
  if (!license) return undefined;
  return url ? `${license} (${url})` : license;
};

interface CreditOptions {
  copyright?: CopyrightLike | null;
  license?: string | null;
  source?: string;
}

/** A single attribution line, e.g. `License: CC-BY-SA-4.0 · Creators: A, B · Source: https://ndla.no/...` */
export const creditLine = ({ copyright, license, source }: CreditOptions): string => {
  const parts: string[] = [];
  const licenseText = formatLicense(copyright?.license?.license ?? license, copyright?.license?.url);
  if (licenseText) parts.push(`License: ${licenseText}`);
  const creators = uniqueNames(copyright?.creators);
  if (creators.length) parts.push(`Creators: ${creators.join(", ")}`);
  const rightsholders = uniqueNames(copyright?.rightsholders);
  if (rightsholders.length) parts.push(`Rightsholders: ${rightsholders.join(", ")}`);
  if (source) parts.push(`Source: ${source}`);
  return parts.join(" · ");
};

/** Short credit for media inside an article, e.g. `CC-BY-NC-4.0, Johner Images, NTB` */
export const shortCredit = (copyright?: CopyrightLike | null, license?: string | null): string => {
  const names = uniqueNames([...(copyright?.creators ?? []), ...(copyright?.rightsholders ?? [])]);
  return [copyright?.license?.license ?? license, ...names].filter(Boolean).join(", ");
};
