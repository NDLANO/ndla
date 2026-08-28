### Build stage
# Built from the frontend/ workspace root so the @ndla/* workspace
# dependencies resolve. Build context is frontend/ (see build.sh).
FROM node:24.20.0-alpine3.24 AS builder

ENV HOME=/home/app
WORKDIR /home/app

# Copy the whole frontend workspace (node_modules/build output excluded via
# frontend/.dockerignore) so the workspace dependency graph resolves.
COPY . .

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
RUN pnpm install --frozen-lockfile

RUN pnpm exec nx build graphql-api

### Run stage
FROM node:24.20.0-alpine3.24

WORKDIR /home/app/graphql-api
COPY --from=builder /home/app/graphql-api/build/ ./

ENV NODE_ENV=production

CMD ["node", "--enable-source-maps", "server.mjs"]
