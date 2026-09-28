/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export function getEnvironmentVariabel(key: string, fallback: string): string;
export function getEnvironmentVariabel(key: string, fallback?: string): string | undefined;
export function getEnvironmentVariabel(key: string, fallback?: string): string | undefined {
  const env = "env";
  const variabel = process[env][key]; // Hack to prevent DefinePlugin replacing process.env
  return variabel || fallback;
}

const toInt = (key: string, fallback: number): number => {
  const parsed = parseInt(getEnvironmentVariabel(key, `${fallback}`), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const toList = (value: string | undefined): string[] =>
  value
    ?.split(",")
    .map((v) => v.trim())
    .filter(Boolean) ?? [];

export const ndlaEnvironment = getEnvironmentVariabel("NDLA_ENVIRONMENT", "test");
export const environmentApiHost = `api.${ndlaEnvironment.replace("_", "-")}.ndla.no`;

const parseTrustProxy = (value: string | undefined): boolean | number | string | undefined => {
  if (!value) return undefined;
  if (value === "true" || value === "false") return value === "true";
  return /^\d+$/.test(value) ? parseInt(value, 10) : value;
};

const ndlaApiUrl = () => {
  const host = getEnvironmentVariabel("API_GATEWAY_HOST");
  if (host) return `http://${host}`;
  switch (ndlaEnvironment) {
    case "local":
      return "http://api-gateway.ndla-local";
    case "prod":
      return "https://api.ndla.no";
    default:
      return `https://${environmentApiHost}`;
  }
};

const ndlaFrontendUrl = () => {
  switch (ndlaEnvironment) {
    case "local":
      return "http://localhost:3000";
    case "prod":
      return "https://ndla.no";
    default:
      return `https://${ndlaEnvironment.replace("_", "-")}.ndla.no`;
  }
};

export const port = toInt("PORT", 4100);
export const apiUrl = getEnvironmentVariabel("API_URL", ndlaApiUrl());
export const graphqlApiUrl = getEnvironmentVariabel("GRAPHQL_API_URL", `${apiUrl}/graphql-api/graphql`);
export const ndlaUrl = getEnvironmentVariabel("NDLA_URL", ndlaFrontendUrl());
export const defaultLanguage = getEnvironmentVariabel("DEFAULT_LANGUAGE", "nb");
export const allowedHosts = toList(getEnvironmentVariabel("ALLOWED_HOSTS"));
export const rateLimitPerMinute = toInt("RATE_LIMIT_PER_MINUTE", 0);
export const trustProxy = parseTrustProxy(getEnvironmentVariabel("TRUST_PROXY"));
export const maxPageSize = toInt("MAX_PAGE_SIZE", 20);
export const maxContentLength = toInt("MAX_CONTENT_LENGTH", 60_000);
export const requestTimeoutMs = toInt("REQUEST_TIMEOUT_MS", 10_000);
export const cacheTtlMs = toInt("CACHE_TTL_MS", 5 * 60 * 1000);
export const cacheMaxBytes = toInt("CACHE_MAX_BYTES", 100_000_000);
export const serverVersion = getEnvironmentVariabel("COMPONENT_VERSION", "SNAPSHOT");
