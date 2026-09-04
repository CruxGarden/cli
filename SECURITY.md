# Security Policy

This file covers the `crux` **CLI** (`@cruxgarden/cli`), which runs the Nursery demo environment
with Docker. The API image it starts has its own policy in the `api` repository; the desktop app
has one in the `app` repository.

## Supported Versions

Security fixes go into the current release line only (`version` in `package.json`).

| Version | Supported          |
| ------- | ------------------ |
| 0.0.x   | :white_check_mark: |
| older   | :x:                |

## Reporting a Vulnerability

We take the security of Crux Garden seriously. If you believe you have found a security
vulnerability, please report it to us as described below.

### Please do NOT:

- Open a public GitHub issue for security vulnerabilities
- Publicly disclose the vulnerability before it has been addressed

### Please DO:

1. **Report privately** - Email security details to [keeper@crux.garden](mailto:keeper@crux.garden)
2. **Provide details** - Include steps to reproduce, potential impact, and any suggested fixes
3. **Allow time** - Give us reasonable time to address the issue before any public disclosure

### What to include in your report:

- Type of vulnerability (e.g. command injection through an argument, a secret written to disk or
  to logs, a container exposed beyond localhost)
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the vulnerability, including how an attacker might exploit it

### What to expect:

- **Acknowledgment** - We will acknowledge receipt of your vulnerability report within 48 hours
- **Assessment** - We will assess the vulnerability and determine its impact and severity
- **Updates** - We will send you regular updates about our progress
- **Resolution** - Once the vulnerability is fixed, we will notify you and may publicly disclose it (with your permission)
- **Credit** - We will credit you in the security advisory (unless you prefer to remain anonymous)

## What the CLI does, and what to watch

The CLI is a thin wrapper over `docker-compose` (`lib/commands.js`, `docker/docker-compose.nursery.yml`).
It starts the published images — `ghcr.io/cruxgarden/api:latest`, `postgres:16-alpine`,
`redis:7-alpine` — as a local demo environment. It has no account, sends nothing to crux.garden,
and collects no telemetry.

### The Nursery is a demo, not a deployment

- Ports (`API_PORT` 3000, `POSTGRES_PORT` 5432, `REDIS_PORT` 6379) bind on the local machine.
  Do not expose them to a network with the default credentials.
- Every setting has a development default, including `JWT_SECRET` and `POSTGRES_PASSWORD`. If a
  Nursery is ever reachable by anyone but you, override both (see the README's environment
  variables section) and treat the data as disposable.
- AWS variables default to dummy values, so the API runs in mock mode: emails are logged, nothing
  is uploaded. Real AWS keys make it a real deployment — follow the API repository's policy then.

### Secrets and environment files

- Configuration comes from a `.env` in the working directory and from `KEY=VALUE` arguments after
  a command. Never commit a `.env`; never paste real keys into a shell history you share.
- Inline `KEY=VALUE` arguments are passed to `docker-compose` as environment — they are visible in
  the process list on your machine for the duration of the command.
- No secrets are baked into images. `crux nursery clean` removes containers and volumes (all
  data); `crux nursery purge` also removes the images.

### Reporting-worthy issues in the CLI itself

- An argument or environment value reaching a shell unquoted (`runCommand` in `lib/commands.js`)
- A secret being written to a log, a file outside the working directory, or the banner
- A compose change that publishes a port on `0.0.0.0` without the README saying so

## Security Updates

Security fixes are published to npm as new `@cruxgarden/cli` versions; `npm install -g
@cruxgarden/cli` picks them up. Watch this repository to be notified.

## Additional Resources

- [Docker security](https://docs.docker.com/engine/security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

## Contact

For security concerns, please contact us at [keeper@crux.garden](mailto:keeper@crux.garden).

Thank you for helping keep Crux Garden and our users safe!
