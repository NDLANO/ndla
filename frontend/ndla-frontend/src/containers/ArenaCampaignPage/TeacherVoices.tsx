/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { styled } from "@ndla/styled-system/jsx";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArenaContent, ArenaSection, NameAndRole } from "./ArenaLayout";
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

const CardScroller = styled("div", {
  base: {
    position: "relative",
    overflowX: "auto",
    scrollSnapType: "x",
    scrollSnapStrictness: "mandatory",
    scrollPaddingInline: "var(--gutter)",
    marginInline: "[calc(var(--gutter) * -1)]",
    paddingInline: "var(--gutter)",
    paddingBlockEnd: "small",
    scrollbarWidth: "[thin]",
    scrollbarColor: "[token(colors.stroke.default) token(colors.stroke.discrete)]",
    _focusVisible: {
      outline: "3px solid",
      outlineColor: "stroke.default",
      outlineOffset: "[-3px]",
    },
    desktop: {
      overflowX: "visible",
      marginInline: "0",
      paddingInline: "0",
      paddingBlockEnd: "0",
    },
  },
});

const CardList = styled("ul", {
  base: {
    listStyle: "none",
    display: "flex",
    gap: "small",
    width: "max",
    desktop: {
      display: "grid",
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      gap: "large",
      width: "auto",
    },
  },
});

const Card = styled("li", {
  base: {
    flex: "[0 0 auto]",
    width: "surface.xsmall",
    scrollSnapAlign: "start",
    display: "flex",
    flexDirection: "column",
    gap: "medium",
    padding: "medium",
    background: "surface.default",
    border: "1px solid",
    borderColor: "stroke.discrete",
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

const useIsScrollable = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const [scrollable, setScrollable] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setScrollable(element.scrollWidth > element.clientWidth));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, scrollable] as const;
};

export const TeacherVoices = () => {
  const { t } = useTranslation();
  const headingId = useId();
  const [scrollerRef, scrollable] = useIsScrollable<HTMLDivElement>();

  return (
    <VoicesSection>
      <VoicesInner>
        <VoicesHeading id={headingId}>{t("arenaCampaign.voices.title")}</VoicesHeading>
        <CardScroller
          ref={scrollerRef}
          tabIndex={scrollable ? 0 : undefined}
          role={scrollable ? "region" : undefined}
          aria-labelledby={scrollable ? headingId : undefined}
        >
          <CardList>
            {teachers.map((teacher) => {
              const name = t(`arenaCampaign.voices.${teacher}.name`);
              return (
                <Card key={teacher}>
                  <ArenaVideo videoId={arenaVideoIds[teacher]} title={t("arenaCampaign.voices.videoTitle", { name })} />
                  <QuoteFigure>
                    <Quote>{t(`arenaCampaign.voices.${teacher}.quote`)}</Quote>
                    <QuoteCaption>
                      <NameAndRole name={name} role={t(`arenaCampaign.voices.${teacher}.role`)} />
                    </QuoteCaption>
                  </QuoteFigure>
                </Card>
              );
            })}
          </CardList>
        </CardScroller>
      </VoicesInner>
    </VoicesSection>
  );
};
