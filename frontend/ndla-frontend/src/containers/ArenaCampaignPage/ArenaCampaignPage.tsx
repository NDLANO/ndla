/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ArrowRightLine, GroupLine, HeartLine, LightbulbLine } from "@ndla/icons";
import { Heading, Text } from "@ndla/primitives";
import { SafeLink } from "@ndla/safelink";
import { styled } from "@ndla/styled-system/jsx";
import { useTranslation } from "react-i18next";
import { PageTitle } from "../../components/PageTitle";
import { SocialMediaMetadata } from "../../components/SocialMediaMetadata";
import config from "../../config";
import { ArenaHero } from "./ArenaHero";
import { ArenaIllustration } from "./ArenaIllustration";
import { ArenaContent, ArenaSection, arenaUrl, DisplayHeading, TextLine, VisitArenaButton } from "./ArenaLayout";
import { TeacherVoices } from "./TeacherVoices";

const benefits = [
  { key: "community", Icon: GroupLine },
  { key: "knowledge", Icon: LightbulbLine },
  { key: "forTeachers", Icon: HeartLine },
] as const;

const TopicsSection = styled(ArenaSection, {
  base: {
    background: "surface.brand.1.moderate",
    clipPath: "polygon(0 0, 100% 0, 100% calc(100% - var(--slant)), 0 100%)",
    paddingBlockStart: "xxlarge",
    paddingBlockEnd: "calc(var(--slant) + token(spacing.xxlarge))",
    desktop: {
      paddingBlockStart: "medium",
    },
  },
});

const TopicsInner = styled(ArenaContent, {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "xxlarge",
    desktop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
  },
});

const SectionText = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "medium",
    desktop: {
      gap: "xxlarge",
    },
  },
});

const TopicsLink = styled(SafeLink, {
  base: {
    display: "inline-flex",
    alignItems: "center",
    gap: "xxsmall",
    textStyle: "title.medium",
    fontWeight: "bold",
    color: "text.default",
    textDecoration: "none",
    _hover: {
      textDecoration: "underline",
    },
  },
});

const BenefitList = styled("ul", {
  base: {
    listStyle: "none",
    display: "flex",
    flexDirection: "column",
    gap: "large",
    paddingBlockStart: "xxlarge",
    desktop: {
      flexDirection: "row",
      paddingBlockStart: "3xlarge",
    },
  },
});

const Benefit = styled("li", {
  base: {
    display: "flex",
    alignItems: "flex-start",
    gap: "medium",
    desktop: {
      flex: "1",
      gap: "large",
    },
  },
});

const BenefitIcon = styled("span", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: "0",
    width: "xxlarge",
    height: "xxlarge",
    borderRadius: "full",
    background: "surface.brand.1.moderate",
    color: "primary",
    "& svg": {
      width: "medium",
      height: "medium",
    },
    desktop: {
      width: "3xlarge",
      height: "3xlarge",
      "& svg": {
        width: "xlarge",
        height: "xlarge",
      },
    },
  },
});

const BenefitText = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "xxsmall",
    desktop: {
      gap: "small",
    },
  },
});

const OutroSection = styled(ArenaSection, {
  base: {
    background: "surface.brand.2.moderate",
    clipPath: "polygon(0 var(--slant), 100% 0, 100% 100%, 0 100%)",
    paddingBlockStart: "calc(var(--slant) + token(spacing.xxlarge))",
    paddingBlockEnd: "xxlarge",
    desktop: {
      paddingBlockEnd: "4xlarge",
    },
  },
});

const OutroInner = styled(ArenaContent, {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "xxlarge",
    desktop: {
      flexDirection: "row",
      alignItems: "center",
    },
  },
});

const OutroText = styled(SectionText, {
  base: {
    desktop: {
      flex: "1",
    },
  },
});

const OutroImage = styled("img", {
  base: {
    width: "100%",
    clipPath: "polygon(0 calc(var(--slant) / 2), 100% 0, 100% 100%, 0 100%)",
    desktop: {
      width: "50%",
      flexShrink: "0",
    },
  },
});

export const ArenaCampaignPage = () => {
  const { t } = useTranslation();

  return (
    <main>
      <PageTitle title={t("htmlTitles.arenaCampaign")} useLocationForCustomPath={true} />
      <SocialMediaMetadata
        type="website"
        title={t("welcomePage.quickLinks.arena.title")}
        description={t("arenaCampaign.metaDescription")}
        imageUrl={`${config.ndlaFrontendDomain}/static/arena/og-image.jpg`}
        useLocationForCanonicalPath={true}
      />
      <ArenaHero />
      <TopicsSection>
        <TopicsInner>
          <SectionText>
            <DisplayHeading>
              <TextLine>{t("arenaCampaign.topics.line1")}</TextLine>{" "}
              <TextLine>{t("arenaCampaign.topics.line2")}</TextLine>{" "}
              <TextLine>{t("arenaCampaign.topics.line3")}</TextLine>
            </DisplayHeading>
            <Text textStyle="title.medium" fontWeight="normal">
              {t("arenaCampaign.topics.description")}
            </Text>
            <TopicsLink to={arenaUrl}>
              {t("arenaCampaign.topics.link")}
              <ArrowRightLine />
            </TopicsLink>
          </SectionText>
          <ArenaIllustration />
        </TopicsInner>
      </TopicsSection>
      <ArenaContent>
        <Heading asChild consumeCss srOnly>
          <h2>{t("arenaCampaign.benefits.title")}</h2>
        </Heading>
        <BenefitList>
          {benefits.map((benefit) => (
            <Benefit key={benefit.key}>
              <BenefitIcon>
                <benefit.Icon />
              </BenefitIcon>
              <BenefitText>
                <Text asChild consumeCss textStyle="title.medium" fontWeight="bold">
                  <h3>{t(`arenaCampaign.benefits.${benefit.key}.title`)}</h3>
                </Text>
                <Text textStyle="body.large">{t(`arenaCampaign.benefits.${benefit.key}.description`)}</Text>
              </BenefitText>
            </Benefit>
          ))}
        </BenefitList>
      </ArenaContent>
      <TeacherVoices />
      <OutroSection>
        <OutroInner>
          <OutroText>
            <DisplayHeading>{t("arenaCampaign.outro.title")}</DisplayHeading>
            <VisitArenaButton tone="dark" />
          </OutroText>
          <OutroImage
            src="/static/arena/arena-hjemme.webp"
            alt={t("arenaCampaign.outro.imageAlt")}
            width={2151}
            height={1720}
            loading="lazy"
          />
        </OutroInner>
      </OutroSection>
    </main>
  );
};

export const Component = ArenaCampaignPage;
