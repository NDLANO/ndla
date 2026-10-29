#!/bin/bash
set -e

APP="$1"
VERSION="$2"
NDLAComponentName=$APP

source ./build.properties
PROJECT="$NDLAOrganization/$NDLAComponentName"

if [ -z $APP ]
then
    echo "This build-script requires an argument for the app to build."
    exit 1
fi

if [ -z $VERSION ]
then
    VERSION="SNAPSHOT"
fi

BUILD_CMD=${DOCKER_BUILD_CMD:-docker build}
BUILD_ARGS=${DOCKER_BUILD_ARGS:-}
BUILD_TAG_ARGS=${DOCKER_BUILD_TAG_ARGS:---tag $PROJECT:$VERSION}

$BUILD_CMD \
  $BUILD_ARGS \
  --target $APP \
  --build-arg COMPONENT_VERSION=$VERSION \
  --secret id=sentry_token,env=SENTRY_AUTH_TOKEN \
  $BUILD_TAG_ARGS \
  -f Dockerfile \
  ..
echo "BUILT $PROJECT:$VERSION"
