/**
 * Copyright (c) 2024-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ArrowLeftShortLine, ArrowRightShortLine } from "@ndla/icons";
import {
  Button,
  IconButton,
  PaginationContext,
  PaginationEllipsis,
  PaginationItem,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
  type PaginationRootProps,
  Text,
} from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import { usePaginationTranslations } from "@ndla/ui";
import { useTranslation } from "react-i18next";

const StyledPaginationRoot = styled(PaginationRoot, {
  base: {
    flexWrap: "wrap",
  },
});

const LabelledTriggerButton = styled(Button, {
  base: {
    _disabled: {
      visibility: "hidden",
    },
    tabletWideDown: {
      "& span": {
        display: "none",
      },
    },
  },
});

type Props = Omit<PaginationRootProps, "translations"> & {
  buttonSize?: "small" | "medium";
  labelled?: boolean;
};

const Pagination = ({
  page = 1,
  onPageChange,
  count,
  pageSize,
  buttonSize = "medium",
  labelled = false,
  ...props
}: Props) => {
  const { t } = useTranslation();
  const translations = usePaginationTranslations();
  const countWithMaxValue = Math.min(count ?? 0, 1000);
  const TriggerButton = labelled ? LabelledTriggerButton : IconButton;
  const PageButton = labelled ? Button : IconButton;
  return (
    <StyledPaginationRoot
      page={page}
      onPageChange={onPageChange}
      count={countWithMaxValue}
      pageSize={pageSize}
      translations={translations}
      {...props}
    >
      <PaginationPrevTrigger asChild>
        <TriggerButton
          size={buttonSize}
          variant="tertiary"
          aria-label={translations?.prevTriggerLabel}
          title={translations?.prevTriggerLabel}
        >
          <ArrowLeftShortLine />
          {!!labelled && <span>{t("pagination.prev")}</span>}
        </TriggerButton>
      </PaginationPrevTrigger>
      <PaginationContext>
        {(pagination) =>
          pagination.pages.map((page, index) =>
            page.type === "page" ? (
              <PaginationItem key={index} {...page} asChild>
                <PageButton size={buttonSize} variant={page.value === pagination.page ? "primary" : "tertiary"}>
                  {page.value}
                </PageButton>
              </PaginationItem>
            ) : (
              <PaginationEllipsis key={index} index={index} asChild>
                <Text asChild consumeCss>
                  <div>&#8230;</div>
                </Text>
              </PaginationEllipsis>
            ),
          )
        }
      </PaginationContext>
      <PaginationNextTrigger asChild>
        <TriggerButton
          size={buttonSize}
          variant="tertiary"
          aria-label={translations?.nextTriggerLabel}
          title={translations?.nextTriggerLabel}
        >
          {!!labelled && <span>{t("pagination.next")}</span>}
          <ArrowRightShortLine />
        </TriggerButton>
      </PaginationNextTrigger>
    </StyledPaginationRoot>
  );
};

export default Pagination;
