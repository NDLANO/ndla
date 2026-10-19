/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { PauseLine, PlayLine } from "@ndla/icons";
import { IconButton } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const ANIMATED_SRC = "/static/arena/arena-illustration.gif";
const STILL_SRC = "/static/arena/arena-illustration.png";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const IllustrationWrapper = styled("div", {
  base: {
    position: "relative",
    width: "full",
    maxWidth: "surface.small",
    desktop: {
      maxWidth: "surface.medium",
    },
  },
});

const Illustration = styled("img", {
  base: {
    width: "full",
  },
});

const ToggleButton = styled(IconButton, {
  base: {
    position: "absolute",
    insetInlineEnd: "xsmall",
    bottom: "xsmall",
  },
});

const usePrefersReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    const onChange = () => setPrefersReducedMotion(query.matches);
    onChange();
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return prefersReducedMotion;
};

export const ArenaIllustration = () => {
  const { t } = useTranslation();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [playing, setPlaying] = useState<boolean>();
  const isPlaying = playing ?? !prefersReducedMotion;
  const alt = t("arenaCampaign.topics.illustrationAlt");
  const toggleLabel = isPlaying ? t("arenaCampaign.topics.pauseAnimation") : t("arenaCampaign.topics.playAnimation");

  return (
    <IllustrationWrapper>
      {playing === undefined ? (
        <picture>
          <source srcSet={STILL_SRC} media={REDUCED_MOTION_QUERY} />
          <Illustration src={ANIMATED_SRC} alt={alt} width={600} height={681} loading="lazy" />
        </picture>
      ) : (
        <Illustration src={isPlaying ? ANIMATED_SRC : STILL_SRC} alt={alt} width={600} height={681} />
      )}
      <ToggleButton
        variant="secondary"
        size="small"
        aria-label={toggleLabel}
        title={toggleLabel}
        onClick={() => setPlaying(!isPlaying)}
      >
        {isPlaying ? <PauseLine /> : <PlayLine />}
      </ToggleButton>
    </IllustrationWrapper>
  );
};
