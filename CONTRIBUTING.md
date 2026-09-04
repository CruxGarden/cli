# Contributing to Crux Garden (CLI)

Thanks for helping. This repo is the `crux` CLI (nursery Docker environment and tooling).

## Ground rules

- Be kind; see `CODE_OF_CONDUCT.md`.
- Security issues go to keeper@crux.garden, not to a public issue (`SECURITY.md`).
- Vocabulary matters: use the glossary terms (Crux, Artifact, Collaboration, Growth, Mood, Project
  Folder, Publish, Plan). The glossary (`CONTEXT.md`) and the Architecture Decision Records
  (`docs/adr/0001-…` onwards) live one directory above this repo in the Crux Garden workspace
  checkout, not in this repository and not (yet) at a public URL — ask if you need a copy. Propose
  a new ADR rather than silently reversing one.

## Setup

```bash
nvm use                      # Node 22 (.nvmrc)
npm install && npm link   # `crux` on your PATH
```

## The one gate

`npm run verify` is the definition of green. Today it runs Jest with `--passWithNoTests`: the CLI
is plain ES modules (no TypeScript, no ESLint config) and has no test suite yet, so "green" means
"the command exits 0". If you add behaviour to `lib/commands.js`, add the first tests with it —
`npm test` runs the same Jest. Check the commands by hand against a running Docker:

```bash
npm link && crux nursery start && crux nursery status && crux nursery stop
```

## Pull requests

- Branch from `main`; one coherent change per PR; include tests for behaviour you add.
- Format with Prettier before you push: `npm run format`. There is no commit hook and no ESLint in
  this repo; the Claude Code hook that formats agents' edits does not apply to you.
- Say what you verified. If a step was skipped, say that.

## What the CLI sends over the network (trust statement)

The CLI talks to your local Docker daemon and pulls the published images (`ghcr.io/cruxgarden/api`,
`postgres`, `redis`) from their registries. It sends nothing to crux.garden and collects no
telemetry. The Nursery API it starts is the real API with mock AWS credentials by default, so
emails are only logged and nothing leaves your machine unless you configure real AWS keys.
