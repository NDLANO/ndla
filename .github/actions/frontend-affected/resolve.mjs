import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";

const showProjects = (...args) =>
  JSON.parse(
    execFileSync("pnpm", ["exec", "nx", "show", "projects", "--json", ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
    }),
  );

const only = (process.env.ONLY ?? "").trim();
const all = process.env.ALL === "true";

const resolve = () => {
  if (only) return { projects: [only], why: `explicitly requested: ${only}` };
  if (all) return { projects: showProjects(), why: "every project explicitly requested" };
  try {
    return { projects: showProjects("--affected"), why: `comparing ${process.env.NX_BASE} against HEAD` };
  } catch (error) {
    return { projects: showProjects(), why: `could not resolve affected projects (${error.message}); assuming all` };
  }
};

const { projects, why } = resolve();
console.log(`::notice::Selected ${projects.length} project(s) (${why})`);

/** Narrows the selection to the projects nx reports for `filters`, e.g. those carrying a tag. */
const restrictTo = (...filters) => {
  const allowed = new Set(showProjects(...filters));
  return projects.filter((project) => allowed.has(project));
};

const outputs = {
  projects,
  count: projects.length,
  e2e: restrictTo("--with-target", "e2e:headless"),
  releasable: restrictTo("--projects", "tag:releasable"),
};

for (const [name, value] of Object.entries(outputs)) {
  const json = JSON.stringify(value);
  console.log(`${name}: ${json}`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${json}\n`);
}
