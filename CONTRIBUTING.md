# Contributing to Crux Garden (CLI)

Thanks for helping. This repo is the `crux` CLI (nursery Docker environment and tooling).

## Ground rules

- Be kind; see `CODE_OF_CONDUCT.md`.
- Security issues go to keeper@crux.garden, not to a public issue (`SECURITY.md`).
- Vocabulary matters: use the glossary terms (Crux, Artifact, Collaboration, Growth, Mood, Project
  Folder, Publish, Plan). Architecture decisions live in `docs/adr/` of the docs repo — propose a
  new ADR rather than silently reversing one.

## Setup

```bash
nvm use                      # Node 22 (.nvmrc)
npm install && npm link   # `crux` on your PATH
```

## The one gate

`npm run verify` is the definition of green: typecheck, lint, tests,

## Pull requests

- Branch from `main`; one coherent change per PR; include tests for behaviour you add.
- Prettier runs on save/commit; ESLint is `--max-warnings=0`.
- Say what you verified. If a step was skipped, say that.

## What the app sends over the network (trust statement)

AI requests go from the user's machine to the provider they chose with their own key (or a local
model). Publishing and sync send only what the user asked to publish or back up, to crux.garden.
Update checks ask GitHub Releases for the latest version and can be turned off. There are no
analytics and no crash reporting unless the user opts in; logs stay on disk. Changing this stance
is a product decision (ADR 0008) — not a PR.
