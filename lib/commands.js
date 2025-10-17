import { execSync, spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync, existsSync } from "fs";
import readline from "readline";
import chalk from "chalk";
import ora from "ora";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dockerDir = join(__dirname, "..", "docker");

// Read version from package.json
const packageJson = JSON.parse(
  readFileSync(join(__dirname, "..", "package.json"), "utf-8")
);
const VERSION = packageJson.version;

// Colors
const SUCCESS_GREEN = "#9BD39B";

export function showBanner() {
  // Check if banner was already shown in this shell session
  if (process.env.CRUX_BANNER_SHOWN) return;

  const bannerLines = [
    " ██████╗██████╗ ██╗   ██╗██╗  ██╗",
    "██╔════╝██╔══██╗██║   ██║╚██╗██╔╝",
    "██║     ██████╔╝██║   ██║ ╚███╔╝",
    "██║     ██╔══██╗██║   ██║ ██╔██╗",
    "╚██████╗██║  ██║╚██████╔╝██╔╝ ██╗",
    " ╚═════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝",
    "",
    " ██████╗  █████╗ ██████╗ ██████╗ ███████╗███╗   ██╗",
    "██╔════╝ ██╔══██╗██╔══██╗██╔══██╗██╔════╝████╗  ██║",
    "██║  ███╗███████║██████╔╝██║  ██║█████╗  ██╔██╗ ██║",
    "██║   ██║██╔══██║██╔══██╗██║  ██║██╔══╝  ██║╚██╗██║",
    "╚██████╔╝██║  ██║██║  ██║██████╔╝███████╗██║ ╚████║",
    " ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═══╝"
  ];

  // Randomly pick a color from the CLI color palette
  const colors = [
    chalk.hex(SUCCESS_GREEN),  // Green
    chalk.cyan,                 // Cyan
    chalk.yellow,               // Yellow
    chalk.magenta,              // Magenta
    chalk.blue,                 // Blue
    chalk.red,                  // Red
  ];

  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  // Print each line with the same random color
  console.log();
  bannerLines.forEach((line) => {
    console.log(randomColor(line));
  });

  console.log(chalk.gray(`  Nursery Environment - Demo & Trial (v${VERSION})\n`));

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
        // Return both stdout and stderr since Docker commands often write to stderr
        resolve({ stdout, stderr, combined: stdout + stderr });
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

function checkDockerAvailable() {
  try {
    execSync("docker info", { stdio: "pipe" });
    return true;
  } catch (error) {
    return false;
  }
}

function ensureDockerRunning() {
  if (!checkDockerAvailable()) {
    console.error(
      chalk.red(
        "\n✗ Docker is not running or not installed.\n",
      ),
    );
    console.log(chalk.gray("Please ensure Docker is installed and running:"));
    console.log(chalk.gray("  • Start Docker Desktop, or"));
    console.log(chalk.gray("  • Start the Docker daemon\n"));
    console.log(chalk.gray("Then try your command again.\n"));
    process.exit(1);
  }
}

function getEnvFileFlag() {
  const envFilePath = join(process.cwd(), ".env");
  if (existsSync(envFilePath)) {
    return `--env-file "${envFilePath}"`;
  }
  return "";
}

function parseAndSetEnvVars(envArgs = []) {
  if (!envArgs || envArgs.length === 0) return;

  for (const arg of envArgs) {
    const match = arg.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      process.env[key] = value;
      console.log(chalk.gray(`  Setting ${key}=${value}`));
    } else {
      console.log(chalk.yellow(`  Warning: Ignoring invalid env var format: ${arg}`));
    }
  }
}

// ============================================================================
// Nursery Environment Commands
// ============================================================================

