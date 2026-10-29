FROM frontend-builder AS build
RUN pnpm exec nx build graphql-api

FROM frontend-runtime
WORKDIR /home/app/graphql-api
COPY --from=build /home/app/graphql-api/build/ ./
CMD ["node", "--enable-source-maps", "server.mjs"]
