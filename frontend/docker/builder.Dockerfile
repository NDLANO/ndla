FROM jdxcode/mise:2026.11.8@sha256:5c6e71a86c8c997c32d30a169b4269bec9d4681a804e29078bac8f44109f2edc AS mise
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
RUN pnpm fetch

# Copy the whole frontend workspace so the workspace dependency graph resolves.
COPY frontend/ .
RUN pnpm install --offline --frozen-lockfile

ARG COMPONENT_VERSION
ENV COMPONENT_VERSION=$COMPONENT_VERSION
