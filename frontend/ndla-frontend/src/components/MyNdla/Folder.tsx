/**
 * Copyright (c) 2022-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { FolderLine, LinkMedium, LockLine } from "@ndla/icons";
import { ListItemContent, ListItemHeading, ListItemRoot, Text } from "@ndla/primitives";
import { SafeLink } from "@ndla/safelink";
import { styled } from "@ndla/styled-system/jsx";
import { linkOverlay } from "@ndla/styled-system/patterns";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { GQLFolderFragment, GQLSharedFolderFragment } from "../../graphqlTypes";
import { routes } from "../../routeHelpers";

interface Props {
  description?: string;
  menu?: ReactNode;
  folder: GQLFolderFragment | GQLSharedFolderFragment;
  isFavorited?: boolean;
  link?: string;
  nonInteractive?: boolean;
}

const StyledListItemRoot = styled(ListItemRoot, {
  base: {
    borderStyle: "none",
    paddingInline: "xsmall",
  },
});

const StyledFolderLine = styled(FolderLine, {
  base: {
    flexShrink: "0",
  },
});

const StatusText = styled(Text, {
  base: {
    display: "flex",
    gap: "xxsmall",
    alignItems: "center",
    flexShrink: "0",
  },
});

const MenuWrapper = styled("div", {
  base: {
    position: "relative",
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

const StyledListItemContent = styled(ListItemContent, {
  base: {
    tabletDown: {
      flexDirection: "column",
      alignItems: "flex-start",
    },
  },
});

export const Folder = ({ menu, folder: { id, status, name }, isFavorited, nonInteractive, link }: Props) => {
  const { t } = useTranslation();
  const isShared = status === "shared";
  const defaultLink = isFavorited ? routes.folder(id) : routes.myNdla.folders(id);

  return (
    <StyledListItemRoot nonInteractive={nonInteractive} id={id}>
      <StyledFolderLine />
      <StyledListItemContent>
        {nonInteractive ? (
          <StyledListItemHeading>{name}</StyledListItemHeading>
        ) : (
          <StyledListItemHeading asChild consumeCss css={linkOverlay.raw()}>
            <SafeLink to={link ?? defaultLink}>{name}</SafeLink>
          </StyledListItemHeading>
        )}
        <StatusText textStyle="label.xsmall" color="text.subtle">
          {isShared ? <LinkMedium size="small" /> : <LockLine size="small" />}
          {isShared ? t("myNdla.folder.sharing.shared") : t("myNdla.folder.sharing.private")}
        </StatusText>
      </StyledListItemContent>
      {menu ? <MenuWrapper>{menu}</MenuWrapper> : null}
    </StyledListItemRoot>
  );
};
