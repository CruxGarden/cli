# Crux Garden CLI - Future Ideas & Roadmap

## Current Status (v0.1.0)

✅ **Local Development Environment**
- Start/stop Docker stack (postgres, redis, api)
- View logs
- Connect to database/redis
- Clean up containers

## Planned Features

### 1. Cloud API Integration

Connect the CLI to the production API at `https://api.crux.garden`

#### Authentication
```bash
crux login              # Authenticate with api.crux.garden (OAuth or API key)
crux logout             # Clear stored credentials
crux whoami             # Show current user info
```

#### Crux Management
```bash
crux cruxes list                    # List your cruxes
crux cruxes get <key>               # Get a specific crux
crux cruxes create <title>          # Create a new crux
crux cruxes update <key>            # Update a crux
crux cruxes delete <key>            # Delete a crux
crux cruxes search <query>          # Search cruxes

# Bulk operations
crux cruxes import <file>           # Import from JSON/markdown
crux cruxes export                  # Export all cruxes
```

#### Path Management
```bash
crux paths list                     # List your paths
crux paths get <key>                # Get a specific path
crux paths create <title>           # Create a new path
crux paths update <key>             # Update a path
crux paths delete <key>             # Delete a path
```

#### Dimension Management
```bash
crux dimensions list <crux-key>     # List dimensions for a crux
crux dimensions create              # Create dimension between cruxes
crux dimensions delete <id>         # Delete a dimension
```

#### Tag Management
```bash
crux tags list                      # List all tags
crux tags search <query>            # Search tags
crux tags create <label>            # Create a tag
```

### 2. Hybrid Mode (Local + Cloud Sync)

Work locally but sync with production:

```bash
crux start --sync                   # Start local + enable auto-sync
crux pull                           # Pull data from cloud to local
crux push                           # Push local changes to cloud
crux sync status                    # Show sync state
crux sync resolve                   # Resolve conflicts
```

**Use Cases:**
- Offline work with periodic syncs
- Backup cloud data locally
- Test migrations locally before pushing
- Work on cruxes offline

### 3. UI Integration

Add the Crux Garden UI to the local stack:

```bash
crux start --with-ui                # Start API + UI
crux ui:start                       # Start just the UI
crux ui:dev                         # Start UI in dev mode with hot reload
```

**docker-compose.yml addition:**
```yaml
ui:
  image: ghcr.io/cruxgarden/ui:latest
  container_name: cruxgarden-ui
  ports:
    - "8080:80"
  environment:
    VITE_API_URL: http://localhost:3000
```

**Access:**
- UI: `http://localhost:8080`
- API: `http://localhost:3000`

### 4. Automation & Scripting

Make the CLI scriptable for power users:

#### Bulk Import
```bash
# Import markdown files as cruxes
for file in notes/*.md; do
  crux cruxes create --from-file "$file" --tags "imported,notes"
done
```

#### Backup/Restore
```bash
# Daily backup
crux export --format json > "backup-$(date +%Y%m%d).json"

# Restore from backup
crux import backup-20231009.json
```

#### CI/CD Integration
```bash
# Auto-create release notes as crux
crux cruxes create \
  --title "Release v1.2.0" \
  --data "$RELEASE_NOTES" \
  --tags "release,v1.2.0"
```

#### Templating
```bash
crux cruxes create-from-template <template-name>
crux templates list
crux templates create <name>
```

### 5. Advanced Local Development

#### Multiple Environments
```bash
crux env create staging            # Create staging environment
crux env switch staging             # Switch to staging
crux env list                       # List all environments
```

#### Database Management
```bash
crux db:reset                       # Reset database (drop all data)
crux db:seed                        # Run seed data
crux db:migrate                     # Run migrations manually
crux db:rollback                    # Rollback last migration
crux db:backup                      # Backup local database
crux db:restore <file>              # Restore from backup
```

#### Performance & Debugging
```bash
crux logs --follow --filter=error   # Filter logs
crux stats                          # Show performance stats
crux health                         # Health check all services
crux shell api                      # Shell into API container
crux shell postgres                 # Shell into postgres container
```

### 6. Configuration Management

```bash
crux config set <key> <value>       # Set config value
crux config get <key>               # Get config value
crux config list                    # List all config
crux config reset                   # Reset to defaults
```

**Config file location:** `~/.crux/config.json`

**Example config:**
```json
{
  "defaultEnvironment": "local",
  "cloudApiUrl": "https://api.crux.garden",
  "auth": {
    "token": "...",
    "refreshToken": "..."
  },
  "local": {
    "apiPort": 3000,
    "uiPort": 8080,
    "postgresPort": 5432,
    "redisPort": 6379
  }
}
```

