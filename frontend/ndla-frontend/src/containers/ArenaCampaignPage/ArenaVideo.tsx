/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { gql, type TypedDocumentNode } from "@apollo/client";
import { useSuspenseQuery } from "@apollo/client/react";
import { styled } from "@ndla/styled-system/jsx";
import { Suspense } from "react";
import type { GQLArenaCampaignVideoQuery, GQLArenaCampaignVideoQueryVariables } from "../../graphqlTypes";

export const arenaVideoIds = {
  janEirik: "6406951311112",
  ingebjorg: "6406950532112",
  anneTrine: "6406951019112",
};

const VideoFrame = styled("div", {
  base: {
    width: "100%",
    aspectRatio: "9 / 16",
    background: "surface.disabled",
  },
});

const StyledIframe = styled("iframe", {
  base: {
    width: "100%",
    height: "100%",
  },
});

const arenaCampaignVideoQuery: TypedDocumentNode<GQLArenaCampaignVideoQuery, GQLArenaCampaignVideoQueryVariables> = gql`
  query arenaCampaignVideo($id: String!) {
    resourceEmbed(id: $id, type: "video") {
      meta {
        brightcoves {
          id
          iframe {
            src
          }
        }
      }
    }
  }
`;

interface Props {
  videoId: string;
  title: string;
}

const ArenaVideoContent = ({ videoId, title }: Props) => {
  const { data } = useSuspenseQuery(arenaCampaignVideoQuery, { variables: { id: videoId } });
  const src = data?.resourceEmbed.meta.brightcoves[0]?.iframe?.src;

  if (!src) return null;

  return <StyledIframe allow="fullscreen; encrypted-media" src={src} title={title} />;
};

export const ArenaVideo = (props: Props) => (
  <VideoFrame>
    <Suspense>
      <ArenaVideoContent {...props} />
    </Suspense>
  </VideoFrame>
);
