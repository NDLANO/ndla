/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { FileCopyLine } from "@ndla/icons";
import { Button, Text } from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import { useToast } from "../../../components/ToastContext";

const GapWrapper = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "xsmall",
  },
});

const CopyLinkButton = styled(Button, {
  base: {
    justifyContent: "space-between",
    overflowWrap: "anywhere",
  },
});

interface Props {
  url: string;
  description: string;
  copyLabel: string;
  buttonLabel: string;
  copiedMessage: string;
}

export const ShareLink = ({ url, description, copyLabel, buttonLabel, copiedMessage }: Props) => {
  const toast = useToast();

  return (
    <>
      <Text>{description}</Text>
      <GapWrapper>
        <Text textStyle="label.medium" fontWeight="bold" asChild consumeCss>
          <span>{copyLabel}</span>
        </Text>
        <CopyLinkButton
          aria-label={buttonLabel}
          title={buttonLabel}
          variant="secondary"
          onClick={() => {
            window.navigator.clipboard.writeText(url);
            toast.create({ title: copiedMessage });
          }}
        >
          {url}
          <FileCopyLine />
        </CopyLinkButton>
      </GapWrapper>
    </>
  );
};
