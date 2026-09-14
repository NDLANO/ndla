/**
 * Copyright (c) 2023-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import config from "../../config";

interface Props {
  trackerUrl: string;
  containerId: string;
}

const MatomoTagManager = ({ trackerUrl, containerId }: Props) => {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
        var _mtm = window._mtm = window._mtm || [];
        _mtm.push({'mtm.startTime': (new Date().getTime()), 'event': 'mtm.Start'});
        var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
        g.async=true; g.src='${trackerUrl}/js/${containerId}.js'; s.parentNode.insertBefore(g,s);`,
      }}
    />
  );
};

export const Tagmanager = () => {
  if (config.matomoTagmanagerId) {
    return <MatomoTagManager containerId={config.matomoTagmanagerId} trackerUrl={config.matomoUrl} />;
  }
  return null;
};
