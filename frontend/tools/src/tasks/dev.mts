/**
 * Copyright (c) 2026-present, NDLA.
 *
 * This source code is licensed under the GPLv3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { allocatePorts, isValidPort } from "./ports.mts";
import { dispatch, frontendProjects, mill, nxWithEnv, project } from "./repo.mts";

const PORT_FLAG = "--port=";

const devFrontend = async (args: string[]): Promise<number> => {
  const candidates = frontendProjects("dev");
  const projects = [...new Set([project, ...args.filter((arg) => candidates.includes(arg))])];
  const portFlag = args.find((arg) => arg.startsWith(PORT_FLAG));
  const rest = args.filter((arg) => !candidates.includes(arg) && arg !== portFlag);

  const explicitPort = portFlag === undefined ? undefined : Number(portFlag.slice(PORT_FLAG.length));
  if (explicitPort !== undefined && !isValidPort(explicitPort)) {
    process.stderr.write(`Invalid port: ${portFlag}\n`);
    return 1;
  }

  const ports = await allocatePorts(projects, explicitPort);
  const env: Record<string, string> = Object.fromEntries(ports.map(({ env, port }) => [env, String(port)]));
  if (projects.length > 1 && projects.includes("graphql-api")) env["LOCAL_GRAPHQL_API"] = "true";
  for (const { project, port } of ports) process.stdout.write(`${project} → http://localhost:${port}\n`);

  return projects.length === 1
    ? nxWithEnv(env, "dev", project, ...rest)
    : nxWithEnv(env, "run-many", "-t", "dev", "-p", projects.join(","), ...rest);
};

export const dev = (args: string[]): Promise<number> | number =>
  dispatch(
    "dev",
    async () => mill(`${project}.run`, ...args),
    () => devFrontend(args),
  );
