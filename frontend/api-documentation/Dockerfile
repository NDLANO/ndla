FROM frontend-builder AS build
RUN pnpm exec nx build api-documentation
# swagger-ui-dist is external, so the package must exist under node_modules at runtime.
RUN pnpm --fail-if-no-match --filter=api-documentation deploy --prod --legacy /home/app/deploy

FROM frontend-runtime
WORKDIR /home/app/api-documentation
COPY --from=build /home/app/deploy/node_modules ./node_modules
COPY --from=build /home/app/api-documentation/build ./build
EXPOSE 3000
CMD ["node", "--enable-source-maps", "build/server.mjs"]
