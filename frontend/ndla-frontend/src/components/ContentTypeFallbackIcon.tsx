/**
 * Copyright (c) 2024-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { HeadphoneLine, VolumeUpLine, H5P, ImageLine, MovieLine, TextWrap, type IconProps } from "@ndla/icons";
import type { ComponentType, Ref } from "react";

const icons: Partial<Record<string, ComponentType<IconProps>>> = {
  "learning-path": TextWrap,
  image: ImageLine,
  video: MovieLine,
  h5p: H5P,
  podcast: HeadphoneLine,
  audio: VolumeUpLine,
};

interface Props extends IconProps {
  ref?: Ref<SVGSVGElement>;
  contentType?: string;
}

export const ContentTypeFallbackIcon = ({ contentType, ...props }: Props) => {
  const Element = icons[contentType ?? ""] ?? ImageLine;
  return <Element {...props} />;
};
