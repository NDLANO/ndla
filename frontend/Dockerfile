# Shared stages for the app images. The root docker-bake.hcl builds `builder` and
# `runtime` from the repository root, so mise.toml (node + pnpm versions) and the
# frontend/ workspace are both in the context, and hands them to each app's
# Dockerfile as `frontend-builder` and `frontend-runtime`.
FROM debian:trixie-slim@sha256:f6b08b09a05725f9431502d3b5714f5c4576e82c1a84fa1debe0c24a7e0c3ec4 AS base

RUN apt-get update \
  && apt-get install -y --no-install-recommends libatomic1 \
  && rm -rf /var/lib/apt/lists/*
ENV HOME=/home/app

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

FROM base AS runtime

COPY --from=builder /opt/node /opt/node
ENV PATH=/opt/node/bin:$PATH NODE_ENV=production
RUN useradd --uid 1000 --user-group node

ARG COMPONENT_VERSION
ENV COMPONENT_VERSION=$COMPONENT_VERSION
USER node
