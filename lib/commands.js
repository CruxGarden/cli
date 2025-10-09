import { execSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import chalk from 'chalk';
import ora from 'ora';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dockerDir = join(__dirname, '..', 'docker');

function runCommand(command, options = {}) {
  try {
    return execSync(command, {
      cwd: dockerDir,
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf-8',
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

export async function startStack(options) {
  const spinner = ora('Starting Crux Garden API stack...').start();

  try {
    if (options.dbOnly) {
      spinner.text = 'Starting database services (postgres, redis)...';
      runCommand('docker-compose up -d postgres redis', { silent: true });
      spinner.succeed('Database services started!');
      console.log(chalk.green('\n✓ PostgreSQL running on:'), 'localhost:5432');
      console.log(chalk.green('✓ Redis running on:'), 'localhost:6379');
    } else {
      spinner.text = 'Starting all services (postgres, redis, api)...';
      runCommand('docker-compose up -d', { silent: true });
      spinner.succeed('Crux Garden API stack started!');
      console.log(chalk.green('\n✓ API running on:'), 'http://localhost:3000');
      console.log(chalk.green('✓ PostgreSQL running on:'), 'localhost:5432');
      console.log(chalk.green('✓ Redis running on:'), 'localhost:6379');
    }

    console.log(
      chalk.gray('\nRun'),
      chalk.cyan('crux logs'),
      chalk.gray('to view API logs'),
    );
    console.log(
      chalk.gray('Run'),
      chalk.cyan('crux db:connect'),
      chalk.gray('to connect to PostgreSQL'),
    );
  } catch (error) {
    spinner.fail('Failed to start services');
    throw error;
  }
}

export async function stopStack() {
  const spinner = ora('Stopping Crux Garden API stack...').start();
  runCommand('docker-compose down', { silent: true });
  spinner.succeed('Crux Garden API stack stopped!');
}

export async function restartStack() {
  await stopStack();
  await startStack({});
}

export async function statusStack() {
  console.log(chalk.bold('\nCrux Garden API Stack Status:\n'));
  runCommand('docker-compose ps');
}

export async function logsStack(options) {
  if (options.follow) {
    console.log(chalk.gray('Following API logs (press Ctrl+C to exit)...\n'));
    const child = spawn('docker-compose', ['logs', '-f', 'api'], {
      cwd: dockerDir,
      stdio: 'inherit',
    });

    process.on('SIGINT', () => {
      child.kill('SIGINT');
      process.exit(0);
    });
  } else {
    runCommand('docker-compose logs --tail=100 api');
  }
}

export async function cleanStack() {
  const spinner = ora(
    'Cleaning up (removing containers, volumes, and images)...',
  ).start();

  // Stop and remove containers
  runCommand(
    "docker stop $(docker ps -aq --filter 'name=cruxgarden') 2>/dev/null || true",
    { silent: true, ignoreError: true },
  );
  runCommand(
    "docker rm $(docker ps -aq --filter 'name=cruxgarden') 2>/dev/null || true",
    { silent: true, ignoreError: true },
  );

  // Remove with docker-compose
  runCommand('docker-compose down -v --rmi all', {
    silent: true,
    ignoreError: true,
  });

  spinner.succeed('Cleanup complete!');
}

export async function connectDb() {
  console.log(chalk.gray('Connecting to PostgreSQL...\n'));
  runCommand(
    'docker exec -it cruxgarden-postgres psql -U cruxgarden -d cruxgarden',
  );
}

export async function connectRedis() {
  console.log(chalk.gray('Connecting to Redis...\n'));
  runCommand('docker exec -it cruxgarden-redis redis-cli');
}
