/**
 * Copyright (c) 2017-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { parseAndValidateParameters, parseLtiLaunch } from "../ltiLaunch";

test("parseLtiLaunch accepts a launch", () => {
  const body = {
    lti_message_type: "basic-lti-launch-request",
    lti_version: "LTI-1p0",
    launch_presentation_return_url: "http://ndla-api/some-return-url",
    launch_presentation_document_target: "iframe",
    launch_presentation_height: "800",
    launch_presentation_width: "1200",
  };
  expect(parseLtiLaunch(body)).toEqual({ valid: true, ltiData: body });
});

test("parseLtiLaunch accepts a launch with only required params", () => {
  const body = {
    lti_message_type: "basic-lti-launch-request",
    lti_version: "LTI-1p0",
  };
  expect(parseLtiLaunch(body)).toEqual({ valid: true, ltiData: body });
});

test("parseLtiLaunch rejects a launch without a version", () => {
  const body = {
    lti_message_type: "basic-lti-launch-request",
    launch_presentation_return_url: "http://ndla-api/some-return-url",
    launch_presentation_document_target: "iframe",
    launch_presentation_height: "800",
    launch_presentation_width: "1200",
  };
  expect(parseLtiLaunch(body)).toEqual({
    valid: false,
    error: "Bad request. Field lti_version with error: Missing required field.",
  });
});

test("parseLtiLaunch rejects a launch with a wrong version", () => {
  const body = {
    lti_message_type: "basic-lti-launch-request",
    lti_version: "wrong version",
    launch_presentation_return_url: "http://ndla-api/some-return-url",
    launch_presentation_document_target: "iframe",
    launch_presentation_height: "800",
    launch_presentation_width: "1200",
  };
  expect(parseLtiLaunch(body)).toEqual({
    valid: false,
    error: "Bad request. Field lti_version with error: Value should be one of LTI-1p0,LTI-2p0.",
  });
});

test("parseLtiLaunch rejects a missing body", () => {
  expect(parseLtiLaunch(undefined)).toEqual({
    valid: false,
    error:
      "Bad request. Field lti_message_type with error: Missing required field.,Field lti_version with error: Missing required field.",
  });
});

test("parseAndValidateParameters no errors", () => {
  const body = {
    lti_message_type: "basic-lti-launch-request",
    lti_version: "LTI-1p0",
    launch_presentation_return_url: "http://ndla-api/some-return-url",
    launch_presentation_document_target: "iframe",
    launch_presentation_height: "800",
    launch_presentation_width: "1200",
  };
  const result = parseAndValidateParameters(body);
  expect(result).toMatchSnapshot();
});

test("parseAndValidateParameters errors", () => {
  const body = {};
  const result = parseAndValidateParameters(body);
  expect(result).toMatchSnapshot();
});
