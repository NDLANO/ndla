import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";

const showProjects = (...args) =>
  JSON.parse(
    execFileSync("yarn", ["nx", "show", "projects", "--json", ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
    }),
  );

const resolve = () => {
  try {
    return { projects: showProjects("--affected"), affected: true };
  } catch (error) {
    console.log(`::warning::Could not resolve affected projects (${error.message}); assuming all`);
    return { projects: showProjects(), affected: false };
  }
};

const { projects, affected } = resolve();
const e2eArgs = affected ? ["--affected"] : [];

const outputs = {
  projects,
  count: projects.length,
  e2e: showProjects(...e2eArgs, "--with-target", "e2e:headless"),
};

for (const [name, value] of Object.entries(outputs)) {
  const json = JSON.stringify(value);
  console.log(`${name}: ${json}`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${json}\n`);
}
