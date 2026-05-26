# MFE Host POC — Design Spec

## Overview

A micro-frontend proof of concept using Module Federation 2.0 with Rspack. The goal is to prove the architecture works: a host shell that dynamically loads independently deployed remote apps at runtime, backed by a Go BFF for serving assets and routing API calls.

## Tech Stack

- **Bundler:** Rspack with `@module-federation/rspack`
- **Frontend:** React
- **Backend:** Go (BFF)
- **Monorepo:** pnpm workspaces + Turborepo
- **Module Federation:** 2.0 (runtime discovery via manifest)

## Monorepo Structure

```
mfe-poc/
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
├── apps/
│   ├── host/              # Shell app — loads remotes, top-level layout/nav
│   ├── remote-one/        # First remote — own pages + sub-pages
│   ├── remote-two/        # Second remote — own pages + sub-pages
│   └── bff/               # Go backend — serves host assets, proxies APIs
└── packages/              # Empty for now, ready for shared libs later
```

Each app is fully independent with its own `package.json`, Rspack config, and dev server.

## Module Federation Configuration

### Host

- Declares remotes it consumes but resolves entry URLs at runtime
- On startup, fetches `GET /api/config` from the BFF to get remote entry URLs
- Mounts each remote at a top-level route path (`/one/*`, `/two/*`)
- Shared singletons: `react`, `react-dom`

### Remotes

- Each remote exposes a root component (`./App`) containing its own React Router
- Internal routing is fully owned by the remote (e.g., `/one/dashboard`, `/one/settings`)
- Can run standalone with its own `index.html` for isolated development
- Shared singletons: `react`, `react-dom`

### Runtime Flow

1. Browser loads host shell from BFF
2. Host fetches `GET /api/config` → `{ "remote-one": "http://...", "remote-two": "http://..." }`
3. User navigates to `/one/*` → host dynamically loads remote-one's `mf-manifest.json`, mounts its `App`
4. Remote-one's internal router handles sub-routes

## Go BFF

### Responsibilities

1. **Serve host static assets** — serves built `dist/` folder, SPA fallback for non-API routes
2. **Config endpoint** — `GET /api/config` returns remote entry URLs from environment variables
3. **API proxy** — `/api/proxy/*` forwards to downstream services (stub responses for POC)

### Config Response Shape

```json
{
  "remotes": {
    "remote-one": "https://remote-one.example.com/mf-manifest.json",
    "remote-two": "https://remote-two.example.com/mf-manifest.json"
  }
}
```

### Directory Structure

```
apps/bff/
├── main.go
├── go.mod
├── internal/
│   ├── config/       # Load remote URLs from env
│   ├── proxy/        # Reverse proxy handler
│   └── static/       # Serve host dist + SPA fallback
```

### Environment Variables

```
HOST_DIST_PATH=./dist
REMOTE_ONE_URL=https://...
REMOTE_TWO_URL=https://...
PORT=8080
```

## Turborepo & Dev Workflow

### Tasks

- `build` — builds all frontend apps via Rspack, builds Go binary
- `dev` — starts all frontend dev servers in parallel
- `lint` — runs linting across all frontend apps
- `serve` — builds everything, then starts BFF serving host with real remote URLs

### Port Convention

| App | Port |
|-----|------|
| Host | 3000 |
| Remote One | 3001 |
| Remote Two | 3002 |
| BFF | 8080 |

### Key Workflows

| Scenario | Command | What happens |
|----------|---------|--------------|
| Full dev (all apps) | `pnpm dev` | All 3 frontend dev servers start, host consumes remotes via localhost URLs |
| Isolated remote dev | `cd apps/remote-one && pnpm dev` | Remote runs standalone with its own index.html |
| Integration test | `pnpm build && pnpm serve` | Builds all apps, BFF serves host and proxies to built remotes |

### Pipeline

`host#build` does not depend on remote builds. They are independent deployables — the host discovers remotes at runtime.

## Deployment Model

### Remotes

Each remote builds to static assets deployed to its own URL (CDN, object storage, or container). Output includes `mf-manifest.json` that the host fetches at runtime.

### Host + BFF

Host is built to static assets, served by the Go BFF binary. The BFF is deployed as a container/service configured via environment variables.

### Adding a New Remote

1. Create `apps/remote-three/` with standard Rspack + MF config
2. Expose `./App` component with internal routing
3. Deploy to its own URL
4. Add `REMOTE_THREE_URL` to BFF environment
5. Register new route in host's router (one-line change)

No rebuilds of existing remotes required.

## Out of Scope (for POC)

- Authentication/authorization
- Shared UI component library
- CSS isolation strategy (CSS modules per app is sufficient)
- CI/CD pipeline
- Error boundaries and fallback UIs (basic only)
- Performance optimization (lazy loading beyond what MF provides)
