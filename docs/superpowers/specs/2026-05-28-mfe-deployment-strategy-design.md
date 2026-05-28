# MFE Deployment Strategy for Independent Remote Repositories

## Context

Micro-frontend POC using Module Federation 2.0 with Rsbuild. The host shell loads remote apps at runtime. Remote apps will move to their own repositories and deploy independently. This design covers discovery, versioning, rollback, and shared dependency management.

## Constraints

- 2-5 remotes, small scale
- Fixed environments: dev, staging, prod
- CI-agnostic (no assumption on tooling)
- Hosting-agnostic (could be S3+CDN, containers, or shared CDN with path prefixes)
- Simple module remotes (bridge pattern is a future extension for monolith apps)

---

## 1. Remote Registry (Discovery)

The BFF's `GET /api/config` endpoint is the source of truth for remote locations. The host fetches it at runtime.

### Registry response shape

```json
{
  "remotes": {
    "remote_one": {
      "url": "https://remote-one.cdn.example.com/v2.1.0/mf-manifest.json",
      "version": "2.1.0"
    },
    "remote_two": {
      "url": "https://remote-two.cdn.example.com/v1.4.0/mf-manifest.json",
      "version": "1.4.0"
    }
  }
}
```

### BFF implementation

- Each remote's URL is configured via environment variables (existing pattern)
- Registry includes version metadata for observability
- One registry per environment (each BFF instance serves its own config)

---

## 2. Versioned Asset Deployment (Remote CI/CD)

Each remote produces immutable, versioned artifacts that never overwrite previous versions.

### CDN structure per remote

```
https://remote-one.cdn.example.com/
  ├── v2.0.0/
  │   ├── mf-manifest.json
  │   ├── remoteEntry.js
  │   └── static/
  ├── v2.1.0/
  │   ├── mf-manifest.json
  │   ├── remoteEntry.js
  │   └── static/
  └── latest → v2.1.0/   (optional pointer)
```

### Remote CI pipeline steps

1. Fetch `shared-contract.json` from host repo (version compatibility check)
2. Semver check: remote's deps satisfy host's required ranges — fail if not
3. Build with `assetPrefix` set to the versioned URL
4. Upload artifacts to versioned path (never overwrite)
5. Update BFF registry with new manifest URL for the target environment (mechanism: update the environment variable or config file that the BFF reads, then trigger a BFF restart/redeploy — exact mechanism depends on hosting platform)

### Version source

Version comes from the remote's `package.json` version or git tag.

---

## 3. Shared Dependency Version Strategy

Strategy: **host leads upgrades, remotes follow within one sprint (2-4 weeks)**.

### Shared dependency contract

The host repo owns a `shared-contract.json` at its root:

```json
{
  "shared": {
    "react": { "requiredVersion": "^18.0.0" },
    "react-dom": { "requiredVersion": "^18.0.0" },
    "react-router-dom": { "requiredVersion": "^6.0.0" }
  }
}
```

Published via raw git URL from the host repository (e.g., `https://raw.githubusercontent.com/your-org/host-app/main/shared-contract.json`).

### CI gate

Each remote's CI pipeline fetches the contract and runs a semver check against its own `package.json` dependencies. If the remote's version doesn't satisfy the host's range, the deploy is blocked.

### Upgrade flow

1. Host bumps the shared dependency (e.g., React 18 → 19)
2. Host updates `shared-contract.json` to accept both: `"^18.0.0 || ^19.0.0"`
3. Host builds and deploys
4. Remote teams notified: upgrade window open (2-4 weeks)
5. After window: host tightens contract to `"^19.0.0"` only
6. Remote CI now blocks any deploy still on the old version

### Escape hatch: remote ahead of host

If a remote team needs a newer version of a shared dependency but the host isn't ready to upgrade:

1. **Preferred: push the host to upgrade first** — request the host team widen the contract, then follow the normal upgrade flow.

2. **Escape hatch: opt out of sharing** — the remote sets `singleton: false` for that specific dependency in its MF config and excludes it from the CI contract check:

```ts
// Remote's rsbuild.config.ts (temporary)
shared: {
  react: { singleton: false },  // bundles own copy
  "react-dom": { singleton: false },
}
```

**Trade-offs of opting out:**
- Increased bundle size (remote ships its own React)
- Two React instances on the page — can cause issues with hooks and context if components cross boundaries
- Must be temporary — re-enable sharing once the host catches up

**When to use:** Only when the remote is blocked and the host upgrade is more than one sprint away. The remote team must test thoroughly that their components work in isolation (no shared context/hooks crossing the host-remote boundary).

### Module Federation shared config

```ts
shared: {
  react: { singleton: true, requiredVersion: "^18.0.0" },
  "react-dom": { singleton: true, requiredVersion: "^18.0.0" },
  "react-router-dom": { singleton: true, requiredVersion: "^6.0.0" },
}
```

Uses `shareStrategy: "version-first"` so the highest compatible version is selected at runtime.

---

## 4. Host Deployment Strategy

The host does not rebuild when a remote deploys. It discovers remotes at runtime.

### Host CI/CD pipeline

1. Build host app (produces `dist/`)
2. Deploy built assets to hosting target
3. Deploy/update BFF with new host dist and registry config

### When the host redeploys

- Host's own code changes (nav, layout, routing shell)
- Shared dependency version upgrade (updates contract)
- Adding or removing a remote from the registry

### Build config change

Production discovery happens at runtime. The `remotes` field is dev-only:

