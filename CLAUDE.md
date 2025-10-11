# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Crux Garden CLI** (`@cruxgarden/cli`) is a command-line tool for managing the Crux Garden Nursery environment with Docker. The Nursery is a production-like demo environment with sample data, perfect for trials, demos, and showcasing features.

This CLI is part of the Crux Garden distribution strategy:

1. **Web App** - Cloud SaaS (api.crux.garden)
2. **Desktop App** - Offline-first local app with bundled API + SQLite
3. **Nursery CLI** - This tool, for running demo/trial environments

## Technology Stack

- **Runtime**: Node.js 18+ (ESM modules)
- **CLI Framework**: Commander.js (command structure)
- **UI Libraries**: Chalk (colors), Ora (spinners)
- **Containerization**: Docker Compose
- **Testing**: Jest
- **Formatting**: Prettier

## Project Structure

```
cli/
├── bin/crux.js          # CLI entry point (defines commands)
├── lib/commands.js      # Command implementations (Docker operations)
├── docker/
│   └── docker-compose.nursery.yml  # Nursery environment config
├── package.json         # Dependencies and scripts
└── README.md           # User documentation
```

**Key Files:**

- `bin/crux.js` - Defines all CLI commands using Commander.js (all under `crux nursery`)
- `lib/commands.js` - Implements command logic (runs Docker Compose via execSync)

## Development Commands

### Running Tests

```bash
npm test
```

### Code Formatting

```bash
npm run format
```

### Testing Locally (Without Publishing)

```bash
# Link the CLI globally for testing
npm link

# Test commands
crux nursery start
crux nursery status
crux nursery stop

# Unlink when done
npm unlink -g @cruxgarden/cli
```

## Architecture

### Command Flow

```
User runs: crux nursery start
    ↓
bin/crux.js (Commander.js parses command)
    ↓
lib/commands.js::startNursery()
    ↓
execSync('docker-compose -f docker-compose.nursery.yml up -d', { cwd: dockerDir })
    ↓
Docker starts: postgres, redis, migrations, api
```

### Docker Integration

All commands run Docker Compose from the `docker/` directory using `docker-compose.nursery.yml`. The CLI uses:

- `execSync()` for synchronous Docker commands (start, stop, status)
- `spawn()` for interactive commands (logs -f, db:connect, redis:connect)

**Container Naming Convention:**

- Nursery: `cruxgarden-postgres-nursery`, `cruxgarden-redis-nursery`, `cruxgarden-api-nursery`

**Port Mappings:**

- Nursery: API:3001, PostgreSQL:5433, Redis:6380

### Nursery Environment

The CLI manages the **Nursery environment only**:

- Published image from ghcr.io/cruxgarden/api:latest
- Bundled PostgreSQL + Redis
- Common + Nursery (demo) seeds
- Production-like environment for demos and trials

## Current Implementation Status

### Implemented Commands

All commands are under the `crux nursery` namespace:

- `crux nursery start` - Start full nursery environment
- `crux nursery start --db-only` - Start only databases
- `crux nursery stop` - Stop nursery
- `crux nursery restart` - Restart nursery
- `crux nursery status` - Show service status
- `crux nursery logs` - View logs
- `crux nursery logs -f` - Follow logs
- `crux nursery clean` - Remove containers/volumes
- `crux nursery pull` - Pull latest image
- `crux nursery reset` - Fresh start (clean + pull + start)
- `crux nursery db start` - Start only postgres + redis
- `crux nursery db stop` - Stop databases
- `crux nursery db connect` - Connect to postgres with psql
- `crux nursery redis connect` - Connect to redis with redis-cli
- `crux nursery api connect` - Shell into API container

## Implementation Patterns

### Adding a New Command

1. **Define command in bin/crux.js:**

```javascript
nursery
  .command("my-command")
  .description("Description here")
  .option("--my-option", "Option description")
  .action(myCommandHandler);
```

2. **Implement handler in lib/commands.js:**

```javascript
export async function myCommandHandler(options) {
  const spinner = ora("Doing something...").start();
  try {
    runCommand("docker-compose -f docker-compose.nursery.yml some-command", {
      silent: true,
    });
    spinner.succeed("Done!");
    console.log(chalk.green("Success message"));
  } catch (error) {
    spinner.fail("Failed");
    throw error;
  }
}
```