export async function startNursery(options, envVars) {
  ensureDockerRunning();

  // Ensure NURSERY_MODE is always set to true for nursery environment
  process.env.NURSERY_MODE = 'true';

  // Parse and set environment variables from command line
  if (envVars && envVars.length > 0) {
    console.log(chalk.cyan("\nApplying environment variables:"));
    parseAndSetEnvVars(envVars);
    console.log();
  }

  const spinner = ora("Starting Crux Garden Nursery environment...").start();
  const envFileFlag = getEnvFileFlag();

  // Get actual port values from environment
  const appPort = process.env.APP_PORT || "8080";
  const apiPort = process.env.API_PORT || "3000";
  const postgresPort = process.env.POSTGRES_PORT || "5432";
  const redisPort = process.env.REDIS_PORT || "6379";

  try {
    if (options.dbOnly) {
      spinner.text = "Starting nursery database services (postgres, redis)...";
      await runCommandAsync(
        `docker-compose ${envFileFlag} -f docker-compose.nursery.yml up -d --remove-orphans postgres redis`,
        { silent: true },
      );
      spinner.succeed("Nursery database services started!");
      console.log(
        chalk.hex(SUCCESS_GREEN)("\n✓ PostgreSQL running on:"),
        `localhost:${postgresPort}`,
      );
      console.log(
        chalk.hex(SUCCESS_GREEN)("✓ Redis running on:"),
        `localhost:${redisPort}`,
      );
    } else if (options.apiOnly) {
      spinner.text =
        "Starting nursery API services (api, postgres, redis)...";
      await runCommandAsync(
        `docker-compose ${envFileFlag} -f docker-compose.nursery.yml up -d --remove-orphans postgres redis migrations api`,
        {
          silent: true,
        },
      );

      // Clean up the migrations container if it exists (cross-platform)
      await runCommandAsync(
        "docker rm cruxgarden-nursery-migrations",
        {
          silent: true,
          ignoreError: true,
        },
      );

      spinner.succeed("Crux Garden Nursery API services started!");
      console.log(
        chalk.hex(SUCCESS_GREEN)("\n✓ API running on:"),
        `http://localhost:${apiPort}`,
      );
      console.log(
        chalk.hex(SUCCESS_GREEN)("✓ PostgreSQL running on:"),
        `localhost:${postgresPort}`,
      );
      console.log(
        chalk.hex(SUCCESS_GREEN)("✓ Redis running on:"),
        `localhost:${redisPort}`,
      );
      console.log(
        chalk.yellow(
          "\nℹ Nursery includes demo data for trials and showcases",
        ),
      );
    } else {
      spinner.text =
        "Starting nursery services (app, api, postgres, redis)...";
      await runCommandAsync(
        `docker-compose ${envFileFlag} -f docker-compose.nursery.yml up -d --remove-orphans`,
        {
          silent: true,
        },
      );

      // Clean up the migrations container if it exists (cross-platform)
      await runCommandAsync(
        "docker rm cruxgarden-nursery-migrations",
        {
          silent: true,
          ignoreError: true,
        },
      );

      spinner.succeed("Crux Garden Nursery environment started!");
      console.log(
        chalk.hex(SUCCESS_GREEN)("\n✓ App running on:"),
        `http://localhost:${appPort}`,
      );
      console.log(
        chalk.hex(SUCCESS_GREEN)("✓ API running on:"),
        `http://localhost:${apiPort}`,
      );
      console.log(
        chalk.hex(SUCCESS_GREEN)("✓ PostgreSQL running on:"),
        `localhost:${postgresPort}`,
      );
      console.log(
        chalk.hex(SUCCESS_GREEN)("✓ Redis running on:"),
        `localhost:${redisPort}`,
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
  ensureDockerRunning();
  const spinner = ora("Stopping Crux Garden Nursery environment...").start();
  const envFileFlag = getEnvFileFlag();
  await runCommandAsync(`docker-compose ${envFileFlag} -f docker-compose.nursery.yml down`, {
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
  ensureDockerRunning();
  const envFileFlag = getEnvFileFlag();
  const envFileArgs = envFileFlag ? envFileFlag.split(" ") : [];

  if (options.follow) {
    console.log(
      chalk.gray("Following nursery logs (press Ctrl+C to exit)...\n"),
    );
    const child = spawn(
      "docker-compose",
      [...envFileArgs, "-f", "docker-compose.nursery.yml", "logs", "-f"],
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
    runCommand(`docker-compose ${envFileFlag} -f docker-compose.nursery.yml logs --tail=100`);
    console.log();
  }
}

export async function cleanNursery() {
  ensureDockerRunning();
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
  const envFileFlag = getEnvFileFlag();

  await runCommandAsync(
    `docker-compose ${envFileFlag} -f docker-compose.nursery.yml down -v`,
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
  ensureDockerRunning();
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
  const envFileFlag = getEnvFileFlag();

  await runCommandAsync(
    `docker-compose ${envFileFlag} -f docker-compose.nursery.yml down -v --rmi all`,
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

export async function updateNursery() {
  ensureDockerRunning();
  const spinner = ora(
    "Checking for latest Crux Garden images from ghcr.io...",
  ).start();
  const envFileFlag = getEnvFileFlag();

  try {
    // Get the current local image digests before pulling
    const apiBeforeResult = await runCommandAsync(
      "docker images --digests --format '{{.Digest}}' ghcr.io/cruxgarden/api:latest",
      { silent: true, ignoreError: true }
    );
    const apiDigestBefore = apiBeforeResult?.combined?.trim() || apiBeforeResult?.stdout?.trim() || "";

    const appBeforeResult = await runCommandAsync(
      "docker images --digests --format '{{.Digest}}' ghcr.io/cruxgarden/app:latest",
      { silent: true, ignoreError: true }
    );
    const appDigestBefore = appBeforeResult?.combined?.trim() || appBeforeResult?.stdout?.trim() || "";

    // Pull latest images
    spinner.text = "Pulling latest images...";
    await runCommandAsync(`docker-compose ${envFileFlag} -f docker-compose.nursery.yml pull`, {
      silent: true,
    });

    // Get the image digests after pulling
    const apiAfterResult = await runCommandAsync(
      "docker images --digests --format '{{.Digest}}' ghcr.io/cruxgarden/api:latest",
      { silent: true, ignoreError: true }
    );
    const apiDigestAfter = apiAfterResult?.combined?.trim() || apiAfterResult?.stdout?.trim() || "";

    const appAfterResult = await runCommandAsync(
      "docker images --digests --format '{{.Digest}}' ghcr.io/cruxgarden/app:latest",
      { silent: true, ignoreError: true }
    );
    const appDigestAfter = appAfterResult?.combined?.trim() || appAfterResult?.stdout?.trim() || "";

    // Check which images were updated
    const apiUpdated = apiDigestBefore && apiDigestAfter && apiDigestBefore !== apiDigestAfter;
    const appUpdated = appDigestBefore && appDigestAfter && appDigestBefore !== appDigestAfter;

    if (!apiUpdated && !appUpdated && apiDigestAfter && appDigestAfter) {
      spinner.succeed("Nursery images are already up-to-date!");
      console.log(
        chalk.gray("\nYou're running the latest version."),
      );
    } else {
      const updatedImages = [];
      if (apiUpdated) updatedImages.push("API");
      if (appUpdated) updatedImages.push("App");

      if (updatedImages.length > 0) {
        spinner.succeed(`Latest nursery images downloaded! (${updatedImages.join(", ")} updated)`);
      } else {
        spinner.succeed("Images pulled successfully!");
      }

      console.log(
        chalk.gray("\nRun"),
        chalk.cyan("crux nursery restart"),
        chalk.gray("to use the new images."),
      );
    }
  } catch (error) {
    spinner.fail("Failed to update images");
    throw error;
  }
  console.log();
}

export async function resetNursery(envVars) {
  ensureDockerRunning();
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

  // Ensure NURSERY_MODE is always set to true for nursery environment
  process.env.NURSERY_MODE = 'true';

  // Parse and set environment variables from command line
  if (envVars && envVars.length > 0) {
    console.log(chalk.cyan("\nApplying environment variables:"));
    parseAndSetEnvVars(envVars);
    console.log();
  }

  const spinner = ora("Resetting nursery environment...").start();
  const envFileFlag = getEnvFileFlag();

  // Get actual port values from environment
  const appPort = process.env.APP_PORT || "8080";
  const apiPort = process.env.API_PORT || "3000";
  const postgresPort = process.env.POSTGRES_PORT || "5432";
  const redisPort = process.env.REDIS_PORT || "6379";

  try {
    // Stop and remove volumes
    spinner.text = "Stopping and removing containers/volumes...";
    await runCommandAsync(
      `docker-compose ${envFileFlag} -f docker-compose.nursery.yml down -v`,
      {
        silent: true,
        ignoreError: true,
      },
    );

    // Pull latest image
    spinner.text = "Pulling latest image...";
    await runCommandAsync(`docker-compose ${envFileFlag} -f docker-compose.nursery.yml pull`, {
      silent: true,
    });

    // Start fresh
    spinner.text = "Starting fresh nursery environment...";
    await runCommandAsync(
      `docker-compose ${envFileFlag} -f docker-compose.nursery.yml up -d --remove-orphans`,
      {
        silent: true,
      },
    );

    // Clean up the migrations container if it exists (cross-platform)
    await runCommandAsync(
      "docker rm cruxgarden-nursery-migrations",
      {
        silent: true,
        ignoreError: true,
      },
    );

    spinner.succeed("Nursery environment reset complete!");
    console.log(
      chalk.hex(SUCCESS_GREEN)("\n✓ App running on:"),
      `http://localhost:${appPort}`,
    );
    console.log(
      chalk.hex(SUCCESS_GREEN)("✓ API running on:"),
      `http://localhost:${apiPort}`,
    );
    console.log(
      chalk.hex(SUCCESS_GREEN)("✓ PostgreSQL running on:"),
      `localhost:${postgresPort}`,
    );
    console.log(
      chalk.hex(SUCCESS_GREEN)("✓ Redis running on:"),
      `localhost:${redisPort}`,
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

export async function restartNursery(options = {}, envVars) {
  await stopNursery();
  await startNursery(options, envVars);
}

export async function statusNursery() {
  ensureDockerRunning();
  const envFileFlag = getEnvFileFlag();
  console.log(chalk.bold("\nCrux Garden Nursery Environment Status:\n"));
  runCommand(`docker-compose ${envFileFlag} -f docker-compose.nursery.yml ps`);
  console.log();
}

export async function connectNurseryDb() {
  ensureDockerRunning();
  console.log(chalk.gray("Connecting to Nursery PostgreSQL...\n"));
  runCommand(
    "docker exec -it cruxgarden-nursery-postgres psql -U cruxgarden -d cruxgarden",
  );
}

export async function connectNurseryRedis() {
  ensureDockerRunning();
  console.log(chalk.gray("Connecting to Nursery Redis...\n"));
  runCommand("docker exec -it cruxgarden-nursery-redis redis-cli");
}

export async function connectNurseryApi() {
  ensureDockerRunning();
  console.log(chalk.gray("Opening shell in Nursery API container...\n"));
  runCommand("docker exec -it cruxgarden-nursery-api sh");
}

export async function stopNurseryDb() {
  ensureDockerRunning();
  const spinner = ora("Stopping nursery database services...").start();
  const envFileFlag = getEnvFileFlag();
  await runCommandAsync(
    `docker-compose ${envFileFlag} -f docker-compose.nursery.yml stop postgres redis`,
    { silent: true },
  );
  spinner.succeed("Nursery database services stopped!");
  console.log();
}
