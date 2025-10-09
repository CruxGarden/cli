# Crux Garden - Architecture & Distribution Strategy

## Overview

Crux Garden has three primary distribution channels, each optimized for different user types and use cases.

## Distribution Channels

### 1. Web App (Cloud SaaS)
**Target Audience:** General users, easiest entry point

**Architecture:**
```
Browser → HTTPS → api.crux.garden (NestJS API)
                      ↓
              PostgreSQL + Redis
```

**Characteristics:**
- No installation required
- Always up-to-date
- Cloud-connected only
- Accessible from anywhere
- Easiest onboarding

**Tech Stack:**
- Frontend: React/Vue/Svelte (TBD)
- Backend: NestJS API (this repo)
- Database: PostgreSQL (Supabase)
- Cache: Redis
- Hosting: Render / Vercel / Railway

---

### 2. Desktop App (Offline-First Local App)
**Target Audience:** Privacy-conscious users, offline workers, self-hosters

**Architecture:**
```
Electron/Tauri App
    ↓
├─ Main Process
│   └─ Starts NestJS API on localhost:54321
│       └─ SQLite database
│
└─ Renderer Process (UI)
    └─ http://localhost:54321 OR https://api.crux.garden
```

**Key Innovation:** **Bundles the same NestJS API** inside the desktop app!
- ✅ 100% code reuse (no rewrite needed)
- ✅ Just swap PostgreSQL → SQLite in config
- ✅ Same business logic, routes, validation
- ✅ One codebase to maintain

**Characteristics:**
- Standalone desktop application
- No Docker required
- Runs local API server on random port
- Works 100% offline with local SQLite database
- Optional cloud connection when online
- Self-contained, portable

**Operating Modes:**

#### Mode A: Cloud-Connected (Default)
```javascript
Desktop App (Renderer) → HTTPS → api.crux.garden
```
- No local API running
- All data in cloud
- Requires internet
- Lightweight (no background server)

#### Mode B: Local-Only (Privacy Mode)
```javascript
Desktop App
    ↓
Main Process → Starts NestJS API on localhost:54321
                    ↓
                SQLite (~/.cruxgarden/local.db)
    ↓
Renderer → http://localhost:54321
```
- Local API runs on startup
- All data local (SQLite)
- No account required
- 100% offline
- No cloud connection

#### Mode C: Hybrid (Sync Mode)
```javascript
Desktop App
    ↓
Main Process → NestJS API on localhost:54321
                    ↓
                SQLite (primary)
                    ↓
                Background Sync → api.crux.garden
    ↓
Renderer → http://localhost:54321
```
- Local API as primary
- Periodic sync with cloud
- Offline-capable with cloud backup
- Best of both worlds

**Tech Stack:**
- Framework: Electron or Tauri
- Frontend: Same as web app (React/Vue/Svelte)
- **Backend: Bundled NestJS API** (same code as cloud!)
- Local Database: Knex + better-sqlite3 (SQLite adapter)
- Cloud Sync: HTTP client to api.crux.garden

**No Docker, No PostgreSQL, No Redis** - Just SQLite + bundled Node.js!

**Data Storage:**
- macOS: `~/Library/Application Support/CruxGarden/local.db`
- Windows: `%APPDATA%/CruxGarden/local.db`
- Linux: `~/.config/CruxGarden/local.db`

**User Flows:**

**New User - Cloud Mode:**
1. Download Crux Garden.app
2. Open app → "Sign in with Crux Garden"
3. OAuth login → Connected to api.crux.garden
4. Start using immediately

**Privacy User - Local Mode:**
1. Download Crux Garden.app
2. Open app → "Use locally without account"
3. App creates local SQLite database
4. All data stays on device

**Power User - Hybrid Mode:**
1. Sign in to cloud account
2. Settings → Enable "Offline mode"
3. App syncs cloud data to SQLite
4. Works offline, syncs when connected

---

### 3. Developer CLI (Local Development Environment)
**Target Audience:** Developers building integrations, contributors, testers

**Repository:** `@cruxgarden/cli` (separate repo)

**Architecture:**
```
CLI Commands
    ↓
Docker Compose
    ↓
Containers: postgres + redis + api (pulled from ghcr.io)
```

**Characteristics:**
- Full production-like stack locally
- Uses Docker for services
- Pulls published API image
- Hot-reloadable for development
- Database introspection tools

**Usage:**
```bash
# Install
npm install -g @cruxgarden/cli

# Start full stack
crux start

# Start just databases (for API development)
crux start --db-only

# Connect to database
crux db:connect

# View logs
crux logs -f

# Clean up
crux clean
```

