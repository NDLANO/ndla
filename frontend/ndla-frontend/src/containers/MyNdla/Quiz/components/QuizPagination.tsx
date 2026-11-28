/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ArrowLeftShortLine, ArrowRightShortLine } from "@ndla/icons";
import {
  Button,
  PaginationContext,
  PaginationEllipsis,
  PaginationItem,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
  Text,
} from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import { usePaginationTranslations } from "@ndla/ui";
import { useTranslation } from "react-i18next";

const StyledPaginationButton = styled(Button, {
  base: {
    _disabled: {
      visibility: "hidden",
    },
    tabletDown: {
      "& span": {
        display: "none",
      },
    },
  },
});

interface Props {
  page: number;
  count: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  "aria-label": string;
}

export const QuizPagination = ({ page, count, pageSize, onPageChange, "aria-label": ariaLabel }: Props) => {
  const { t } = useTranslation();
  const paginationTranslations = usePaginationTranslations();
  if (count <= pageSize && page <= 1) return null;

  return (
    <PaginationRoot
      page={page}
      onPageChange={(details) => onPageChange(details.page)}
      count={count}
      pageSize={pageSize}
      translations={paginationTranslations}
      siblingCount={1}
      aria-label={ariaLabel}
    >
      <PaginationPrevTrigger asChild>
        <StyledPaginationButton variant="tertiary" aria-label={t("pagination.prev")} title={t("pagination.prev")}>
          <ArrowLeftShortLine />
          <span>{t("pagination.prev")}</span>
        </StyledPaginationButton>
      </PaginationPrevTrigger>
      <PaginationContext>
        {(pagination) =>
          pagination.pages.map((p, index) =>
            p.type === "page" ? (
              <PaginationItem key={index} {...p} asChild>
                <Button variant={p.value === pagination.page ? "primary" : "tertiary"}>{p.value}</Button>
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
        <StyledPaginationButton variant="tertiary" aria-label={t("pagination.next")} title={t("pagination.next")}>
          <span>{t("pagination.next")}</span>
          <ArrowRightShortLine />
        </StyledPaginationButton>
      </PaginationNextTrigger>
    </PaginationRoot>
  );
};
