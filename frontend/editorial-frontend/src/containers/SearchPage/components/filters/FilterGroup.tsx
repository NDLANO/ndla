/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { ArrowDownShortLine } from "@ndla/icons";
import {
  AccordionItem,
  AccordionItemContent,
  AccordionItemIndicator,
  AccordionItemTrigger,
  AccordionRoot,
  Heading,
} from "@ndla/primitives";
import { styled } from "@ndla/styled-system/jsx";
import type { ReactNode } from "react";

const StyledAccordionItemContent = styled(AccordionItemContent, {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "xsmall",
  },
});

interface Props {
  title: string;
  name: string;
  children: ReactNode;
  activeCount?: number;
  headingId?: string;
}

export const FilterGroup = ({ title, name, children, activeCount = 0, headingId }: Props) => (
  <AccordionRoot
    variant="subtle"
    collapsible
    defaultValue={activeCount > 0 ? [name] : []}
    data-testid={`${name}-filter`}
  >
    <AccordionItem value={name}>
      <Heading id={headingId} asChild consumeCss textStyle="label.small" fontWeight="bold">
        <h3>
          <AccordionItemTrigger>
            {activeCount > 0 ? `${title} (${activeCount})` : title}
            <AccordionItemIndicator asChild>
              <ArrowDownShortLine size="medium" />
            </AccordionItemIndicator>
          </AccordionItemTrigger>
        </h3>
      </Heading>
      <StyledAccordionItemContent>{children}</StyledAccordionItemContent>
    </AccordionItem>
  </AccordionRoot>
);
