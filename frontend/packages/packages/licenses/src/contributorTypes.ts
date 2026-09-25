/**
 * Copyright (c) 2017-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { translationsEN, translationsNB, translationsNN } from "@ndla/locales";
import { metaTypes } from "./CCRel";
import type { Locale, LocaleString } from "./types";

const creators = [
  "originator",
  "photographer",
  "artist",
  "writer",
  "scriptwriter",
  "reader",
  "translator",
  "director",
  "illustrator",
  "cowriter",
  "composer",
] as const;
const processors = ["processor", "facilitator", "editorial", "linguistic", "idea", "compiler", "correction"] as const;
const rightsholders = ["rightsholder", "publisher", "distributor", "supplier"] as const;

type CreatorType = (typeof creators)[number];
type ProcessorType = (typeof processors)[number];
type RightsholderType = (typeof rightsholders)[number];
export type ContributorType = CreatorType | ProcessorType | RightsholderType;

export const contributorGroups = {
  creators,
  processors,
  rightsholders,
  contributors: [...creators, ...rightsholders, ...processors],
} as const;

type ContributorTypes = Record<ContributorType, LocaleString>;

export const contributorTypes: ContributorTypes = Object.fromEntries(
  contributorGroups.contributors.map((type) => [
    type,
    { nb: translationsNB[type], nn: translationsNN[type], en: translationsEN[type] },
  ]),
) as ContributorTypes;

export interface Contributor {
  type: string;
  name: string;
}

export interface CopyrightType {
  creators: Contributor[];
  processors: Contributor[];
  rightsholders: Contributor[];
}

export function mkContributorString(contributors: Contributor[], lang: Locale, ignoreType?: string) {
  return contributors
    .map((contributor) => {
      const type = contributor.type.toLowerCase();
      if (type === ignoreType) {
        return contributor.name;
      }
      const translatedType = contributorTypes[type as ContributorType][lang];
      return `${translatedType} ${contributor.name}`;
    })
    .join(", ");
}

export function getGroupedContributorDescriptionList(copyright: CopyrightType, lang: Locale) {
  const { creators, rightsholders, processors } = copyright;
  return [
    {
      label: contributorTypes.originator[lang],
      description: mkContributorString(creators, lang, "originator"),
      metaType: metaTypes.author,
    },
    {
      label: contributorTypes.rightsholder[lang],
      description: mkContributorString(rightsholders, lang, "rightsholder"),
      metaType: metaTypes.copyrightHolder,
    },
    {
      label: contributorTypes.processor[lang],
      description: mkContributorString(processors, lang, "processor"),
      metaType: metaTypes.contributor,
    },
  ].filter((item) => item.description !== "");
}
