/**
 * Copyright (c) 2024-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { LtiData } from "../interfaces";

const bodyFields: Record<string, { required: boolean; value?: any }> = {
  lti_message_type: {
    required: true,
    value: ["basic-lti-launch-request", "ToolProxyRegistrationRequest", "ContentItemSelectionRequest"],
  },
  lti_version: { required: true, value: ["LTI-1p0", "LTI-2p0"] },
  launch_presentation_return_url: { required: false },
  launch_presentation_document_target: { required: false },
  launch_presentation_height: { required: false },
  launch_presentation_width: { required: false },
};

export function parseAndValidateParameters(body: any) {
  let validBody = true;
  const errorMessages: { field: string; message: string }[] = [];
  Object.keys(bodyFields).forEach((key) => {
    const bodyValue = body[key];
    if (bodyFields[key]?.required && !bodyValue) {
      validBody = false;
      errorMessages.push({ field: key, message: "Missing required field" });
      return;
    }
    if (bodyFields[key]?.value && !bodyFields[key]?.value.includes(bodyValue)) {
      errorMessages.push({
        field: key,
        message: `Value should be one of ${bodyFields[key]?.value}`,
      });
      validBody = false;
    }
  });
  return validBody
    ? {
        valid: true,
        ltiData: {
          ...body,
        },
      }
    : { valid: false, messages: errorMessages };
}

type LtiLaunch = { valid: true; ltiData: LtiData } | { valid: false; error: string };

/** Validates the parameters an LTI consumer posts to `/lti`. */
export const parseLtiLaunch = (body: unknown): LtiLaunch => {
  const result = parseAndValidateParameters(body ?? {});
  if (result.valid) {
    return { valid: true, ltiData: result.ltiData };
  }
  const messages = result.messages?.map((msg) => `Field ${msg.field} with error: ${msg.message}.`).join(",");
  return { valid: false, error: `Bad request. ${messages}` };
};
