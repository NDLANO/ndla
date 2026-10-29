# Built by the root docker-bake.hcl from the repository root, so mise.toml
# (node + pnpm versions) and the frontend/ workspace are both in the context.
FROM frontend-base

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY --from=jdxcode/mise:2026.10.21@sha256:a9a1654a19d150535bcaede142ff69368f18ec11f32986f6ed944d1c811702af /usr/local/bin/mise /usr/local/bin/mise

ENV MISE_DATA_DIR=/mise MISE_TRUSTED_CONFIG_PATHS=/home/app MISE_DISABLE_TOOLS=java PATH=/mise/shims:$PATH
WORKDIR /home/app

COPY mise.toml .
RUN mise install && cp -a "$(mise where node)" /opt/node

# Copy the whole frontend workspace (node_modules/build output excluded via .dockerignore) so the workspace dependency graph resolves.
COPY frontend/ .
RUN pnpm install --frozen-lockfile

ARG COMPONENT_VERSION
ENV COMPONENT_VERSION=$COMPONENT_VERSION
