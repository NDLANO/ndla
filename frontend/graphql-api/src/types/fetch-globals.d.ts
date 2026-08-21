/**
 * Copyright (c) 2025-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * The generated api clients in `@ndla/types-backend` are written against the Fetch API, whose
 * types live in TypeScript's `dom` lib. This project deliberately builds without `dom` so that
 * browser globals stay out of a server codebase, so declare the handful of Fetch types Node
 * implements but `@types/node` doesn't expose globally.
 */
declare global {
  type BodyInit = NonNullable<RequestInit["body"]>;
}

export {};
