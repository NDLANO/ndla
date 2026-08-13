/**
 * Copyright (c) 2016-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ImageMetaInformationV3DTO } from "@ndla/types-backend/image-api";
import { useFormikContext } from "formik";
import { useState } from "react";
import ReactCrop, { type Crop, type PercentCrop } from "react-image-crop";
import config from "../../../../../config";
import type { ImageEmbedFormValues } from "../types";

interface Props {
  language: string;
  image: ImageMetaInformationV3DTO;
  onCropComplete: (crop: PercentCrop) => void;
  aspect?: number;
}

const getCrop = (data: ImageEmbedFormValues): Crop | undefined => {
  if (data.upperLeftX && data.upperLeftY && data.lowerRightX && data.lowerRightY) {
    const upperLeftX = parseInt(data.upperLeftX);
    const upperLeftY = parseInt(data.upperLeftY);
    return {
      unit: "%",
      x: upperLeftX,
      y: upperLeftY,
      width: parseInt(data.lowerRightX) - upperLeftX,
      height: parseInt(data.lowerRightY) - upperLeftY,
    };
  }
  return undefined;
};

const ImageCropEdit = ({ language, onCropComplete, aspect, image }: Props) => {
  const { values } = useFormikContext<ImageEmbedFormValues>();
  const src = `${config.ndlaApiUrl}/image-api/raw/id/${image.id}?language=${language}`;
  const [crop, setCrop] = useState<Crop | undefined>(getCrop(values));

  const onComplete = (crop: PercentCrop) => {
    if (crop.width === 0 && crop.height === 0) {
      return;
    }
    onCropComplete(crop);
  };

  return (
    <ReactCrop
      style={{ minWidth: "100%" }}
      onComplete={(_, crop) => onComplete(crop)}
      crop={crop}
      aspect={aspect}
      onChange={(_, crop) => setCrop(crop)}
      ruleOfThirds
    >
      <img src={src} alt="" />
    </ReactCrop>
  );
};

export default ImageCropEdit;