**Services Started:**
- API: `http://localhost:3000` (Docker image: `ghcr.io/cruxgarden/api:latest`)
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

**Use Cases:**
1. **Frontend developers** building clients against local API
2. **Integration developers** testing third-party integrations
3. **Contributors** working on API features
4. **QA/Testing** running full stack for integration tests

**Future Features:**
- Cloud login mode to interact with api.crux.garden
- Import/export tools
- Bulk operations
- CI/CD integration

---

## Comparison Matrix

| Feature | Web App | Desktop App | Developer CLI |
|---------|---------|-------------|---------------|
| **Installation** | None | Download .app/.exe | `npm install -g` |
| **Docker Required** | No | No | Yes |
| **Offline Mode** | ❌ | ✅ | ✅ |
| **Cloud Sync** | N/A (always cloud) | ✅ Optional | Planned |
| **Database** | PostgreSQL (cloud) | SQLite (local) | PostgreSQL (Docker) |
| **Target User** | Everyone | Privacy/offline users | Developers |
| **Data Location** | Cloud only | Local or Cloud | Local (Docker) |
| **Updates** | Automatic | App store | `npm update` |
| **Authentication** | Required | Optional | Optional |

## Technical Architecture Details

### API (This Repository)

**Framework:** NestJS (Node.js/TypeScript)

**Database:**
- Production: PostgreSQL (Supabase)
- Development: PostgreSQL (Docker or Supabase local)
- Migrations: Knex.js

**Cache:** Redis

**Authentication:** JWT with refresh tokens (stored in Redis)

**Key Services:**
- `DbService` - Database access via Knex
- `RedisService` - Cache operations
- `KeyMaster` - UUID and short key generation
- `EmailService` - AWS SES integration
- `AuthService` - JWT authentication

**API Architecture Pattern:**
```
Controller → Service → Repository → Database
```

### Desktop App (Future)

**Frontend Framework:** React/Vue/Svelte (shared with web)

**Desktop Framework:** Electron or Tauri

**Backend:** NestJS API (same codebase as cloud API!)

**Implementation:**

```javascript
// electron/main.js
import { spawn } from 'child_process';
import { app } from 'electron';
import getPort from 'get-port';

let apiProcess;
let apiPort;

app.on('ready', async () => {
  const userMode = getUserPreference(); // 'cloud', 'local', or 'hybrid'

  if (userMode === 'cloud') {
    // No local API needed
    createWindow('https://api.crux.garden');
  } else {
    // Start local API
    apiPort = await getPort({ port: 54321 }); // Random available port

    apiProcess = spawn('node', ['dist/main.js'], {
      env: {
        ...process.env,
        PORT: apiPort,
        DATABASE_URL: `sqlite://${app.getPath('userData')}/local.db`,
        NODE_ENV: 'production',
        SYNC_ENABLED: userMode === 'hybrid' ? 'true' : 'false',
        SYNC_TARGET: 'https://api.crux.garden'
      }
    });

    // Wait for API to be ready
    await waitForApi(`http://localhost:${apiPort}`);

    // Open UI pointing to local API
    createWindow(`http://localhost:${apiPort}`);
  }
});

