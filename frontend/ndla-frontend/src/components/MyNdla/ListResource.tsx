/**
 * Copyright (c) 2022-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  ListItemContent,
  ListItemHeading,
  ListItemImage,
  ListItemRoot,
  type ListItemVariantProps,
  Skeleton,
  Text,
} from "@ndla/primitives";
import { SafeLink } from "@ndla/safelink";
import { styled } from "@ndla/styled-system/jsx";
import { linkOverlay } from "@ndla/styled-system/patterns";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useListItemTraits } from "../../util/listItemTraits";
import { ContentTypeFallbackIcon } from "../ContentTypeFallbackIcon";

export interface ListResourceProps {
  id: string;
  link: string;
  title: string;
  resourceImage: { src: string | undefined; alt: string };
  resourceTypes?: { id: string; name: string }[];
  menu?: ReactNode;
  traits?: string[] | null;
  storedResourceType?: string;
  isLoading?: boolean;
  isSelected?: boolean;
}

const StyledListItemContent = styled(ListItemContent, {
  base: {
    tabletDown: {
      flexDirection: "column",
      alignItems: "flex-start",
    },
  },
});

const MenuWrapper = styled("div", {
  base: {
    position: "relative",
  },
});

const StyledListItemImage = styled(ListItemImage, {
  base: {
    minHeight: "[48px]",
    maxHeight: "[48px]",
    minWidth: "[64px]",
    maxWidth: "[64px]",
    tabletDown: {
      display: "none",
    },
  },
  variants: {
    isFallback: {
      true: {
        background: "surface.subtle",
        border: "1px solid",
        borderColor: "stroke.discrete",
        borderRadius: "xsmall",
      },
    },
  },
});

const StyledListItemHeading = styled(ListItemHeading, {
  base: {
    textStyle: "label.medium",
    fontWeight: "normal",
    color: "text.default",
    textDecoration: "none",
    lineClamp: "2",
    overflowWrap: "anywhere",
  },
});

const TraitsText = styled(Text, {
  base: {
    flexShrink: "0",
    tablet: {
      maxWidth: "[40%]",
      textAlign: "end",
    },
  },
});

const LoadingListItemRoot = styled(ListItemRoot, {
  base: {
    width: "full",
    borderStyle: "none",
    paddingInline: "xsmall",
    pointerEvents: "none",
  },
});

const StyledListItemRoot = styled(ListItemRoot, {
  base: {
    width: "full",
    borderStyle: "none",
    paddingInline: "xsmall",
    tabletDown: {
      "& picture": {
        display: "none",
      },
    },
  },
  variants: {
    isSelected: {
      true: {
        backgroundColor: "surface.action.brand.1.selected",
      },
      false: {},
    },
  },
});

const StyledContentTypeFallbackIcon = styled(ContentTypeFallbackIcon, {
  base: {
    tabletDown: {
      display: "none",
    },
  },
});

export const ListResource = ({
  id,
  link,
  title,
  resourceImage,
  resourceTypes,
  menu,
  traits,
  storedResourceType,
  isLoading = false,
  isSelected,
  nonInteractive,
}: ListResourceProps & ListItemVariantProps) => {
  const { t } = useTranslation();

  const listItemTraits = useListItemTraits({ traits, resourceTypes, resourceType: storedResourceType });

  if (isLoading) {
    return (
      <LoadingListItemRoot aria-label={t("loading")} aria-busy={true} nonInteractive={nonInteractive}>
        <Skeleton>
          <StyledListItemImage alt="" />
        </Skeleton>
        <Skeleton css={{ width: "2/5" }}>
          <StyledListItemHeading>&nbsp;</StyledListItemHeading>
        </Skeleton>
      </LoadingListItemRoot>
    );
  }

  return (
    <StyledListItemRoot id={id} nonInteractive={nonInteractive} isSelected={isSelected}>
      <StyledListItemImage
        src={resourceImage.src}
        alt=""
        isFallback={!resourceImage.src}
        fallbackElement={<StyledContentTypeFallbackIcon contentType={storedResourceType} />}
      />
      <StyledListItemContent>
        {nonInteractive ? (
          <StyledListItemHeading color={!storedResourceType ? "text.subtle" : undefined}>{title}</StyledListItemHeading>
        ) : (
          <StyledListItemHeading
            asChild
            consumeCss
            css={linkOverlay.raw()}
            color={!storedResourceType ? "text.subtle" : undefined}
          >
            <SafeLink to={link}>{title}</SafeLink>
          </StyledListItemHeading>
        )}
        {!!listItemTraits.length && (
          <TraitsText textStyle="label.xsmall" color="text.subtle">
            {listItemTraits.join(", ")}
          </TraitsText>
        )}
      </StyledListItemContent>
      {menu ? <MenuWrapper>{menu}</MenuWrapper> : null}
    </StyledListItemRoot>
  );
};