```ts
// rsbuild.config.ts
remotes: process.env.NODE_ENV === 'development'
  ? {
      remote_one: "remote_one@http://localhost:3001/mf-manifest.json",
      remote_two: "remote_two@http://localhost:3002/mf-manifest.json",
    }
  : {}
```

---

## 5. Runtime Discovery in the Host

The host fetches the registry and registers remotes before rendering.

### Bootstrap flow

```ts
// src/bootstrap.tsx
import { registerRemotes } from "@module-federation/runtime";

async function bootstrap() {
  const res = await fetch("/api/config");
  const { remotes } = await res.json();

  registerRemotes(
    Object.entries(remotes).map(([name, info]) => ({
      name,
      entry: info.url,
    }))
  );

  const { createRoot } = await import("react-dom/client");
  const { default: App } = await import("./App");
  createRoot(document.getElementById("root")!).render(<App />);
}

bootstrap();
```

### Error handling

- `/api/config` fails → show fallback/error UI
- Specific remote manifest fails → error boundary on that route, other remotes unaffected

### Dev mode

Skips the fetch — uses hardcoded localhost URLs from `rsbuild.config.ts`.

---

## 6. Rollback Strategy

Rollback is a pointer update, not a redeploy.

### Rolling back a remote

1. Update the BFF registry to point at the previous version's manifest URL
2. Next page load picks up the old version (assets still on CDN)

### Rolling back the host

1. Redeploy previous host build
2. If the rollback includes reverting a shared dependency upgrade, also revert `shared-contract.json`

### Rolling back a shared dependency upgrade

1. Host reverts build to previous version
2. Host reverts `shared-contract.json` to the old range
3. Remotes that already upgraded still work (they satisfy the old range)

### Key invariant

Remote assets are immutable and versioned. Rollback never requires rebuilding — only changing pointers.

---

## 7. End-to-End Flows

### Remote deploys a new version

```
Remote CI:
  1. Fetch shared-contract.json from host repo
  2. Semver check passes
  3. Build with versioned assetPrefix
  4. Upload to CDN at /v{x.y.z}/
  5. Update BFF registry with new manifest URL
  → Host picks up new version on next page load
```

### Host upgrades a shared dependency

```
Host repo:
  1. Bump dependency (React 18 → 19)
  2. Update shared-contract.json: "^18.0.0 || ^19.0.0"
  3. Build and deploy host
  4. Notify remote teams: upgrade window (2-4 weeks)

After window:
  5. Tighten shared-contract.json: "^19.0.0"
  6. Remote CI blocks deploys still on old version
```

---

## 8. Notes: Alternative Approaches for Version Enforcement

The chosen approach is a `shared-contract.json` file in the host repo. Below are alternatives considered and why the contract file was preferred.

### Option A: Host's mf-manifest.json (built-in)

Remote CI fetches the host's deployed `mf-manifest.json` (which already contains shared dep versions) and compares against its own.

- **Pro:** No extra file to maintain — host's build output IS the contract
- **Con:** Requires host to be deployed first (can't check against unreleased changes). Coupled to manifest format which could change across MF versions.

### Option B: Shared npm package

Publish `@your-org/mfe-shared-config` that declares allowed versions. Both host and remotes depend on it.

- **Pro:** Versioned via npm, can use lockfiles
- **Con:** Extra package to publish and maintain. Slower feedback loop (bump package, then update all repos).

### Option C: Peer dependency enforcement

Host publishes a shared package using standard npm `peerDependencies`. `pnpm install` fails if versions conflict.

- **Pro:** Uses standard npm machinery, no custom scripts
- **Con:** Only catches issues at install time, not deploy time. Peer dep warnings are easily ignored. Doesn't explicitly block CI deploy.

### Option D: BFF runtime enforcement

BFF validates compatibility when a remote's CI registers a new version. Rejects registration if versions are incompatible.

- **Pro:** Single enforcement point, no file to fetch from git
- **Con:** Failure happens late (after build + upload). BFF becomes more complex.

### Comparison

| Approach | Maintenance | Feedback speed | Coupling |
|---|---|---|---|
| **Contract JSON in repo** (chosen) | Low — one file | Fast — fails in CI before build | Low — just a git fetch |
| **Host's mf-manifest** | None — auto-generated | Medium — needs host deployed first | Medium — tied to manifest format |
| **Shared npm package** | Medium — publish cycle | Medium — fails at install | Medium — extra dependency |
| **Peer dependencies** | Low | Slow — only at install, warnings ignorable | Low |
| **BFF runtime check** | Medium — API logic | Slow — fails after build + upload | High — BFF becomes a gatekeeper |

### Why contract JSON was chosen

- Fastest feedback (fails before build in remote CI)
- Lowest maintenance (single file, version-controlled, PR-reviewable)
- No extra infrastructure or packages
- Decoupled from MF internals and hosting platform

---

## 9. Future Extensions

### Bridge pattern for monolith remotes

If a remote is a standalone monolith with its own frontend (own router, providers, full app), use `@module-federation/bridge-react` to wrap it. This provides router isolation, proper mount/unmount lifecycle, and style isolation. Migration from simple module to bridge is ~30 minutes per remote and doesn't affect the deployment infrastructure.

### Dynamic preview environments

If needed later, the registry can be extended to support per-PR preview URLs by adding a branch/PR dimension to the config lookup.

### Admin UI for registry

A small dashboard that shows current versions per environment, allows one-click rollback, and flags remotes past their upgrade deadline.
