/**
 * Copyright (c) 2024-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export const capitalizeFirstLetter = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export type ResourceGroup = "core" | "supplementary" | "learningpath" | "link";

export const RESOURCE_SECTION_ID = "resource-section";