3. **Import handler in bin/crux.js:**

```javascript
import { myCommandHandler } from "../lib/commands.js";
```

### Working with Docker Compose

All nursery commands use the `docker-compose.nursery.yml` file embedded in this CLI repository, allowing the CLI to work standalone without requiring the API repository.

### Error Handling

The `runCommand()` utility handles errors by default:

- Exits process on error (unless `ignoreError: true`)
- Prints error message in red
- Returns null if `ignoreError: true`

## Key Concepts

### Docker Compose Working Directory

All Docker commands run from `dockerDir` (the `docker/` subdirectory):

```javascript
const dockerDir = join(__dirname, "..", "docker");
runCommand("docker-compose -f docker-compose.nursery.yml up -d", {
  cwd: dockerDir,
});
```

### Silent vs Interactive Commands

- **Silent commands** (start, stop, restart): Use `execSync` with `stdio: 'pipe'` and show spinners
- **Interactive commands** (logs -f, db:connect): Use `spawn` with `stdio: 'inherit'` for TTY passthrough

### Signal Handling for Interactive Commands

Commands like `logs -f` properly handle Ctrl+C:

```javascript
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
```

## Testing Strategy

When implementing new commands:

1. Test with `npm link` first
2. Verify Docker commands work from any directory
3. Test error cases (Docker not running, ports in use, etc.)
4. Verify output formatting (colors, spinners, messages)
5. Test interactive commands (Ctrl+C behavior)

## Distribution and Publishing

**Package name**: `@cruxgarden/cli`
**Registry**: npm (npmjs.com)
**Installation**:

- Global: `npm install -g @cruxgarden/cli`
- npx: `npx @cruxgarden/cli nursery start`

## Environment Variables

The CLI doesn't directly use environment variables - it passes them through to Docker Compose. The Nursery environment has sensible defaults for all variables. Users can create a `.env` file in their working directory for customization.

**Optional (have defaults)**:

- `JWT_SECRET` - Has dev default
- `AWS_ACCESS_KEY_ID` - Defaults to "dummy"
- `AWS_SECRET_ACCESS_KEY` - Defaults to "dummy"
- `AWS_REGION` - Defaults to "us-east-1"
- `FROM_EMAIL_ADDRESS` - Defaults to "noreply@example.com"
- `CORS_ORIGIN` - Defaults to "\*"
- `LOG_LEVEL` - Defaults to "info"
- `PORT` - Defaults to 3001

See NURSERY_COMMANDS.md for complete environment variable reference.

## Code Style

- **Imports**: Use ESM (`import`/`export`)
- **Async**: Use `async/await` for consistency (even though most commands are sync)
- **Error handling**: Wrap Docker commands in try/catch with spinner feedback
- **Logging**: Use `chalk` for colors, `ora` for spinners
- **Command output**: Show helpful next steps after successful operations

## Future Enhancements (From ARCHITECTURE.md)

The CLI may eventually support:

- **Cloud mode**: Connect to api.crux.garden for cloud operations
- **Multi-instance management**: Connect to desktop app API (localhost:54321) or cloud
- **Data operations**: Export, import, sync between instances

This would enable workflows like:

```bash
# Login to cloud
crux login

# Export from cloud
crux export --output backup.json

# Import to nursery
crux nursery start
crux import backup.json
```

## API Development vs Nursery CLI

**Important distinction:**

- **This CLI** - For running the published Nursery environment (demo/trial/showcase)
- **API repository npm scripts** - For API development (local builds, hot reload)

If someone wants to develop the API itself (not just run demos), they should use the API repository's `npm run docker:dev` commands, not this CLI.

## Notes on Removed Features

The CLI previously had "development environment" commands (`crux start`, `crux stop`) that tried to run Docker Compose without a compose file. These were removed because:

1. No API source code exists in this repository
2. Development requires building from source (only exists in API repo)
3. This CLI is specifically for the Nursery (published image)

Development workflows belong in the API repository where the source code lives.
