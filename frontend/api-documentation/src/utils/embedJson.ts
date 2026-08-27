/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Escaping `<` means no value can produce a `</script>` sequence, and U+2028/U+2029 are legal inside
 * JSON strings but terminate a line in JavaScript.
 */
export const embedJson = (value: unknown): string =>
  JSON.stringify(value).replace(/[<\u2028\u2029]/g, (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`);
