/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { SafeLink, type SafeLinkProps } from "@ndla/safelink";
import { useRawLocation } from "../../util/localePath";

export const SafeLinkWithQuery = ({ children, to, ...props }: SafeLinkProps) => {
  const { search } = useRawLocation();

  return (
    <SafeLink to={typeof to === "string" ? to + search : { ...to, search }} {...props}>
      {children}
    </SafeLink>
  );
};
