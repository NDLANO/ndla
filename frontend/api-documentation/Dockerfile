### Build stage
# Built from the frontend/ workspace root so the single pnpm-lock.yaml resolves.
# Build context is frontend/ (see build.sh).
FROM node:24.20.0-alpine3.24 AS builder

ENV HOME=/home/app
WORKDIR /home/app

# Copy the whole frontend workspace (node_modules/build output excluded via
# frontend/.dockerignore) so the workspace dependency graph resolves.
COPY . .

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
RUN pnpm install --frozen-lockfile
RUN pnpm --fail-if-no-match --filter api-documentation run build

# swagger-ui-dist is external, so the package must exist under node_modules at runtime.
RUN pnpm --fail-if-no-match --filter=api-documentation deploy --prod --legacy /home/app/deploy

### Run stage
FROM node:24.20.0-alpine3.24

ENV HOME=/home/app
WORKDIR /home/app/api-documentation

COPY --from=builder /home/app/deploy/node_modules ./node_modules
COPY --from=builder /home/app/api-documentation/build ./build

ENV NODE_ENV=production

EXPOSE 3000
USER node

CMD ["node", "--enable-source-maps", "build/server.mjs"]
