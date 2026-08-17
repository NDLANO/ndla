### Build stage
# Built from the frontend/ workspace root so the single yarn.lock resolves.
# Build context is frontend/ (see build.sh).
FROM node:24.13.0-alpine3.23 AS builder

ENV HOME=/home/app
WORKDIR /home/app

# Copy the whole frontend workspace (node_modules/build output excluded via
# frontend/.dockerignore) so the workspace dependency graph resolves.
COPY . .

RUN corepack enable
RUN yarn install --immutable
RUN yarn workspace api-documentation build

# tsc does not bundle, and swagger-ui-dist is served straight from node_modules,
# so the runtime stage needs a dependency tree. Prune the dev dependencies.
RUN yarn workspaces focus --production api-documentation

### Run stage
FROM node:24.13.0-alpine3.23

ENV HOME=/home/app
WORKDIR /home/app/api-documentation

COPY --from=builder /home/app/node_modules /home/app/node_modules
COPY --from=builder /home/app/api-documentation/dist ./dist

ENV NODE_ENV=production

EXPOSE 3000
USER node

CMD ["node", "--enable-source-maps", "dist/server.js"]
