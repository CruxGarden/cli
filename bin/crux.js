#!/usr/bin/env node
import { program } from "commander";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  showBanner,
  startNursery,
  stopNursery,
  restartNursery,
  statusNursery,
  logsNursery,
  cleanNursery,
  purgeNursery,
  updateNursery,
  resetNursery,
  connectNurseryDb,
  connectNurseryRedis,
  connectNurseryApi,
  stopNurseryDb,
} from "../lib/commands.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(join(__dirname, "..", "package.json"), "utf-8"),
);

program
  .name("crux")
  .description("Crux Garden CLI")
  .version(packageJson.version);

// Nursery environment commands
const nursery = program
  .command("nursery")
  .description("Manage the Nursery environment (demo/trial environment)");

nursery
  .command("start [env...]")
  .description("Start the Nursery environment (app, api, postgres, redis)")
  .option("--db-only", "Start only database services (postgres, redis)")
  .option("--api-only", "Start only API services (api, postgres, redis) without app")
  .option("--no-banner", "Hide the startup banner")
  .action((envVars, options) => {
    if (!options.noBanner) showBanner();
    startNursery(options, envVars);
  });

nursery
  .command("stop")
  .description("Stop the Nursery environment")
  .action(stopNursery);

nursery
  .command("restart [env...]")
  .description("Restart the Nursery environment")
  .option("--db-only", "Restart only database services (postgres, redis)")
  .option("--api-only", "Restart only API services (api, postgres, redis) without app")
  .action((envVars, options) => restartNursery(options, envVars));

nursery
  .command("status")
  .description("Show status of Nursery services")
  .action(statusNursery);

nursery
  .command("logs")
  .description("Show logs from Nursery services")
  .option("-f, --follow", "Follow log output")
  .action(logsNursery);

nursery
  .command("clean")
  .description("Stop and remove all Nursery containers and volumes")
  .action(cleanNursery);

nursery
  .command("purge")
  .description(
    "Stop and remove ALL Nursery resources (containers, volumes, AND images)",
  )
  .action(purgeNursery);

nursery
  .command("update")
  .description("Download the latest API image from ghcr.io")
  .action(updateNursery);

nursery
  .command("reset [env...]")
  .description("Complete fresh reset (stop, clean, pull latest image, restart)")
  .action(resetNursery);

// Nursery database commands
const nurseryDb = nursery
  .command("db")
  .description("Manage Nursery database services");

nurseryDb
  .command("start [env...]")
  .description("Start only Nursery database services (postgres, redis)")
  .action((envVars) => startNursery({ dbOnly: true }, envVars));

nurseryDb
  .command("stop")
  .description("Stop Nursery database services")
  .action(stopNurseryDb);

nurseryDb
  .command("connect")
  .description("Connect to the Nursery PostgreSQL database")
  .action(connectNurseryDb);

// Nursery Redis commands
const nurseryRedis = nursery
  .command("redis")
  .description("Manage Nursery Redis");

nurseryRedis
  .command("connect")
  .description("Connect to Nursery Redis")
  .action(connectNurseryRedis);

// Nursery API commands
const nurseryApi = nursery.command("api").description("Manage Nursery API");

nurseryApi
  .command("start [env...]")
  .description("Start only Nursery API services (api, postgres, redis) without app")
  .action((envVars) => startNursery({ apiOnly: true }, envVars));

nurseryApi
  .command("connect")
  .description("Open a shell in the Nursery API container")
  .action(connectNurseryApi);

program.parse();
