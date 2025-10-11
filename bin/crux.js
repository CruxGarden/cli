#!/usr/bin/env node
import { program } from "commander";
import {
  showBanner,
  startNursery,
  stopNursery,
  restartNursery,
  statusNursery,
  logsNursery,
  cleanNursery,
  purgeNursery,
  pullNursery,
  resetNursery,
  connectNurseryDb,
  connectNurseryRedis,
  connectNurseryApi,
  stopNurseryDb,
} from "../lib/commands.js";

program
  .name("crux")
  .description("Crux Garden CLI - Nursery Environment Manager")
  .version("0.1.0");

// Nursery environment commands
const nursery = program
  .command("nursery")
  .description("Manage the Nursery environment (demo/trial environment)");

nursery
  .command("start")
  .description("Start the Nursery environment (postgres, redis, api)")
  .option("--db-only", "Start only database services (postgres, redis)")
  .option("--no-banner", "Hide the startup banner")
  .action((options) => {
    if (!options.noBanner) showBanner();
    startNursery(options);
  });

nursery
  .command("stop")
  .description("Stop the Nursery environment")
  .action(stopNursery);

nursery
  .command("restart")
  .description("Restart the Nursery environment")
  .action(restartNursery);

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
  .command("pull")
  .description("Pull the latest API image from ghcr.io")
  .action(pullNursery);

nursery
  .command("reset")
  .description("Complete fresh reset (stop, clean, pull latest image, restart)")
  .action(resetNursery);

// Nursery database commands
const nurseryDb = nursery
  .command("db")
  .description("Manage Nursery database services");

nurseryDb
  .command("start")
  .description("Start only Nursery database services (postgres, redis)")
  .action(() => startNursery({ dbOnly: true }));

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
  .command("connect")
  .description("Open a shell in the Nursery API container")
  .action(connectNurseryApi);

program.parse();
