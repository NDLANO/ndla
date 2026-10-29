FROM jdxcode/mise:2026.10.21@sha256:a9a1654a19d150535bcaede142ff69368f18ec11f32986f6ed944d1c811702af AS mise
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

# Copy the whole frontend workspace so the workspace dependency graph resolves.
COPY frontend/ .
RUN pnpm install --frozen-lockfile

ARG COMPONENT_VERSION
ENV COMPONENT_VERSION=$COMPONENT_VERSION
