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

function runCommandAsync(command, options = {}) {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(/\s+/);
    const child = spawn(cmd, args, {
      cwd: dockerDir,
      stdio: options.silent ? "pipe" : "inherit",
      shell: true,
      ...options,
    });

    let stdout = "";
    let stderr = "";

    if (options.silent) {
      if (child.stdout) {
        child.stdout.on("data", (data) => {
          stdout += data.toString();
        });
      }
      if (child.stderr) {
        child.stderr.on("data", (data) => {
          stderr += data.toString();
        });
      }
    }

    child.on("close", (code) => {
      if (code !== 0 && !options.ignoreError) {
        const error = new Error(
          stderr || `Command failed with exit code ${code}`,
        );
        reject(error);
      } else {
        resolve(stdout);
      }
    });

    child.on("error", (error) => {
      if (!options.ignoreError) {
        reject(error);
      } else {
        resolve(null);
      }
    });
  });
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
      await runCommandAsync(
        "docker-compose -f docker-compose.nursery.yml up -d --remove-orphans postgres redis",
        { silent: true },
      );
      spinner.succeed("Nursery database services started!");
      console.log(
        chalk.hex(SUCCESS_GREEN)("\n✓ PostgreSQL running on:"),
        "localhost:5432",
      );
      console.log(
        chalk.hex(SUCCESS_GREEN)("✓ Redis running on:"),
        "localhost:6379",
      );
    } else {
      spinner.text =
        "Starting nursery services (api, postgres, redis)...";
      await runCommandAsync(
        "docker-compose -f docker-compose.nursery.yml up -d --remove-orphans && docker rm cruxgarden-nursery-migrations 2>/dev/null || true",
        {
          silent: true,
        },
      );

      spinner.succeed("Crux Garden Nursery environment started!");
      console.log(
        chalk.hex(SUCCESS_GREEN)("\n✓ API running on:"),
        "http://localhost:3000",
      );
      console.log(
        chalk.hex(SUCCESS_GREEN)("✓ PostgreSQL running on:"),
        "localhost:5432",
      );
      console.log(
        chalk.hex(SUCCESS_GREEN)("✓ Redis running on:"),
        "localhost:6379",
      );
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
      chalk.cyan("crux nursery api connect"),
      chalk.gray("to shell into the API container"),
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
    console.log();
  } catch (error) {
    spinner.fail("Failed to start nursery services");
    throw error;
  }
}

export async function stopNursery() {
  const spinner = ora("Stopping Crux Garden Nursery environment...").start();
  await runCommandAsync("docker-compose -f docker-compose.nursery.yml down", {
    silent: true,
  });
  spinner.succeed("Crux Garden Nursery environment stopped!");
  console.log(
    chalk.gray("\nData preserved. Run"),
    chalk.cyan("crux nursery start"),
    chalk.gray("to restart with existing data."),
  );
  console.log();
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
    console.log();
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

  await runCommandAsync(
    "docker-compose -f docker-compose.nursery.yml down -v",
    {
      silent: true,
      ignoreError: true,
    },
  );

  spinner.succeed("Nursery cleanup complete!");
  console.log(
    chalk.gray("Run"),
    chalk.cyan("crux nursery start"),
    chalk.gray("to start fresh."),
  );
  console.log();
}

export async function purgeNursery() {
  console.log(
    chalk.yellow(
      "\n⚠️  This will delete ALL nursery resources (containers, volumes, AND images)!\n",
    ),
  );
  console.log(
    chalk.yellow(
      "You will need to re-download images on next start (may take several minutes).\n",
    ),
  );

  const confirmed = await askConfirmation(
    chalk.red("Are you sure you want to continue? (y/N): "),
  );

  if (!confirmed) {
    console.log(chalk.gray("\nPurge cancelled."));
    return;
  }

  const spinner = ora(
    "Purging nursery (removing containers, volumes, and images)...",
  ).start();

  await runCommandAsync(
    "docker-compose -f docker-compose.nursery.yml down -v --rmi all",
    {
      silent: true,
      ignoreError: true,
    },
  );

  spinner.succeed("Nursery purge complete!");
  console.log(chalk.gray("\nAll nursery resources have been removed."));
  console.log(
    chalk.gray("Run"),
    chalk.cyan("crux nursery start"),
    chalk.gray("to download images and start fresh."),
  );
  console.log();
}

export async function pullNursery() {
  const spinner = ora(
    "Pulling latest Crux Garden API image from ghcr.io...",
  ).start();

  await runCommandAsync("docker-compose -f docker-compose.nursery.yml pull", {
    silent: true,
  });

  spinner.succeed("Latest nursery image pulled!");
  console.log(
    chalk.gray("Run"),
    chalk.cyan("crux nursery restart"),
    chalk.gray("to use the new image."),
  );
  console.log();
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
    await runCommandAsync(
      "docker-compose -f docker-compose.nursery.yml down -v",
      {
        silent: true,
        ignoreError: true,
      },
    );

    // Pull latest image
    spinner.text = "Pulling latest image...";
    await runCommandAsync("docker-compose -f docker-compose.nursery.yml pull", {
      silent: true,
    });

    // Start fresh
    spinner.text = "Starting fresh nursery environment...";
    await runCommandAsync(
      "docker-compose -f docker-compose.nursery.yml up -d --remove-orphans && docker rm cruxgarden-nursery-migrations 2>/dev/null || true",
      {
        silent: true,
      },
    );

    spinner.succeed("Nursery environment reset complete!");
    console.log(
      chalk.hex(SUCCESS_GREEN)("\n✓ API running on:"),
      "http://localhost:3000",
    );
    console.log(
      chalk.hex(SUCCESS_GREEN)("✓ PostgreSQL running on:"),
      "localhost:5432",
    );
    console.log(
      chalk.hex(SUCCESS_GREEN)("✓ Redis running on:"),
      "localhost:6379",
    );
    console.log(
      chalk.yellow("\nℹ Fresh nursery with latest demo data loaded"),
    );
    console.log();
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
  console.log();
}

export async function connectNurseryDb() {
  console.log(chalk.gray("Connecting to Nursery PostgreSQL...\n"));
  runCommand(
    "docker exec -it cruxgarden-nursery-postgres psql -U cruxgarden -d cruxgarden",
  );
}

export async function connectNurseryRedis() {
  console.log(chalk.gray("Connecting to Nursery Redis...\n"));
  runCommand("docker exec -it cruxgarden-nursery-redis redis-cli");
}

export async function connectNurseryApi() {
  console.log(chalk.gray("Opening shell in Nursery API container...\n"));
  runCommand("docker exec -it cruxgarden-nursery-api sh");
}

export async function stopNurseryDb() {
  const spinner = ora("Stopping nursery database services...").start();
  await runCommandAsync(
    "docker-compose -f docker-compose.nursery.yml stop postgres redis",
    { silent: true },
  );
  spinner.succeed("Nursery database services stopped!");
  console.log();
}
