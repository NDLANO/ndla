# docker buildx bake ndla-frontend    (`frontend` builds every app)
# MODULE=article-api docker buildx bake backend
variable "COMPONENT_VERSION" {
  default = "SNAPSHOT"
}

variable "MODULE" {}

target "_frontend" {
  context = "."
  args    = { COMPONENT_VERSION = COMPONENT_VERSION }
}

target "frontend-builder" {
  inherits   = ["_frontend"]
  dockerfile = "frontend/Dockerfile"
  target     = "builder"
}

target "frontend-runtime" {
  inherits   = ["_frontend"]
  dockerfile = "frontend/Dockerfile"
  target     = "runtime"
}

target "frontend" {
  name       = app
  matrix     = { app = ["api-documentation", "editorial-frontend", "graphql-api", "ndla-frontend"] }
  inherits   = ["_frontend"]
  dockerfile = "frontend/${app}/Dockerfile"
  contexts = {
    frontend-builder = "target:frontend-builder"
    frontend-runtime = "target:frontend-runtime"
  }
  secret = ["id=sentry_token,env=SENTRY_AUTH_TOKEN"]
  tags   = ["ndla/${app}:${COMPONENT_VERSION}"]
}

target "backend" {
  context = "backend"
  args    = { MODULE = MODULE }
  tags    = ["ndla/${MODULE}:${COMPONENT_VERSION}"]
}