app.on('quit', () => {
  if (apiProcess) apiProcess.kill();
});
```

**Local Database:**
- Library: Knex + better-sqlite3
- Format: SQLite 3
- Location: OS-specific app data directory
- **Same schema as PostgreSQL** (Knex migrations work for both!)

**Database Configuration:**

```javascript
// knexfile.js (already exists!)
{
  development: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL,
    // ...
  },
  production: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL,
    // ...
  },
  desktop: {
    client: 'better-sqlite3',
    connection: {
      filename: process.env.DATABASE_URL.replace('sqlite://', '')
    },
    useNullAsDefault: true,
    // Same migrations work!
    migrations: {
      directory: './db/migrations'
    }
  }
}
```

**Sync Strategy (Hybrid Mode):**
1. Local SQLite API is primary/authoritative
2. Background sync service runs in NestJS app
3. Periodically syncs with api.crux.garden
4. Conflict resolution:
   - Last-write-wins for simple fields
   - Manual resolution for complex conflicts
   - Version history tracking

**Why SQLite (not PostgreSQL)?**
- ✅ Single file (easy backup)
- ✅ Cross-platform
- ✅ No configuration needed
- ✅ Fast for single-user workloads
- ✅ Proven (used by Firefox, Chrome, iOS, Android)
- ✅ **Knex supports both PostgreSQL and SQLite!**

**Why Bundle NestJS API (not rewrite)?**
- ✅ Zero code duplication
- ✅ One codebase for cloud + desktop
- ✅ Same validation, business logic, routes
- ✅ Just swap database config
- ✅ Easier to maintain

### Developer CLI

**Implementation:** Node.js CLI tool

**Docker Images:**
- API: `ghcr.io/cruxgarden/api:latest`
- PostgreSQL: `postgres:16-alpine`
- Redis: `redis:7-alpine`

**Commands Implementation:**
- Uses `child_process.execSync` to run Docker commands
- Reads from `docker/docker-compose.yml` template
- Stores config in `~/.crux/config.json`

**CLI Connects to ANY API Instance:**

The CLI can connect to three different API instances:

```javascript
// CLI auto-discovers running API
async function detectRunningInstance() {
  // 1. Check for desktop app API
  if (await portIsOpen(54321)) {
    return { url: 'http://localhost:54321', type: 'desktop' };
  }

  // 2. Check for Docker dev stack
  if (await portIsOpen(3000)) {
    return { url: 'http://localhost:3000', type: 'docker' };
  }

  // 3. Check for cloud authentication
  const cloudToken = getStoredToken();
  if (cloudToken) {
    return { url: 'https://api.crux.garden', type: 'cloud' };
  }

  // 4. Default to cloud (requires login)
  return { url: 'https://api.crux.garden', type: 'cloud' };
}
```

**Unified CLI Workflow:**

```bash
# Scenario 1: Desktop app is running
open "Crux Garden.app"  # Starts API on localhost:54321
crux cruxes list        # → Connects to desktop app API
crux cruxes export > backup.json

# Scenario 2: Docker dev stack
crux start              # Starts Docker on localhost:3000
crux cruxes list        # → Connects to Docker API
crux logs -f

# Scenario 3: Cloud API
crux login
crux cruxes list        # → Connects to api.crux.garden
crux cruxes create "Cloud Crux"

# Manual override
crux --api http://localhost:54321 cruxes list
crux --api https://api.crux.garden cruxes list
```

**This enables powerful workflows:**

```bash
# Export from desktop, import to cloud
open "Crux Garden.app"
crux export --output desktop-backup.json
crux login
crux import desktop-backup.json --target cloud

# Or sync between local and cloud
crux sync --from desktop --to cloud
```

## Data Model Compatibility

All three distributions use the same core data model:

**Core Entities:**
- Accounts (users)
- Authors (profiles)
- Cruxes (ideas/notes)
- Paths (collections)
- Dimensions (relationships: gates, gardens, growth, grafts)
- Tags (labels)
- Themes (styling)
- Markers (path-to-crux links)

**Database Schema:** Shared PostgreSQL schema (Knex migrations)

**Desktop App Translation:**
- SQLite schema mirrors PostgreSQL schema
- camelCase → snake_case translation
- Same validation rules
- Same business logic

## Sync Considerations (Desktop Hybrid Mode)

### Sync Strategy:

**Initial Sync (Cloud → Local):**
```javascript
1. User logs in
2. App fetches all user data from api.crux.garden
3. Writes to local SQLite
4. Marks sync timestamp
```

**Periodic Sync (Bidirectional):**
```javascript
1. Fetch changes from cloud since last sync
2. Fetch local changes since last sync
3. Merge:
   - No conflict: Apply both
   - Conflict: Last-write-wins OR manual resolution
