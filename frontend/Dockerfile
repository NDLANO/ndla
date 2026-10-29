# Built from the repository root so mise.toml (node + pnpm versions) and the
# frontend/ workspace are both in the build context. Every app is a target named
# after its component, e.g. `./build.sh ndla-frontend` (see build.sh).
FROM debian:trixie-slim@sha256:f6b08b09a05725f9431502d3b5714f5c4576e82c1a84fa1debe0c24a7e0c3ec4 AS base

RUN apt-get update \
  && apt-get install -y --no-install-recommends libatomic1 \
  && rm -rf /var/lib/apt/lists/*
ENV HOME=/home/app

### Build stages
FROM base AS builder

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY --from=jdxcode/mise:2026.10.21@sha256:a9a1654a19d150535bcaede142ff69368f18ec11f32986f6ed944d1c811702af /usr/local/bin/mise /usr/local/bin/mise

ENV MISE_DATA_DIR=/mise MISE_TRUSTED_CONFIG_PATHS=/home/app MISE_DISABLE_TOOLS=java PATH=/mise/shims:$PATH
WORKDIR /home/app

COPY mise.toml .
RUN mise install && cp -a "$(mise where node)" /opt/node

# Copy the whole frontend workspace (node_modules/build output excluded via
# .dockerignore) so the workspace dependency graph resolves.
COPY frontend/ .
RUN pnpm install --frozen-lockfile

ARG COMPONENT_VERSION
ENV COMPONENT_VERSION=$COMPONENT_VERSION

FROM builder AS api-documentation-build
RUN pnpm exec nx build api-documentation
# swagger-ui-dist is external, so the package must exist under node_modules at runtime.
RUN pnpm --fail-if-no-match --filter=api-documentation deploy --prod --legacy /home/app/deploy

FROM builder AS editorial-frontend-build
RUN --mount=type=secret,id=sentry_token \
  export SENTRY_AUTH_TOKEN=$(cat /run/secrets/sentry_token) && \
  pnpm exec nx build editorial-frontend

FROM builder AS graphql-api-build
RUN pnpm exec nx build graphql-api

FROM builder AS ndla-frontend-build
RUN --mount=type=secret,id=sentry_token \
  export SENTRY_AUTH_TOKEN=$(cat /run/secrets/sentry_token) && \
  pnpm exec nx build ndla-frontend

### Run stages
FROM base AS runtime

COPY --from=builder /opt/node /opt/node
ENV PATH=/opt/node/bin:$PATH NODE_ENV=production
RUN useradd --uid 1000 --user-group node

ARG COMPONENT_VERSION
ENV COMPONENT_VERSION=$COMPONENT_VERSION
USER node

FROM runtime AS api-documentation
WORKDIR /home/app/api-documentation
COPY --from=api-documentation-build /home/app/deploy/node_modules ./node_modules
COPY --from=api-documentation-build /home/app/api-documentation/build ./build
EXPOSE 3000
CMD ["node", "--enable-source-maps", "build/server.mjs"]

FROM runtime AS editorial-frontend
WORKDIR /home/app/editorial-frontend
COPY --from=editorial-frontend-build /home/app/editorial-frontend/build build
ENV APPLICATION_NAME="editorial-frontend"
CMD ["node", "--enable-source-maps", "build/server/index.js"]

FROM runtime AS graphql-api
WORKDIR /home/app/graphql-api
COPY --from=graphql-api-build /home/app/graphql-api/build/ ./
CMD ["node", "--enable-source-maps", "server.mjs"]

FROM runtime AS ndla-frontend
WORKDIR /home/app/ndla-frontend
COPY --from=ndla-frontend-build /home/app/ndla-frontend/build build
ENV APPLICATION_NAME="ndla-frontend"
CMD ["node", "--enable-source-maps", "build/server/index.js"]
