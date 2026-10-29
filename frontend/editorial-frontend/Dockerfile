### Build stage
# Built from the frontend/ workspace root so the @ndla/* workspace
# dependencies resolve. Build context is frontend/ (see build.sh).
FROM node:26.13.0-alpine3.24@sha256:c6ad9e9c1d80f6eb607c26b4b0a132ff7a2344fad1c78ea3baa2a7d4c8de6d94 AS builder

ENV HOME=/home/app
ARG COMPONENT_VERSION
ENV COMPONENT_VERSION=$COMPONENT_VERSION
WORKDIR /home/app

# Copy the whole frontend workspace (node_modules/build output excluded via
# frontend/.dockerignore) so the workspace dependency graph resolves.
COPY . .

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
RUN pnpm install --frozen-lockfile

RUN --mount=type=secret,id=sentry_token \
  export SENTRY_AUTH_TOKEN=$(cat /run/secrets/sentry_token) && \
  pnpm exec nx build editorial-frontend

### Run stage
FROM node:26.13.0-alpine3.24@sha256:c6ad9e9c1d80f6eb607c26b4b0a132ff7a2344fad1c78ea3baa2a7d4c8de6d94

WORKDIR /home/app/editorial-frontend
COPY --from=builder /home/app/editorial-frontend/build build

ENV NODE_ENV=production
ARG COMPONENT_VERSION
ENV COMPONENT_VERSION=$COMPONENT_VERSION
ENV APPLICATION_NAME="editorial-frontend"

CMD ["node", "--enable-source-maps", "build/server/index.js"]