## Distribution Strategies

### For Developers (@cruxgarden/cli)
Current approach - npm package for building integrations:
```bash
npm install -g @cruxgarden/cli
```

### For End Users (Future)

#### Option A: Desktop App
**Name:** `Crux Garden.app` / `crux-garden-desktop`

**Tech:** Electron or Tauri

**Features:**
- Menu bar icon
- Visual status indicators
- One-click start/stop
- Auto-updates
- Backup/restore UI
- Settings panel

**Similar to:** Docker Desktop, LocalStack Desktop

#### Option B: Install Script
**URL:** `https://get.cruxgarden.com`

```bash
curl -fsSL https://get.cruxgarden.com | sh
```

**What it does:**
- Checks for Docker, installs if needed
- Pulls latest Crux Garden images
- Sets up systemd/launchd service
- Creates desktop shortcuts
- Configures auto-start

**Similar to:** Supabase self-hosting, k3s

#### Option C: Native Binary
```bash
brew install cruxgarden
cruxgarden start
```

**Tech:** Go or Rust

**Features:**
- Single binary, no dependencies
- Manages Docker containers
- System service integration
- Cross-platform

**Similar to:** k3s, minikube

## Mode Comparison

| Feature | Local Mode | Cloud Mode | Hybrid Mode |
|---------|-----------|------------|-------------|
| No internet required | ✅ | ❌ | Partial |
| Access to production data | ❌ | ✅ | ✅ |
| Fast operations | ✅ | ❌ | ✅ |
| Shareable with team | ❌ | ✅ | ✅ |
| Safe for experiments | ✅ | ⚠️ | ✅ |
| Offline capable | ✅ | ❌ | ✅ |

## Use Case Examples

### 1. Frontend Developer
```bash
# Start local API for development
crux start

# Develop React app against local API
cd my-crux-client
npm run dev
```

### 2. Integration Developer
```bash
# Start databases only
crux start --db-only

# Run API from source with hot reload
cd ~/crux-api
npm run start:dev
```

### 3. Power User (Personal Use)
```bash
# Work locally
crux start --local
crux cruxes create "Morning thoughts"

# Sync to cloud when done
crux push
```

### 4. Content Creator
```bash
# Pull production data to work offline
crux pull

# Work on cruxes locally
crux cruxes list
crux cruxes update my-essay

# Push changes back
crux push
```

### 5. DevOps / Automation
```bash
# Backup script
#!/bin/bash
crux export --format json > "backup-$(date +%Y%m%d).json"
aws s3 cp backup-*.json s3://my-backups/cruxgarden/

# Import script
#!/bin/bash
for file in imports/*.md; do
  crux cruxes create --from-file "$file"
done
```

## Technical Architecture

### Local Mode
```
CLI → Docker Compose → Containers (postgres, redis, api)
```

### Cloud Mode
```
CLI → HTTPS → api.crux.garden
```

### Hybrid Mode
```
CLI → Local DB (primary)
    → Background Sync → api.crux.garden
```

## Open Questions

1. **Sync Conflicts:** How to handle conflicts in hybrid mode?
   - Last write wins?
   - Manual conflict resolution?
   - Version history?

2. **Authentication:** OAuth or API keys?
   - Browser-based OAuth flow
   - Or simple API key generation from web UI

3. **Data Privacy:** Should local mode have encryption?
   - Encrypt local database?
   - Encrypt backups?

4. **Multi-tenancy:** Support multiple accounts?
   ```bash
   crux login --profile work
   crux login --profile personal
   crux profile switch personal
   ```

5. **Plugin System:** Allow extending the CLI?
   ```bash
   crux plugin install crux-export-obsidian
   crux export-obsidian ./vault
   ```

## Priority Ranking

### Phase 1 (Current) ✅
- [x] Local development environment
- [x] Basic Docker commands
- [x] Database connection

### Phase 2 (Next)
- [ ] Publish to npm
- [ ] Setup CI/CD for releases
- [ ] Write comprehensive docs

### Phase 3 (Future)
- [ ] Cloud API integration (login, CRUD operations)
- [ ] Import/export functionality
- [ ] Basic sync capabilities

### Phase 4 (Maybe)
- [ ] UI integration
- [ ] Desktop app
- [ ] Advanced sync with conflict resolution
- [ ] Plugin system

### Phase 5 (Nice to Have)
- [ ] Template system
- [ ] Multiple environment support
- [ ] Advanced automation features

## Notes

- Build features I (Daniel) will actually use
- Cool factor matters for developer tools
- CLI access is for power users - web UI serves most people
- Local dev environment is the most valuable feature for developers
- Cloud integration is a nice-to-have for personal workflow
