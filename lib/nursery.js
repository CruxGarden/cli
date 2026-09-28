import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/** One persistent demo signing key; caller .env files and exported variables may override it. */
export function nurseryCompose() {
  const directory = join(
    process.env.XDG_CONFIG_HOME || join(homedir(), ".config"),
    "cruxgarden",
  );
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const defaults = join(directory, "nursery.env");
  try {
    writeFileSync(defaults, `JWT_SECRET=${randomBytes(32).toString("hex")}\n`, {
      flag: "wx",
      mode: 0o600,
    });
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
  const args = ["docker", "compose", "--env-file", defaults];
  const overrides = join(process.cwd(), ".env");
  if (existsSync(overrides)) args.push("--env-file", overrides);
  return [...args, "-f", "docker-compose.nursery.yml"];
}
