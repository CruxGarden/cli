import { afterEach, beforeEach, expect, test } from "@jest/globals";
import { execFileSync } from "node:child_process";
import {
  realpathSync,
  statSync,
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

let scratch;
let work;
let env;
beforeEach(() => {
  scratch = realpathSync(mkdtempSync(join(tmpdir(), "crux-cli-")));
  work = join(scratch, "work $(printf exploited) with spaces");
  const bin = join(scratch, "bin");
  mkdirSync(work);
  mkdirSync(bin);
  writeFileSync(join(work, ".env"), "API_PORT=3001\n");
  for (const name of ["docker", "docker-compose"]) {
    writeFileSync(
      join(bin, name),
      `#!/usr/bin/env node
require('fs').appendFileSync(process.env.CRUX_TEST_LOG, JSON.stringify(process.argv.slice(2)) + '\\n');
`,
      { mode: 0o755 },
    );
  }
  env = {
    ...process.env,
    PATH: `${bin}:${process.env.PATH}`,
    CRUX_TEST_LOG: join(scratch, "calls"),
    XDG_CONFIG_HOME: join(scratch, "config"),
    CRUX_BANNER_SHOWN: "1",
  };
});
afterEach(() => rmSync(scratch, { recursive: true, force: true }));

function run(...args) {
  execFileSync(process.execPath, [resolve("bin/crux.js"), "nursery", ...args], {
    cwd: work,
    env,
    stdio: "pipe",
  });
  return readFileSync(env.CRUX_TEST_LOG, "utf8")
    .trim()
    .split("\n")
    .map(JSON.parse);
}

test("passes an environment filename containing spaces and shell syntax as one literal argument", () => {
  const calls = run("status");
  const compose = calls.find((args) => args.includes("ps"));
  expect(compose).toContain(join(work, ".env"));
  expect(compose).not.toContain(
    join(scratch, "work exploited with spaces", ".env"),
  );
});

test.each([
  ["stop", "down"],
  ["logs", "logs"],
  ["start", "up"],
])(
  "%s uses the same literal configuration arguments through asynchronous and synchronous runners",
  (command, verb) => {
    expect(run(command).find((args) => args.includes(verb))).toContain(
      join(work, ".env"),
    );
  },
);

test("creates a private persistent signing key and puts caller overrides after it", () => {
  const first = run("status").find((args) => args.includes("ps"));
  const defaults = first[first.indexOf("--env-file") + 1];
  const content = readFileSync(defaults, "utf8");
  expect(content).toMatch(/^JWT_SECRET=[a-f0-9]{64}\n$/);
  if (process.platform !== "win32")
    expect(statSync(defaults).mode & 0o777).toBe(0o600);
  run("stop");
  expect(readFileSync(defaults, "utf8")).toBe(content);
  expect(first.indexOf(join(work, ".env"))).toBeGreaterThan(
    first.indexOf(defaults),
  );
});
