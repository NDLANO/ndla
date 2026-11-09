/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createServer } from "node:net";

/** Login only works on the ports registered with Feide and Auth0, so every app scans upwards from its usual port */
const devPorts: Record<string, { env: string; base: number }> = {
  "ndla-frontend": { env: "NDLA_FRONTEND_PORT", base: 3000 },
  "editorial-frontend": { env: "EDITORIAL_FRONTEND_PORT", base: 3000 },
  "api-documentation": { env: "API_DOCUMENTATION_PORT", base: 3000 },
  "graphql-api": { env: "LOCAL_GRAPHQL_API_PORT", base: 4000 },
  "design-manual": { env: "SBCONFIG_PORT", base: 6006 },
};

const MAX_PORT = 65535;

const canListen = (port: number, host?: string): Promise<boolean> =>
  new Promise((resolve) => {
    const server = createServer();
    server.once("error", (error: NodeJS.ErrnoException) => resolve(error.code !== "EADDRINUSE"));
    server.listen({ port, host }, () => server.close(() => resolve(true)));
  });

/** the apps listen on every interface, but something else may hold only the IPv4 wildcard or one of the loopback addresses */
const isFree = async (port: number): Promise<boolean> =>
  (await canListen(port)) &&
  (await canListen(port, "0.0.0.0")) &&
  (await canListen(port, "127.0.0.1")) &&
  (await canListen(port, "::1"));

const firstFree = async (from: number, taken: Set<number>): Promise<number> => {
  for (let port = from; port <= MAX_PORT; port++) {
    if (!taken.has(port) && (await isFree(port))) return port;
  }
  throw new Error(`No free port at or above ${from}`);
};

export interface DevPort {
  project: string;
  env: string;
  port: number;
}

export const isValidPort = (port: number): boolean => Number.isInteger(port) && port > 0 && port <= MAX_PORT;

/** `explicitPort` pins the first project, the rest get the first free port from their base */
export const allocatePorts = async (projects: string[], explicitPort?: number): Promise<DevPort[]> => {
  const taken = new Set<number>();
  const allocated: DevPort[] = [];
  for (const [index, project] of projects.entries()) {
    const config = devPorts[project];
    if (!config) continue;
    const port = index === 0 && explicitPort !== undefined ? explicitPort : await firstFree(config.base, taken);
    taken.add(port);
    allocated.push({ project, env: config.env, port });
  }
  return allocated;
};
