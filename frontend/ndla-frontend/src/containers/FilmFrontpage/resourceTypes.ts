/**
 * Copyright (c) 2019-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ParseKeys } from "i18next";
import {
  NDLAFILM_RESOURCE_TYPE_DOCUMENTARY,
  NDLAFILM_RESOURCE_TYPE_FEATURE_FILM,
  NDLAFILM_RESOURCE_TYPE_SERIES,
  NDLAFILM_RESOURCE_TYPE_SHORT_FILM,
} from "../../constants";

export interface MovieResourceType {
  id: string;
  name: ParseKeys;
}

export const movieResourceTypes: MovieResourceType[] = [
  {
    name: "filmfrontpage.resourcetype.documentary",
    id: NDLAFILM_RESOURCE_TYPE_DOCUMENTARY,
  },
  {
    name: "filmfrontpage.resourcetype.featureFilm",
    id: NDLAFILM_RESOURCE_TYPE_FEATURE_FILM,
  },
  {
    name: "filmfrontpage.resourcetype.series",
    id: NDLAFILM_RESOURCE_TYPE_SERIES,
  },
  {
    name: "filmfrontpage.resourcetype.shortFilm",
    id: NDLAFILM_RESOURCE_TYPE_SHORT_FILM,
  },
];
