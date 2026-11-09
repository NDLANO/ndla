/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { FileCopyLine } from "@ndla/icons";
import { IconButton, type IconButtonProps } from "@ndla/primitives";

export const DuplicateButton = (props: IconButtonProps) => {
  return (
    <IconButton
      contentEditable={false}
      variant="secondary"
      size="small"
      title={props["aria-label"]}
      onMouseDown={(e) => e.preventDefault()}
      {...props}
    >
      <FileCopyLine />
    </IconButton>
  );
};

export default DuplicateButton;
