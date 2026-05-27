# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Micro-frontend proof of concept using Module Federation 2.0 with Rsbuild (Rspack). A host shell dynamically loads independently deployed remote apps at runtime, backed by a Go BFF that serves assets and proxies API calls.

## Commands

```bash
# Install dependencies
pnpm install

# Dev (all apps concurrently via Turborepo)
pnpm dev

# Build all apps
pnpm build

# Build + serve via BFF (production-like)
pnpm serve

# Lint (TypeScript type-check across all apps)
pnpm lint

# Run Go tests (from apps/bff/)
cd apps/bff && go test ./...

# Run a single Go test
cd apps/bff && go test ./internal/proxy/ -run TestProxyStripsPrefix
```

## Architecture

### Monorepo Layout

- **pnpm workspaces + Turborepo** — `apps/*` and `packages/*` are workspace members
- **apps/host** — Shell app (port 3000). Loads remotes via Module Federation runtime, provides top-level nav and routes (`/one/*`, `/two/*`)
- **apps/remote-one** — First remote (port 3001). Exposes `./App` with internal routing (Dashboard, Settings)
- **apps/remote-two** — Second remote (port 3002). Exposes `./App` with internal routing (Overview, Details)
- **apps/bff** — Go backend (port 8080). Serves host dist, provides `/api/config` for remote URLs, reverse-proxies `/api/proxy/*`
- **packages/** — Reserved for shared libraries (empty currently)

### Module Federation

All apps use `@module-federation/rsbuild-plugin`. Shared singletons: `react`, `react-dom`, `react-router-dom`.

- Host resolves remotes via manifest URLs (`mf-manifest.json`)
- Remotes expose their root `./App` component
- Each remote owns its own internal routing — the host just mounts at a wildcard route
- `loadRemote.ts` in host wraps `@module-federation/runtime` with `React.lazy`

### Go BFF (apps/bff)

Standard library HTTP server (`net/http`). Internal packages:
- `internal/config` — loads env vars (`PORT`, `HOST_DIST_PATH`, `REMOTE_ONE_URL`, `REMOTE_TWO_URL`)
- `internal/static` — file server with SPA fallback (serves `index.html` for unknown paths)
- `internal/proxy` — reverse proxy that strips `/api/proxy` prefix before forwarding

### Dev vs Production Flow

- **Dev:** Each app runs its own Rsbuild dev server. Host fetches remotes directly from `localhost:3001/3002`
- **Production-like (`pnpm serve`):** Builds all frontend apps, then BFF serves host dist and remotes are accessed via their configured URLs
