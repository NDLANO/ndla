FROM frontend-builder AS build
RUN pnpm exec nx build mcp-server

FROM frontend-runtime
WORKDIR /home/app/mcp-server
COPY --from=build /home/app/mcp-server/build/ ./
CMD ["node", "--enable-source-maps", "server.mjs"]
