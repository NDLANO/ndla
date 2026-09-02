/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export const BodyInfo = () => (
  <>
    <div id="ndla_header">
      <a href="/" className="home">
        APIs from NDLA
      </a>
      <div id="slogan">
        <a href="https://ndla.no">
          <img src="/static/pictures/ndla-logo.svg" alt="NDLA" />
        </a>
        <p>Open Educational Resources For Secondary Schools</p>
      </div>
    </div>
    <div id="ingress_block">
      <p>
        NDLA provides a rich set of endpoints to extract articles and specific components of our content. All content is
        made available based on content licenses and the specific licence is included in metadata and can be used to
        filter the result.
      </p>
      <p>In addition, we provide a search-api for all our content based on Elasticsearch simple search language.</p>
      <p>
        This is a beta level service, with no liability for the quality of the content and what the content is used for.
      </p>
    </div>
  </>
);
