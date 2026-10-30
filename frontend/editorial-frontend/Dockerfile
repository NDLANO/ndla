FROM frontend-builder AS build
RUN --mount=type=secret,id=sentry_token,env=SENTRY_AUTH_TOKEN pnpm exec nx build editorial-frontend

FROM frontend-runtime
WORKDIR /home/app/editorial-frontend
COPY --from=build /home/app/editorial-frontend/build build
ENV APPLICATION_NAME="editorial-frontend"
CMD ["node", "--enable-source-maps", "build/server/index.js"]
