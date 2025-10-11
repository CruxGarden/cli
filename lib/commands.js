import { execSync, spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import readline from "readline";
import chalk from "chalk";
import ora from "ora";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dockerDir = join(__dirname, "..", "docker");

// Colors
const SUCCESS_GREEN = "#9BD39B";

export function showBanner() {
  // Check if banner was already shown in this shell session
  if (process.env.CRUX_BANNER_SHOWN) return;

  // Custom ASCII art - replace this with your own!
  const banner = `
 ██████╗██████╗ ██╗   ██╗██╗  ██╗
██╔════╝██╔══██╗██║   ██║╚██╗██╔╝
██║     ██████╔╝██║   ██║ ╚███╔╝
██║     ██╔══██╗██║   ██║ ██╔██╗
╚██████╗██║  ██║╚██████╔╝██╔╝ ██╗
 ╚═════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝

 ██████╗  █████╗ ██████╗ ██████╗ ███████╗███╗   ██╗
██╔════╝ ██╔══██╗██╔══██╗██╔══██╗██╔════╝████╗  ██║
██║  ███╗███████║██████╔╝██║  ██║█████╗  ██╔██╗ ██║
██║   ██║██╔══██║██╔══██╗██║  ██║██╔══╝  ██║╚██╗██║
╚██████╔╝██║  ██║██║  ██║██████╔╝███████╗██║ ╚████║
 ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═══╝`;

  console.log(chalk.hex(SUCCESS_GREEN)(banner));
  console.log(chalk.gray("  Nursery Environment - Demo & Trial\n"));

  // Set environment variable so it persists for this shell session
  process.env.CRUX_BANNER_SHOWN = "1";
}

function runCommand(command, options = {}) {
  try {
    return execSync(command, {
      cwd: dockerDir,
      stdio: options.silent ? "pipe" : "inherit",
      encoding: "utf-8",
      ...options,
    });
  } catch (error) {
    if (!options.ignoreError) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
    return null;
  }
}

function askConfirmation(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}

// ============================================================================
// Nursery Environment Commands
// ============================================================================

export async function startNursery(options) {
  const spinner = ora("Starting Crux Garden Nursery environment...").start();

  try {
    if (options.dbOnly) {
      spinner.text = "Starting nursery database services (postgres, redis)...";
      runCommand(
        "docker-compose -f docker-compose.nursery.yml up -d postgres redis",
        { silent: true },
      );
      spinner.succeed("Nursery database services started!");
      console.log(chalk.hex(SUCCESS_GREEN)("\n✓ PostgreSQL running on:"), "localhost:5433");
      console.log(chalk.hex(SUCCESS_GREEN)("✓ Redis running on:"), "localhost:6380");
    } else {
      spinner.text =
        "Starting nursery services (postgres, redis, migrations, api)...";
      runCommand("docker-compose -f docker-compose.nursery.yml up -d", {
        silent: true,
      });
      spinner.succeed("Crux Garden Nursery environment started!");
      console.log(chalk.hex(SUCCESS_GREEN)("\n✓ API running on:"), "http://localhost:3001");
      console.log(chalk.hex(SUCCESS_GREEN)("✓ PostgreSQL running on:"), "localhost:5433");
      console.log(chalk.hex(SUCCESS_GREEN)("✓ Redis running on:"), "localhost:6380");
      console.log(
        chalk.yellow(
          "\nℹ Nursery includes demo data for trials and showcases",
        ),
      );
    }

    console.log(
      chalk.gray("\nRun"),
      chalk.cyan("crux nursery logs"),
      chalk.gray("to view logs"),
    );
    console.log(
      chalk.gray("Run"),
      chalk.cyan("crux nursery db connect"),
      chalk.gray("to connect to PostgreSQL"),
    );
    console.log(
      chalk.gray("Run"),
      chalk.cyan("crux nursery redis connect"),
      chalk.gray("to connect to Redis"),
    );
    console.log(
      chalk.gray("Run"),
      chalk.cyan("crux nursery api connect"),
      chalk.gray("to shell into the API container"),
    );
  } catch (error) {
    spinner.fail("Failed to start nursery services");
    throw error;
  }
}

export async function stopNursery() {
  const spinner = ora("Stopping Crux Garden Nursery environment...").start();
  runCommand("docker-compose -f docker-compose.nursery.yml down", {
    silent: true,
  });
  spinner.succeed("Crux Garden Nursery environment stopped!");
  console.log(
    chalk.gray("\nData preserved. Run"),
    chalk.cyan("crux nursery start"),
    chalk.gray("to restart with existing data."),
  );
}

export async function logsNursery(options) {
  if (options.follow) {
    console.log(
      chalk.gray("Following nursery logs (press Ctrl+C to exit)...\n"),
    );
    const child = spawn(
      "docker-compose",
      ["-f", "docker-compose.nursery.yml", "logs", "-f"],
      {
        cwd: dockerDir,
        stdio: "inherit",
      },
    );

    process.on("SIGINT", () => {
      child.kill("SIGINT");
      process.exit(0);
    });
  } else {
    runCommand("docker-compose -f docker-compose.nursery.yml logs --tail=100");
  }
}

export async function cleanNursery() {
  console.log(
    chalk.yellow(
      "\n⚠️  This will delete all nursery containers and volumes (including data)!\n",
    ),
  );

  const confirmed = await askConfirmation(
    chalk.red("Are you sure you want to continue? (y/N): "),
  );

  if (!confirmed) {
    console.log(chalk.gray("\nClean cancelled."));
    return;
  }

  const spinner = ora(
    "Cleaning up nursery (removing containers and volumes)...",
  ).start();

  runCommand("docker-compose -f docker-compose.nursery.yml down -v", {
    silent: true,
    ignoreError: true,
  });

  spinner.succeed("Nursery cleanup complete!");
  console.log(
    chalk.gray("Run"),
    chalk.cyan("crux nursery start"),
    chalk.gray("to start fresh."),
  );
}

export async function pullNursery() {
  const spinner = ora(
    "Pulling latest Crux Garden API image from ghcr.io...",
  ).start();

  runCommand("docker-compose -f docker-compose.nursery.yml pull", {
    silent: true,
  });

  spinner.succeed("Latest nursery image pulled!");
  console.log(
    chalk.gray("Run"),
    chalk.cyan("crux nursery restart"),
    chalk.gray("to use the new image."),
  );
}

export async function resetNursery() {
  console.log(
    chalk.yellow(
      "\n⚠️  This will delete all nursery data and start fresh with the latest image!\n",
    ),
  );

  const confirmed = await askConfirmation(
    chalk.red("Are you sure you want to continue? (y/N): "),
  );

  if (!confirmed) {
    console.log(chalk.gray("\nReset cancelled."));
    return;
  }

  const spinner = ora("Resetting nursery environment...").start();

  try {
    // Stop and remove volumes
    spinner.text = "Stopping and removing containers/volumes...";
    runCommand("docker-compose -f docker-compose.nursery.yml down -v", {
      silent: true,
      ignoreError: true,
    });

    // Pull latest image
    spinner.text = "Pulling latest image...";
    runCommand("docker-compose -f docker-compose.nursery.yml pull", {
      silent: true,
    });

    // Start fresh
    spinner.text = "Starting fresh nursery environment...";
    runCommand("docker-compose -f docker-compose.nursery.yml up -d", {
      silent: true,
    });

    spinner.succeed("Nursery environment reset complete!");
    console.log(chalk.hex(SUCCESS_GREEN)("\n✓ API running on:"), "http://localhost:3001");
    console.log(chalk.hex(SUCCESS_GREEN)("✓ PostgreSQL running on:"), "localhost:5433");
    console.log(chalk.hex(SUCCESS_GREEN)("✓ Redis running on:"), "localhost:6380");
    console.log(
      chalk.yellow("\nℹ Fresh nursery with latest demo data loaded"),
    );
  } catch (error) {
    spinner.fail("Failed to reset nursery");
    throw error;
  }
}

export async function restartNursery() {
  await stopNursery();
  await startNursery({});
}

export async function statusNursery() {
  console.log(chalk.bold("\nCrux Garden Nursery Environment Status:\n"));
  runCommand("docker-compose -f docker-compose.nursery.yml ps");
}

export async function connectNurseryDb() {
  console.log(chalk.gray("Connecting to Nursery PostgreSQL...\n"));
  runCommand(
    "docker exec -it cruxgarden-postgres-nursery psql -U cruxgarden -d cruxgarden",
  );
}

export async function connectNurseryRedis() {
  console.log(chalk.gray("Connecting to Nursery Redis...\n"));
  runCommand("docker exec -it cruxgarden-redis-nursery redis-cli");
}

export async function connectNurseryApi() {
  console.log(chalk.gray("Opening shell in Nursery API container...\n"));
  runCommand("docker exec -it cruxgarden-api-nursery sh");
}

export async function stopNurseryDb() {
  const spinner = ora("Stopping nursery database services...").start();
  runCommand(
    "docker-compose -f docker-compose.nursery.yml stop postgres redis",
    { silent: true },
  );
  spinner.succeed("Nursery database services stopped!");
}
