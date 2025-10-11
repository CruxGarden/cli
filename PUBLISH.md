# Publishing to npm

This guide explains how to publish the Crux Garden CLI to npm.

## Prerequisites

- [npm account](https://www.npmjs.com/signup) (create one if you don't have it)
- Publish access to the `@cruxgarden` scope on npm
- Git repository is up to date

## First Time Setup

### 1. Create npm Account

If you don't have an npm account yet:

```bash
# Go to npmjs.com and sign up
# Or use the CLI:
npm adduser
```

### 2. Login to npm

```bash
npm login
```

This will prompt you for:
- Username
- Password
- Email
- OTP (if you have 2FA enabled - recommended!)

### 3. Test Locally

Before publishing, test that everything works:

```bash
# Link the CLI globally for testing
npm link

# Test commands
crux --help
crux nursery start --help
crux nursery status

# Unlink when done testing
npm unlink -g @cruxgarden/cli
```

### 4. Verify Package Contents

Check what files will be included in the published package:

```bash
# Dry run to see what files will be included
npm pack --dry-run
```

Review the output carefully. The package should include:
- `bin/crux.js`
- `lib/commands.js`
- `docker/docker-compose.nursery.yml`
- `package.json`
- `README.md`

It should **NOT** include:
- `.git/`
- `node_modules/`
- Test files
- Development-only documentation

## Publishing Workflow

### Initial Publish (v0.0.1)

For the very first publish:

```bash
# 1. Make sure everything is committed
git add .
git commit -m "Prepare for initial npm publish"
git push

# 2. Publish to npm (scoped packages require --access public)
npm publish --access public

# 3. Create git tag
git tag v0.0.1
git push --tags
```

### Verify Publication

After publishing, verify it worked:

```bash
# Check package info on npm
npm view @cruxgarden/cli

# Test installation with npx
npx @cruxgarden/cli nursery --help

# Or install globally and test
npm install -g @cruxgarden/cli
crux nursery --help
npm uninstall -g @cruxgarden/cli
```

## Publishing Updates

For all future updates, follow this workflow:

### 1. Make Your Changes

```bash
# Make code changes
git add .
git commit -m "Add new feature" # or "Fix bug" or "Update docs"
git push
```

### 2. Bump Version

Use [Semantic Versioning](https://semver.org/):

```bash
# Patch release (bug fixes): 0.0.1 → 0.0.2
npm version patch

# Minor release (new features, backward compatible): 0.0.1 → 0.1.0
npm version minor

# Major release (breaking changes): 0.0.1 → 1.0.0
npm version major
```

The `npm version` command automatically:
- Updates `package.json`
- Creates a git commit
- Creates a git tag

### 3. Publish to npm

```bash
# Publish the new version
npm publish

# Push the version commit and tag to GitHub
git push && git push --tags
```

## Semantic Versioning Guide

Follow [semver](https://semver.org/) principles:

- **Patch (0.0.x)**: Bug fixes, documentation updates, minor tweaks
  - Example: Fix typo in error message, update README
  - `npm version patch`

- **Minor (0.x.0)**: New features, backward compatible changes
  - Example: Add new command, new option to existing command
  - `npm version minor`

- **Major (x.0.0)**: Breaking changes, incompatible API changes
  - Example: Remove command, change command structure, require new Node version
  - `npm version major`

## Example Update Workflow

Here's a complete example of publishing a bug fix:

```bash
# 1. Fix the bug
# ... edit code ...

# 2. Test locally
npm link
crux nursery start
npm unlink -g @cruxgarden/cli

# 3. Commit changes
git add .
git commit -m "Fix: Resolve issue with database connection handling"
git push

# 4. Bump patch version (0.0.1 → 0.0.2)
npm version patch

# 5. Publish to npm
npm publish

# 6. Push version bump and tag
git push && git push --tags

# 7. Verify
npm view @cruxgarden/cli version
```

## Important Notes

### npm Policies

- **Cannot unpublish**: After 24 hours, packages cannot be unpublished
- **Cannot reuse versions**: Once a version is published, that version number is permanent
- **Scoped packages**: `@cruxgarden/cli` requires `--access public` on first publish

### Best Practices

1. **Always test locally** with `npm link` before publishing
2. **Keep CHANGELOG.md updated** (if you add one) with changes in each version
3. **Use descriptive commit messages** that explain what changed
4. **Tag releases in GitHub** (automatically done by `npm version`)
5. **Verify publication** after each publish with `npm view @cruxgarden/cli`
6. **Enable 2FA on npm** for security (highly recommended)

### Security

- Enable two-factor authentication (2FA) on your npm account
- Use automation tokens for CI/CD (not your personal credentials)
- Keep your npm credentials secure

## Automation (Future)

Eventually you can automate publishing with GitHub Actions:

```yaml
# .github/workflows/publish.yml
name: Publish to npm
on:
  push:
    tags:
      - 'v*'
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm test
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

But for now, manual publishing is fine and gives you full control.

## Troubleshooting

### "You do not have permission to publish"

Make sure you:
1. Are logged in: `npm whoami`
2. Have access to the `@cruxgarden` scope
3. Used `--access public` for scoped packages

### "Version already exists"

You cannot republish the same version. Bump the version:
```bash
npm version patch
npm publish
```

### "Package not found" after publishing

Wait a few minutes - npm registry can take time to propagate. Then try:
```bash
npm view @cruxgarden/cli
```

### Need to unpublish

Within 24 hours, you can unpublish:
```bash
npm unpublish @cruxgarden/cli@0.0.1
```

After 24 hours, you cannot unpublish. Instead, deprecate:
```bash
npm deprecate @cruxgarden/cli@0.0.1 "This version has a critical bug, please upgrade"
```

## Resources

- [npm Documentation](https://docs.npmjs.com/)
- [Semantic Versioning](https://semver.org/)
- [npm CLI Reference](https://docs.npmjs.com/cli/v9/commands)
- [Creating and Publishing Scoped Packages](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages)
