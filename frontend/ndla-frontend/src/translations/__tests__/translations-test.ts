/**
 * Copyright (c) 2021-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getUntranslatedKeys, validateTranslationFiles } from "@ndla/util";
import en from "../translations-en";
import nb from "../translations-nb";
import nn from "../translations-nn";
import se from "../translations-se";

test("That all translations has all language keys", () => {
  const anyMissing = validateTranslationFiles(
    [
      {
        languageName: "Norsk bokmål",
        translationObject: nb,
      },
      {
        languageName: "Norsk nynorsk",
        translationObject: nn,
      },
      {
        languageName: "English",
        translationObject: en,
      },
    ],
    "only-on-error",
  );

  expect(anyMissing).toBe(false);
});

test("keys still awaiting translation", () => {
  expect({
    nb: getUntranslatedKeys(nb),
    nn: getUntranslatedKeys(nn),
    en: getUntranslatedKeys(en),
    se: getUntranslatedKeys(se),
  }).toMatchInlineSnapshot(`
    {
      "en": [],
      "nb": [],
      "nn": [],
      "se": [
        "htmlTitles.arenaCampaign",
        "arenaCampaign.metaDescription",
        "arenaCampaign.visitArena",
        "arenaCampaign.hero.titleLine1",
        "arenaCampaign.hero.titleLine2",
        "arenaCampaign.hero.description",
        "arenaCampaign.hero.playVideo",
        "arenaCampaign.hero.captionName",
        "arenaCampaign.hero.captionRole",
        "arenaCampaign.hero.captionModerator",
        "arenaCampaign.topics.line1",
        "arenaCampaign.topics.line2",
        "arenaCampaign.topics.line3",
        "arenaCampaign.topics.description",
        "arenaCampaign.topics.link",
        "arenaCampaign.topics.illustrationAlt",
        "arenaCampaign.topics.pauseAnimation",
        "arenaCampaign.topics.playAnimation",
        "arenaCampaign.benefits.title",
        "arenaCampaign.benefits.community.title",
        "arenaCampaign.benefits.community.description",
        "arenaCampaign.benefits.knowledge.title",
        "arenaCampaign.benefits.knowledge.description",
        "arenaCampaign.benefits.forTeachers.title",
        "arenaCampaign.benefits.forTeachers.description",
        "arenaCampaign.voices.title",
        "arenaCampaign.voices.videoTitle",
        "arenaCampaign.voices.janEirik.quote",
        "arenaCampaign.voices.janEirik.name",
        "arenaCampaign.voices.janEirik.role",
        "arenaCampaign.voices.ingebjorg.quote",
        "arenaCampaign.voices.ingebjorg.name",
        "arenaCampaign.voices.ingebjorg.role",
        "arenaCampaign.voices.anneTrine.quote",
        "arenaCampaign.voices.anneTrine.name",
        "arenaCampaign.voices.anneTrine.role",
        "arenaCampaign.outro.title",
        "arenaCampaign.outro.imageAlt",
        "myNdla.learningpath.sharing.title",
        "errorNotice.title",
        "errorNotice.reasonLabel",
        "errorNotice.actionLabel",
        "errorNotice.searchSubjects",
        "notFoundPage.eyebrow",
        "notFoundPage.title",
        "notFoundPage.description",
        "notFoundPage.notice.stampLarge",
        "notFoundPage.notice.stampSmall",
        "notFoundPage.notice.reason",
        "notFoundPage.notice.action",
        "errorPage.eyebrow",
        "errorPage.title",
        "errorPage.description",
        "errorPage.notice.stampLarge",
        "errorPage.notice.stampSmall",
        "errorPage.notice.reason",
        "errorPage.notice.action",
        "unpublishedResourcePage.eyebrow",
        "unpublishedResourcePage.title",
        "unpublishedResourcePage.description",
        "unpublishedResourcePage.notice.stampLarge",
        "unpublishedResourcePage.notice.stampSmall",
        "unpublishedResourcePage.notice.reason",
        "unpublishedResourcePage.notice.action",
        "archivedPage",
      ],
    }
  `);
});
