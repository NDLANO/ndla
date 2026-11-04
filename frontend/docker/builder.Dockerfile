FROM jdxcode/mise:2026.11.1@sha256:0ae21598dabb18ae6e30da209c44ef92f5b8085986c1762f1259cb2ef0e0949f AS mise
FROM frontend-base

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*
  
COPY --from=mise /usr/local/bin/mise /usr/local/bin/mise

ENV MISE_DATA_DIR=/mise
ENV MISE_TRUSTED_CONFIG_PATHS=/home/app
ENV MISE_DISABLE_TOOLS=java
ENV PATH=/mise/shims:$PATH
WORKDIR /home/app

COPY mise.toml .
RUN mise install && cp -a "$(mise where node)" /opt/node

COPY frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml ./
COPY frontend/patches patches
RUN pnpm fetch

# Copy the whole frontend workspace so the workspace dependency graph resolves.
COPY frontend/ .
RUN pnpm install --offline --frozen-lockfile

ARG COMPONENT_VERSION
ENV COMPONENT_VERSION=$COMPONENT_VERSION
