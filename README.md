<div align="center">
  <img src=".github/banner.jpg" alt="Crux Garden - Where Ideas Grow" width="100%">
  <p>
    <a href="https://github.com/CruxGarden/cli/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
    <a href="https://github.com/CruxGarden/cli/issues"><img src="https://img.shields.io/github/issues/CruxGarden/cli" alt="Issues"></a>
    <a href="https://github.com/CruxGarden/cli/stargazers"><img src="https://img.shields.io/github/stars/CruxGarden/cli" alt="Stars"></a>
  </p>
</div>

The Crux Garden CLI tool helps manage the Crux Garden Nursery environment with Docker.

The **Nursery** is a production-like demo environment with sample data, perfect for trials, demos, and showcasing features.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed and running
- [Node.js](https://nodejs.org/) 18 or higher

## Installation

### Install from npm

Install globally with npm:

```bash
npm install -g @cruxgarden/cli
```

Or use with npx (no installation required):

```bash
npx @cruxgarden/cli nursery start
```

### Local Development

To develop or test the CLI locally:

```bash
# Clone the repository
git clone https://github.com/CruxGarden/cli.git
cd cli

# Install dependencies
npm install

# Link the CLI globally for testing
npm link

# Now you can use the `crux` command
crux --help

# When done, unlink
npm unlink -g @cruxgarden/cli
```

## Quick Start

Start the Nursery environment:

```bash
crux nursery start
```

The API will be available at `http://localhost:3000` with demo data loaded.

View logs:

```bash
crux nursery logs
```

Stop the environment:

```bash
crux nursery stop
```

## Commands

All commands are scoped under `crux nursery`:

### `crux nursery start`

Start the Nursery environment (PostgreSQL, Redis, Migrations, and API with demo data).

```bash
crux nursery start
```

**Options:**

- `--db-only` - Start only database services (PostgreSQL and Redis)

### `crux nursery stop`

Stop the Nursery environment. Data is preserved.

```bash
crux nursery stop
```

### `crux nursery restart`

Restart the Nursery environment.

```bash
crux nursery restart
```

### `crux nursery status`

Show the status of all Nursery services.

```bash
crux nursery status
```

### `crux nursery logs`

View logs from all Nursery services.

```bash
crux nursery logs

# Follow logs (like tail -f)
crux nursery logs -f
```

### `crux nursery pull`

Pull the latest API image from GitHub Container Registry.

```bash
crux nursery pull
```

### `crux nursery reset`

Complete fresh reset: stops everything, deletes all data and volumes, pulls the latest image, and starts fresh. **Warning: This deletes all data!**

```bash
crux nursery reset
```

### `crux nursery clean`

Stop and remove all Nursery containers and volumes. **Warning: This deletes all data!**

```bash
crux nursery clean
```

### `crux nursery purge`

Stop and remove ALL Nursery resources including containers, volumes, AND images. **Warning: This deletes everything including downloaded images! You'll need to re-download images on next start.**

```bash
crux nursery purge
```

This is more aggressive than `clean` - it removes Docker images too, which means:

- Frees up more disk space
- Requires re-downloading images (~100-500MB) on next start
- Useful when you want to completely remove all traces of the Nursery

### `crux nursery db start`

Start only Nursery database services (PostgreSQL and Redis).

```bash
crux nursery db start
```

### `crux nursery db stop`

Stop Nursery database services.

```bash
crux nursery db stop
```

### `crux nursery db connect`

Connect to the Nursery PostgreSQL database with `psql`.

```bash
crux nursery db connect
```

Useful psql commands:

- `\dt` - List all tables
- `\d table_name` - Describe a table
- `\q` - Quit

### `crux nursery redis connect`

Connect to Nursery Redis with `redis-cli`.

```bash
crux nursery redis connect
```

### `crux nursery api connect`

Open a shell in the Nursery API container.

```bash
crux nursery api connect
```

## What is the Nursery?

The Nursery is a production-like demo environment that:

- **Uses the published Docker image** from `ghcr.io/cruxgarden/api:latest`
- **Includes demo data** - Sample cruxes, paths, and relationships for showcasing
- **Runs standalone** - Bundled PostgreSQL and Redis, no external dependencies
- **Perfect for demos** - Show features to stakeholders, QA testing, trials

**Services:**

- **API**: `http://localhost:3000` - Crux Garden API (published image with demo data)
- **PostgreSQL**: `localhost:5432` - Database
- **Redis**: `localhost:6379` - Cache

## Environment Variables

The Nursery environment has defaults for all environment variables, so a `.env` file is optional. However, you can override any variable by creating a `.env` file in your working directory:

```bash
# JWT (has dev default, but you should use a different one)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# AWS (defaults to "dummy" values)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
FROM_EMAIL_ADDRESS=demo@example.com

# Optional overrides
CORS_ORIGIN=*
LOG_LEVEL=info
PORT=3000
```

## Common Workflows

### Demo/Trial Setup

Use the Nursery environment for demos, trials, or showcasing features:

```bash
# First time setup - pulls image and starts with demo data
crux nursery start

# View the demo at http://localhost:3000

# Stop (keeps data for next demo)
crux nursery stop

# Restart for another demo
crux nursery start

# Get latest updates and fresh data
crux nursery reset
```

### Testing Latest Changes

Pull the latest published image and test:

```bash
# Pull latest image
crux nursery pull

# Restart with latest image
crux nursery restart

# Or do a complete fresh reset
crux nursery reset
```

### Database Exploration

Connect to the database to explore the demo data:

```bash
# Start the environment
crux nursery start

# Connect to PostgreSQL
crux nursery db connect

# In psql:
# \dt - list tables
# SELECT * FROM cruxes; - view demo cruxes
# \q - quit
```

## Troubleshooting

### Port already in use

If you get an error about ports being in use, stop any existing services:

```bash
# Check what's using the ports
lsof -i :3000  # Nursery API
lsof -i :5432  # Nursery PostgreSQL
lsof -i :6379  # Nursery Redis

# Stop the Nursery
crux nursery stop

# Or clean everything
crux nursery clean
```

### Containers won't start

Try cleaning and restarting:

```bash
crux nursery clean
crux nursery start
```

### Database connection issues

Make sure the database is healthy:

```bash
crux nursery status
```

You should see `Up (healthy)` for postgres.

### Nursery image is outdated

Pull the latest image and restart:

```bash
crux nursery pull
crux nursery restart

# Or do a complete fresh reset
crux nursery reset
```

### Docker daemon not running

Make sure Docker Desktop (or Docker daemon) is running:

```bash
docker ps
```

If you get an error, start Docker Desktop.

## Development Scripts

The CLI also exposes npm scripts that you can use during development:

```bash
# Run tests
npm test

# Format code with Prettier
npm run format

# Run nursery commands directly (for testing)
npm run docker:nursery
npm run docker:nursery:logs
npm run docker:nursery:down
npm run docker:nursery:clean
npm run docker:nursery:reset
npm run docker:nursery:pull
npm run docker:nursery:db
npm run docker:nursery:db:stop
npm run docker:nursery:db:connect
npm run docker:nursery:redis:connect
npm run docker:nursery:api:connect
```

## Future Features

This CLI will eventually support:

- **Cloud mode** - Login and interact with the official Crux Garden API at `api.crux.garden`
- **Data operations** - Export, import, and sync data between environments
- **Multi-instance management** - Switch between local and cloud instances

## API Development

If you're developing the Crux Garden API itself, use the npm scripts in the [API repository](https://github.com/CruxGarden/api) instead of this CLI. This CLI is specifically for running the published Nursery environment.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Links

- [API Repository](https://github.com/CruxGarden/api)
- [Documentation](https://github.com/CruxGarden/api#readme)
- [Issues](https://github.com/CruxGarden/cli/issues)
