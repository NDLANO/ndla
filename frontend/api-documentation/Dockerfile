### Build stage
# Built from the repository root so mise.toml (node + pnpm versions) and the
# frontend/ workspace are both in the build context (see build.sh).
FROM debian:trixie-slim@sha256:f6b08b09a05725f9431502d3b5714f5c4576e82c1a84fa1debe0c24a7e0c3ec4 AS builder

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates libatomic1 \
  && rm -rf /var/lib/apt/lists/*
COPY --from=jdxcode/mise:2026.10.23@sha256:c13bf248d1d2939fb0597df3fbeeac5bd39c53d0210364d1ca00b126ed1212d2 /usr/local/bin/mise /usr/local/bin/mise

ENV HOME=/home/app
ENV MISE_DATA_DIR=/mise MISE_TRUSTED_CONFIG_PATHS=/home/app MISE_DISABLE_TOOLS=java PATH=/mise/shims:$PATH
WORKDIR /home/app

COPY mise.toml .
RUN mise install && cp -a "$(mise where node)" /opt/node

# Copy the whole frontend workspace (node_modules/build output excluded via
# .dockerignore) so the workspace dependency graph resolves.
COPY frontend/ .
RUN pnpm install --frozen-lockfile
RUN pnpm exec nx build api-documentation

# swagger-ui-dist is external, so the package must exist under node_modules at runtime.
RUN pnpm --fail-if-no-match --filter=api-documentation deploy --prod --legacy /home/app/deploy

### Run stage
FROM debian:trixie-slim@sha256:f6b08b09a05725f9431502d3b5714f5c4576e82c1a84fa1debe0c24a7e0c3ec4

RUN apt-get update \
  && apt-get install -y --no-install-recommends libatomic1 \
  && rm -rf /var/lib/apt/lists/*
COPY --from=builder /opt/node /opt/node
ENV PATH=/opt/node/bin:$PATH

ENV HOME=/home/app
WORKDIR /home/app/api-documentation

COPY --from=builder /home/app/deploy/node_modules ./node_modules
COPY --from=builder /home/app/api-documentation/build ./build

ENV NODE_ENV=production

EXPOSE 3000
RUN useradd --uid 1000 --user-group node
USER node

CMD ["node", "--enable-source-maps", "build/server.mjs"]
