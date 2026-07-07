### Build stage
# Built from the frontend/ workspace root so the @ndla/* workspace
# dependencies resolve. Build context is frontend/ (see build.sh).
FROM node:24.13.0-alpine3.23 AS builder

ENV HOME=/home/app
ARG COMPONENT_VERSION
ENV COMPONENT_VERSION=$COMPONENT_VERSION
WORKDIR /home/app

# Copy the whole frontend workspace (node_modules/build output excluded via
# frontend/.dockerignore) so the workspace dependency graph resolves.
COPY . .

RUN corepack enable
RUN yarn install --immutable
RUN yarn build:packages

# Build client + server code
RUN --mount=type=secret,id=sentry_token \
  export SENTRY_AUTH_TOKEN=$(cat /run/secrets/sentry_token) && \
  yarn workspace ndla-frontend build

### Run stage
FROM node:24.13.0-alpine3.23

WORKDIR /home/app/ndla-frontend
COPY --from=builder /home/app/ndla-frontend/build build

ENV NODE_ENV=production
ARG COMPONENT_VERSION
ENV COMPONENT_VERSION=$COMPONENT_VERSION
ENV APPLICATION_NAME="ndla-frontend"

CMD ["node", "build/server.js"]
