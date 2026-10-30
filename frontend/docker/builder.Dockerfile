FROM jdxcode/mise:2026.10.23@sha256:c13bf248d1d2939fb0597df3fbeeac5bd39c53d0210364d1ca00b126ed1212d2 AS mise
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
