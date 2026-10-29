FROM frontend-base

COPY --from=frontend-builder /opt/node /opt/node
ENV PATH=/opt/node/bin:$PATH NODE_ENV=production
RUN useradd --uid 1000 --user-group node

ARG COMPONENT_VERSION
ENV COMPONENT_VERSION=$COMPONENT_VERSION
USER node
