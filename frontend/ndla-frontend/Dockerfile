FROM frontend-builder AS build
RUN --mount=type=secret,id=sentry_token \
  export SENTRY_AUTH_TOKEN=$(cat /run/secrets/sentry_token) && \
  pnpm exec nx build ndla-frontend

FROM frontend-runtime
WORKDIR /home/app/ndla-frontend
COPY --from=build /home/app/ndla-frontend/build build
ENV APPLICATION_NAME="ndla-frontend"
CMD ["node", "--enable-source-maps", "build/server/index.js"]
