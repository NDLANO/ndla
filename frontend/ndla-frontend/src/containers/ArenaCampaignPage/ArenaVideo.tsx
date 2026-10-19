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
import type { StyledProps } from "@ndla/styled-system/types";
import { Suspense } from "react";
import type { GQLArenaCampaignVideoQuery, GQLArenaCampaignVideoQueryVariables } from "../../graphqlTypes";

export const arenaVideoIds = {
  janEirik: "6406951311112",
  ingebjorg: "6406950532112",
  anneTrine: "6406951019112",
};

const StyledIframe = styled("iframe", {
  base: {
    width: "full",
    background: "surface.disabled",
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
            width
            height
          }
        }
      }
    }
  }
`;

interface Props extends StyledProps {
  videoId: string;
  title: string;
}

const ArenaVideoContent = ({ videoId, title, ...rest }: Props) => {
  const { data } = useSuspenseQuery(arenaCampaignVideoQuery, { variables: { id: videoId } });
  const iframe = data?.resourceEmbed.meta.brightcoves[0]?.iframe;

  if (!iframe?.src) return null;

  return (
    <StyledIframe
      allow="fullscreen; encrypted-media"
      src={iframe.src}
      title={title}
      style={{ aspectRatio: `${iframe.width} / ${iframe.height}` }}
      {...rest}
    />
  );
};

export const ArenaVideo = (props: Props) => (
  <Suspense>
    <ArenaVideoContent {...props} />
  </Suspense>
);
