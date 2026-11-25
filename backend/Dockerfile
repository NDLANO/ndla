ARG JAVA_MAJOR_VERSION=25

FROM eclipse-temurin:${JAVA_MAJOR_VERSION}-alpine AS builder
ARG MODULE
WORKDIR /app
RUN apk add --no-cache curl
COPY . .
# Maven Central intermittently answers 404 or 429 for the launcher's download.
RUN for attempt in 1 2 3 4 5; do ./mill -i --version && break; sleep $((attempt * 5)); done
RUN ./mill -i ${MODULE}.assembly

FROM eclipse-temurin:${JAVA_MAJOR_VERSION}-jre-alpine
ARG MODULE
WORKDIR /app
RUN apk add fontconfig && apk add ttf-dejavu
COPY --from=builder /app/out/${MODULE}/assembly.dest/out.jar /app/out.jar
ENV LOG_APPENDER=Docker
COPY jvm-runtime-options /app/jvm-runtime-options
ENTRYPOINT ["sh", "-c", "exec java @/app/jvm-runtime-options $JAVA_OPTS -jar /app/out.jar"]
