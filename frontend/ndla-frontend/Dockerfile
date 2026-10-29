### Build stage
# Built from the repository root so mise.toml (node + pnpm versions) and the
# frontend/ workspace are both in the build context (see build.sh).
FROM debian:trixie-slim@sha256:f6b08b09a05725f9431502d3b5714f5c4576e82c1a84fa1debe0c24a7e0c3ec4 AS builder

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates libatomic1 \
  && rm -rf /var/lib/apt/lists/*
COPY --from=jdxcode/mise:2026.10.21@sha256:a9a1654a19d150535bcaede142ff69368f18ec11f32986f6ed944d1c811702af /usr/local/bin/mise /usr/local/bin/mise

ENV HOME=/home/app
ENV MISE_DATA_DIR=/mise MISE_TRUSTED_CONFIG_PATHS=/home/app MISE_DISABLE_TOOLS=java PATH=/mise/shims:$PATH
WORKDIR /home/app

COPY mise.toml .
RUN mise install && cp -a "$(mise where node)" /opt/node

ARG COMPONENT_VERSION
ENV COMPONENT_VERSION=$COMPONENT_VERSION

# Copy the whole frontend workspace (node_modules/build output excluded via
# .dockerignore) so the workspace dependency graph resolves.
COPY frontend/ .
RUN pnpm install --frozen-lockfile

# Build client + server code
RUN --mount=type=secret,id=sentry_token \
  export SENTRY_AUTH_TOKEN=$(cat /run/secrets/sentry_token) && \
  pnpm exec nx build ndla-frontend

### Run stage
FROM debian:trixie-slim@sha256:f6b08b09a05725f9431502d3b5714f5c4576e82c1a84fa1debe0c24a7e0c3ec4

RUN apt-get update \
  && apt-get install -y --no-install-recommends libatomic1 \
  && rm -rf /var/lib/apt/lists/*
COPY --from=builder /opt/node /opt/node
ENV PATH=/opt/node/bin:$PATH

WORKDIR /home/app/ndla-frontend
COPY --from=builder /home/app/ndla-frontend/build build

ENV NODE_ENV=production
ARG COMPONENT_VERSION
ENV COMPONENT_VERSION=$COMPONENT_VERSION
ENV APPLICATION_NAME="ndla-frontend"

CMD ["node", "--enable-source-maps", "build/server/index.js"]
