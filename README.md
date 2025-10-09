# Crux Garden CLI

CLI tool to run the Crux Garden API locally with Docker.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed and running
- [Node.js](https://nodejs.org/) 18 or higher

## Installation

Install globally with npm:

```bash
npm install -g @cruxgarden/cli
```

Or use with npx (no installation required):

```bash
npx @cruxgarden/cli start
```

## Quick Start

Start the entire stack (PostgreSQL, Redis, and API):

```bash
crux start
```

The API will be available at `http://localhost:3000`

View logs:

```bash
crux logs
```

Stop the stack:

```bash
crux stop
```

## Commands

### `crux start`

Start the Crux Garden API stack (PostgreSQL, Redis, and API).

```bash
crux start
```

**Options:**
- `--db-only` - Start only database services (PostgreSQL and Redis), without the API

### `crux stop`

Stop all running services.

```bash
crux stop
```

### `crux restart`

Restart all services.

```bash
crux restart
```

### `crux status`

Show the status of all services.

```bash
crux status
```

### `crux logs`

View API logs.

```bash
crux logs

# Follow logs (like tail -f)
crux logs -f
```

### `crux clean`

Stop and remove all containers, volumes, and images. **Warning: This deletes all data!**

```bash
crux clean
```

### `crux db:connect`

Connect to the PostgreSQL database with `psql`.

```bash
crux db:connect
```

Useful psql commands:
- `\dt` - List all tables
- `\d table_name` - Describe a table
- `\q` - Quit

### `crux redis:connect`

Connect to Redis with `redis-cli`.

```bash
crux redis:connect
```

## Environment Variables

The CLI uses sensible defaults, but you can customize behavior by creating a `.env` file in your working directory:

```bash
# Database
DATABASE_URL=postgresql://cruxgarden:cruxgarden_dev_password@postgres:5432/cruxgarden
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-for-development-only

# AWS (for email)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
FROM_EMAIL_ADDRESS=noreply@example.com

# CORS
CORS_ORIGIN=*

# Logging
LOG_LEVEL=info
```

## Services

When you run `crux start`, the following services are started:

- **API**: `http://localhost:3000` - Crux Garden API
- **PostgreSQL**: `localhost:5432` - Database
- **Redis**: `localhost:6379` - Cache

## Development Workflow

1. Start the database services:
   ```bash
   crux start --db-only
   ```

2. Run your own API instance locally (not in Docker) for development:
   ```bash
   cd /path/to/api
   npm run start:dev
   ```

3. When done, stop the services:
   ```bash
   crux stop
   ```

## Troubleshooting

### Port already in use

If you get an error about ports being in use, stop any existing services:

```bash
# Check what's using port 3000
lsof -i :3000

# Stop the Crux Garden stack
crux stop

# Or clean everything
crux clean
```

### Containers won't start

Try cleaning and restarting:

```bash
crux clean
crux start
```

### Database connection issues

Make sure the database is healthy:

```bash
crux status
```

You should see `Up (healthy)` for postgres.

## License

MIT

## Links

- [API Repository](https://github.com/CruxGarden/api)
- [Documentation](https://github.com/CruxGarden/api#readme)
- [Issues](https://github.com/CruxGarden/cli/issues)
