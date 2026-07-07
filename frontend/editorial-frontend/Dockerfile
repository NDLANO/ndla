### Build stage
# Built from the frontend/ workspace root so the @ndla/* workspace
# dependencies resolve. Build context is frontend/ (see build.sh).
FROM node:24.13.0-alpine3.23 AS builder

ENV HOME=/home/app
WORKDIR /home/app

# Copy the whole frontend workspace (node_modules/build output excluded via
# frontend/.dockerignore) so the workspace dependency graph resolves.
COPY . .

RUN corepack enable
RUN yarn install --immutable
RUN yarn build:packages
RUN yarn workspace editorial-frontend build

### Run stage
FROM node:24.13.0-alpine3.23

WORKDIR /home/app/editorial-frontend
COPY --from=builder /home/app/editorial-frontend/build build

ENV NODE_ENV=production
ENV APPLICATION_NAME="editorial-frontend"

CMD ["node", "build/server.mjs"]