4. Update sync timestamp
```

**Offline Changes:**
- Queue local changes
- Sync when connection restored
- Handle conflicts gracefully

### Conflict Resolution:

**Simple Strategy (MVP):**
- Last-write-wins based on `updated` timestamp
- User sees notification of overwritten changes

**Advanced Strategy (Future):**
- Version history tracking
- Manual conflict resolution UI
- Field-level merging
- Operational transformation (CRDT)

## Distribution & Deployment

### Web App
- **Frontend:** Vercel / Netlify
- **Backend API:** Render / Railway
- **Database:** Supabase (managed PostgreSQL)
- **Redis:** Render / Upstash
- **CI/CD:** GitHub Actions

### Desktop App
- **macOS:** .dmg via electron-builder
- **Windows:** .exe via electron-builder
- **Linux:** AppImage / .deb / .rpm
- **Updates:** electron-updater (auto-update)
- **Distribution:** GitHub Releases / Mac App Store / Website

### Developer CLI
- **Registry:** npm (npmjs.com)
- **Package:** `@cruxgarden/cli`
- **Installation:** `npm install -g @cruxgarden/cli`
- **Updates:** `npm update -g @cruxgarden/cli`

## Docker Image Publishing

**Registry:** GitHub Container Registry (ghcr.io)

**Images:**
- `ghcr.io/cruxgarden/api:latest` (main branch)
- `ghcr.io/cruxgarden/api:v1.2.3` (tagged releases)

**Build Process:**
1. Push to `main` branch
2. GitHub Actions builds Docker image
3. Runs migrations in build step
4. Publishes to ghcr.io
5. CLI pulls this image when users run `crux start`

**Dockerfile Strategy:**
- Multi-stage build
- Includes compiled TypeScript
- Includes migrations (TypeScript source)
- Runs migrations via entrypoint script on startup
- Does NOT prune devDependencies (needed for ts-node)

## Security Considerations

### Web App
- HTTPS only
- JWT authentication
- CORS restrictions
- Rate limiting
- SQL injection protection (Knex parameterized queries)

### Desktop App
- Local SQLite encryption (optional)
- Keychain integration for tokens
- Secure token storage
- No plaintext passwords

### Developer CLI
- Local only (trusted environment)
- Optional cloud authentication
- No sensitive data in logs

## Open Architecture Questions

### 1. Desktop App Framework Choice
**Options:**
- **Electron:** Mature, larger bundle (~150MB), Node.js + Chromium
- **Tauri:** Modern, smaller bundle (~15MB), Rust + OS webview

**Recommendation:** Start with Electron (faster development), migrate to Tauri if size matters

### 2. Desktop Sync Conflicts
**Current Plan:** Last-write-wins

**Future Options:**
- Manual conflict resolution UI
- CRDTs (Yjs, Automerge)
- Operational transformation

### 3. CLI Cloud Mode Priority
**Question:** How soon to build cloud API access in CLI?

**Recommendation:** Phase 3 (after local dev environment is stable)

### 4. Shared Frontend Code
**Question:** How much code to share between web and desktop?

**Options:**
- 100% shared (same app, different entry points)
- Core components shared, shell different
- Separate apps, shared component library

**Recommendation:** Core components shared, shell adapts to platform

## Development Workflow Recommendations

### For API Development:
```bash
# Use CLI to run databases only
crux start --db-only

# Run API from source with hot reload
cd ~/api
npm run start:dev
```

### For Frontend Development:
```bash
# Start full stack via CLI
crux start

# Develop frontend against local API
cd ~/frontend
npm run dev
```

### For Desktop App Development:
```bash
# Local SQLite mode (no API needed)
npm run dev

# Cloud mode (point to staging API)
VITE_API_URL=https://staging.api.crux.garden npm run dev
```

### For Integration Testing:
```bash
# Start full stack
crux start

# Run integration tests
npm run test:integration
```

## Future Considerations

### Mobile Apps
Could follow same pattern as desktop:
- React Native / Flutter
- SQLite local storage
- Optional cloud sync
- Same API endpoints

### Self-Hosted API
Users could run the API themselves:
```bash
docker pull ghcr.io/cruxgarden/api:latest
docker-compose up -d
```

Point desktop app to their own API instance.

### Plugin/Extension System
Desktop app could support plugins:
- Export to Obsidian/Notion
- Import from Roam/Logseq
- Custom themes
- Automation scripts

## Conclusion

**One API Codebase, Three Deployment Targets:**

1. **Web App** → Cloud API (api.crux.garden) + PostgreSQL
2. **Desktop App** → Bundled API (localhost:54321) + SQLite
3. **Developer CLI** → Docker API (localhost:3000) + PostgreSQL

**One CLI, Three Connections:**

The CLI can connect to all three API instances, enabling:
- Desktop app management from terminal
- Local development workflows
- Cloud data operations
- Sync between instances

**Key Architectural Insights:**

1. **No Code Duplication** - Same NestJS API runs in cloud, desktop, and Docker
2. **Database Flexibility** - Knex supports both PostgreSQL (cloud/dev) and SQLite (desktop)
3. **Unified Interface** - CLI works with any running API instance
4. **Progressive Enhancement** - Start with cloud, add desktop for offline, use Docker for development

**The Power of Bundling:**

By bundling the NestJS API inside the desktop app, we get:
- ✅ Zero maintenance overhead (one codebase)
- ✅ Feature parity (cloud and desktop identical)
- ✅ Easy testing (same API everywhere)
- ✅ CLI interoperability (desktop app becomes scriptable)

**Docker is for developers, SQLite is for end users, but the API is universal.**
