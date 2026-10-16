/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { styled } from "@ndla/styled-system/jsx";
import { useTranslation } from "react-i18next";
import { ArenaContent, ArenaSection, TextLine } from "./ArenaLayout";
import { ArenaVideo, arenaVideoIds } from "./ArenaVideo";

const teachers = ["janEirik", "ingebjorg", "anneTrine"] as const;

const VoicesSection = styled(ArenaSection, {
  base: {
    paddingBlock: "xxlarge",
    desktop: {
      paddingBlock: "4xlarge",
    },
  },
});

const VoicesInner = styled(ArenaContent, {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "medium",
    desktop: {
      gap: "xxlarge",
    },
  },
});

const VoicesHeading = styled("h2", {
  base: {
    textStyle: "heading.medium",
    fontWeight: "semibold",
    desktop: {
      textStyle: "heading.large",
      fontWeight: "semibold",
    },
  },
});

const CardList = styled("ul", {
  base: {
    listStyle: "none",
    display: "flex",
    gap: "small",
    overflowX: "auto",
    scrollSnapType: "x mandatory",
    scrollPaddingInline: "var(--gutter)",
    marginInline: "calc(var(--gutter) * -1)",
    paddingInline: "var(--gutter)",
    scrollbarWidth: "none",
    "&::-webkit-scrollbar": {
      display: "none",
    },
    desktop: {
      display: "grid",
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      gap: "large",
      overflowX: "visible",
      marginInline: "0",
      paddingInline: "0",
    },
  },
});

const Card = styled("li", {
  base: {
    flex: "0 0 auto",
    width: "min(296px, 80vw)",
    scrollSnapAlign: "start",
    display: "flex",
    flexDirection: "column",
    gap: "medium",
    padding: "medium",
    background: "surface.default",
    border: "1px solid",
    borderColor: "grey.200",
    color: "text.default",
    desktop: {
      width: "auto",
      padding: "xlarge",
      gap: "large",
    },
  },
});

const QuoteFigure = styled("figure", {
  base: {
    flex: "1",
    display: "flex",
    flexDirection: "column",
    gap: "medium",
    desktop: {
      gap: "large",
    },
  },
});

const Quote = styled("blockquote", {
  base: {
    textStyle: "title.medium",
    fontWeight: "semibold",
  },
});

const QuoteCaption = styled("figcaption", {
  base: {
    textStyle: "body.medium",
    fontWeight: "semibold",
    marginBlockStart: "auto",
  },
});

export const TeacherVoices = () => {
  const { t } = useTranslation();

  return (
    <VoicesSection>
      <VoicesInner>
        <VoicesHeading>{t("arenaCampaign.voices.title")}</VoicesHeading>
        <CardList>
          {teachers.map((teacher) => {
            const name = t(`arenaCampaign.voices.${teacher}.name`);
            return (
              <Card key={teacher}>
                <ArenaVideo videoId={arenaVideoIds[teacher]} title={t("arenaCampaign.voices.videoTitle", { name })} />
                <QuoteFigure>
                  <Quote>{t(`arenaCampaign.voices.${teacher}.quote`)}</Quote>
                  <QuoteCaption>
                    <TextLine>{name}</TextLine> <TextLine>{t(`arenaCampaign.voices.${teacher}.role`)}</TextLine>
                  </QuoteCaption>
                </QuoteFigure>
              </Card>
            );
          })}
        </CardList>
      </VoicesInner>
    </VoicesSection>
  );
};
