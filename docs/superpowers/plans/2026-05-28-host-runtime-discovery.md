# Host Runtime Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modify the host app to resolve remote URLs at runtime via the BFF registry instead of build-time config, update the BFF to serve versioned registry metadata, and create the shared-contract.json file.

**Architecture:** The host's bootstrap sequence will fetch `/api/config` before rendering, then call `registerRemotes()` from `@module-federation/runtime` to register remotes dynamically. The BFF config endpoint is updated to include version metadata. A `shared-contract.json` at the repo root declares the host's shared dependency version requirements.

**Tech Stack:** React 19, Module Federation 2.0 (`@module-federation/runtime`), Rsbuild, Go (net/http)

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `shared-contract.json` (repo root) | Declares shared dep version ranges for remote CI checks |
| Modify | `apps/bff/internal/config/config.go` | Add version metadata to remote config |
| Modify | `apps/bff/internal/config/config_test.go` | Update tests for new config shape |
| Modify | `apps/bff/main.go` | Serve updated registry shape from `/api/config` |
| Modify | `apps/host/rsbuild.config.ts` | Remove production remotes, keep dev-only |
| Modify | `apps/host/src/bootstrap.tsx` | Fetch registry + register remotes before rendering |
| Modify | `apps/host/src/loadRemote.ts` | No changes needed (already uses `loadRemote` by name) |

---

### Task 1: Create shared-contract.json

**Files:**
- Create: `shared-contract.json` (repo root)

- [ ] **Step 1: Create the contract file**

```json
{
  "shared": {
    "react": { "requiredVersion": "^19.2.6" },
    "react-dom": { "requiredVersion": "^19.2.6" },
    "react-router-dom": { "requiredVersion": "^7.15.1" }
  }
}
```

Create this at `/Users/kmye/codes/mfe-poc/shared-contract.json`.

- [ ] **Step 2: Verify the file is valid JSON**

Run: `cat shared-contract.json | python3 -m json.tool`
Expected: Pretty-printed JSON output with no errors.

- [ ] **Step 3: Commit**

```bash
git add shared-contract.json
git commit -m "feat: add shared-contract.json for remote CI version checks"
```

---

### Task 2: Update BFF config to include version metadata

**Files:**
- Modify: `apps/bff/internal/config/config.go`
- Modify: `apps/bff/internal/config/config_test.go`

- [ ] **Step 1: Write failing test for new config shape**

Update `apps/bff/internal/config/config_test.go` — add a test that verifies the new `RemoteEntry` struct with `URL` and `Version` fields:

```go
func TestRemoteEntryShape(t *testing.T) {
	os.Setenv("REMOTE_ONE_URL", "http://remote-one.example.com/mf-manifest.json")
	os.Setenv("REMOTE_ONE_VERSION", "2.1.0")
	defer func() {
		os.Unsetenv("REMOTE_ONE_URL")
		os.Unsetenv("REMOTE_ONE_VERSION")
	}()

	cfg := config.Load()

	entry := cfg.Remotes["remote_one"]
	if entry.URL != "http://remote-one.example.com/mf-manifest.json" {
		t.Errorf("expected URL from env, got %s", entry.URL)
	}
	if entry.Version != "2.1.0" {
		t.Errorf("expected version 2.1.0, got %s", entry.Version)
	}
}

func TestRemoteEntryDefaultVersion(t *testing.T) {
	os.Unsetenv("REMOTE_ONE_URL")
	os.Unsetenv("REMOTE_ONE_VERSION")

	cfg := config.Load()

	entry := cfg.Remotes["remote_one"]
	if entry.URL != "http://localhost:3001/mf-manifest.json" {
		t.Errorf("expected default URL, got %s", entry.URL)
	}
	if entry.Version != "0.0.0" {
		t.Errorf("expected default version 0.0.0, got %s", entry.Version)
	}
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/bff && go test ./internal/config/ -v`
Expected: Compilation errors — `RemoteEntry` type doesn't exist yet, `Remotes` is `map[string]string` not `map[string]RemoteEntry`.

- [ ] **Step 3: Update config.go with new types**

Replace `apps/bff/internal/config/config.go` with:

```go
package config

import "os"

type RemoteEntry struct {
	URL     string `json:"url"`
	Version string `json:"version"`
}

type Config struct {
	Port         string
	HostDistPath string
	Remotes      map[string]RemoteEntry
}

func Load() Config {
	return Config{
		Port:         envOrDefault("PORT", "8080"),
		HostDistPath: envOrDefault("HOST_DIST_PATH", "../../host/dist"),
		Remotes: map[string]RemoteEntry{
			"remote_one": {
				URL:     envOrDefault("REMOTE_ONE_URL", "http://localhost:3001/mf-manifest.json"),
				Version: envOrDefault("REMOTE_ONE_VERSION", "0.0.0"),
			},
			"remote_two": {
				URL:     envOrDefault("REMOTE_TWO_URL", "http://localhost:3002/mf-manifest.json"),
				Version: envOrDefault("REMOTE_TWO_VERSION", "0.0.0"),
			},
			"remote_vue": {
				URL:     envOrDefault("REMOTE_VUE_URL", "http://localhost:3003/mf-manifest.json"),
				Version: envOrDefault("REMOTE_VUE_VERSION", "0.0.0"),
			},
			"remote_svelte": {
				URL:     envOrDefault("REMOTE_SVELTE_URL", "http://localhost:3004/mf-manifest.json"),
				Version: envOrDefault("REMOTE_SVELTE_VERSION", "0.0.0"),
			},
		},
	}
}

func envOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
```

**Note:** The keys use underscores (`remote_one`) to match Module Federation remote names exactly. The previous config used hyphens (`remote-one`) — this is intentionally changed so `registerRemotes` maps directly without key transformation.

- [ ] **Step 4: Update existing tests to match new shape**

Replace the full content of `apps/bff/internal/config/config_test.go`:

```go
package config_test

import (
	"os"
	"testing"

	"mfe-poc/bff/internal/config"
)

func TestLoadFromEnv(t *testing.T) {
	os.Setenv("REMOTE_ONE_URL", "http://remote-one.example.com/mf-manifest.json")
	os.Setenv("REMOTE_ONE_VERSION", "2.1.0")
	os.Setenv("REMOTE_TWO_URL", "http://remote-two.example.com/mf-manifest.json")
	os.Setenv("REMOTE_TWO_VERSION", "1.4.0")
	os.Setenv("PORT", "9090")
	defer func() {
		os.Unsetenv("REMOTE_ONE_URL")
		os.Unsetenv("REMOTE_ONE_VERSION")
		os.Unsetenv("REMOTE_TWO_URL")
		os.Unsetenv("REMOTE_TWO_VERSION")
		os.Unsetenv("PORT")
	}()

	cfg := config.Load()

	if cfg.Port != "9090" {
		t.Errorf("expected port 9090, got %s", cfg.Port)
	}
	if cfg.Remotes["remote_one"].URL != "http://remote-one.example.com/mf-manifest.json" {
		t.Errorf("unexpected remote_one URL: %s", cfg.Remotes["remote_one"].URL)
	}
	if cfg.Remotes["remote_one"].Version != "2.1.0" {
		t.Errorf("unexpected remote_one version: %s", cfg.Remotes["remote_one"].Version)
	}
	if cfg.Remotes["remote_two"].URL != "http://remote-two.example.com/mf-manifest.json" {
		t.Errorf("unexpected remote_two URL: %s", cfg.Remotes["remote_two"].URL)
	}
	if cfg.Remotes["remote_two"].Version != "1.4.0" {
		t.Errorf("unexpected remote_two version: %s", cfg.Remotes["remote_two"].Version)
	}
}

func TestLoadDefaults(t *testing.T) {
	os.Unsetenv("REMOTE_ONE_URL")
	os.Unsetenv("REMOTE_ONE_VERSION")
	os.Unsetenv("REMOTE_TWO_URL")
	os.Unsetenv("REMOTE_TWO_VERSION")
	os.Unsetenv("PORT")

	cfg := config.Load()

	if cfg.Port != "8080" {
		t.Errorf("expected default port 8080, got %s", cfg.Port)
	}
	if cfg.Remotes["remote_one"].URL != "http://localhost:3001/mf-manifest.json" {
		t.Errorf("unexpected default remote_one URL: %s", cfg.Remotes["remote_one"].URL)
	}
	if cfg.Remotes["remote_one"].Version != "0.0.0" {
		t.Errorf("unexpected default remote_one version: %s", cfg.Remotes["remote_one"].Version)
	}
}

func TestRemoteEntryShape(t *testing.T) {
	os.Setenv("REMOTE_ONE_URL", "http://remote-one.example.com/mf-manifest.json")
	os.Setenv("REMOTE_ONE_VERSION", "2.1.0")
	defer func() {
		os.Unsetenv("REMOTE_ONE_URL")
		os.Unsetenv("REMOTE_ONE_VERSION")
	}()

	cfg := config.Load()

	entry := cfg.Remotes["remote_one"]
	if entry.URL != "http://remote-one.example.com/mf-manifest.json" {
		t.Errorf("expected URL from env, got %s", entry.URL)
	}
	if entry.Version != "2.1.0" {
		t.Errorf("expected version 2.1.0, got %s", entry.Version)
	}
}

func TestRemoteEntryDefaultVersion(t *testing.T) {
	os.Unsetenv("REMOTE_ONE_URL")
	os.Unsetenv("REMOTE_ONE_VERSION")

	cfg := config.Load()

	entry := cfg.Remotes["remote_one"]
	if entry.URL != "http://localhost:3001/mf-manifest.json" {
		t.Errorf("expected default URL, got %s", entry.URL)
	}
	if entry.Version != "0.0.0" {
		t.Errorf("expected default version 0.0.0, got %s", entry.Version)
	}
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd apps/bff && go test ./internal/config/ -v`
Expected: All 4 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/bff/internal/config/config.go apps/bff/internal/config/config_test.go
git commit -m "feat(bff): add version metadata to remote config entries"
```

---

### Task 3: Update BFF main.go to serve new registry shape

**Files:**
- Modify: `apps/bff/main.go`

- [ ] **Step 1: Update the /api/config handler**

The handler currently encodes `cfg.Remotes` directly. Since `Remotes` is now `map[string]RemoteEntry` with JSON tags, the output will automatically be:

```json
{
  "remotes": {
    "remote_one": { "url": "...", "version": "..." },
    ...
  }
}
```

No code change needed in `main.go` — the `json.NewEncoder(w).Encode(map[string]any{"remotes": cfg.Remotes})` already works because `RemoteEntry` has JSON struct tags.

- [ ] **Step 2: Verify by running the BFF and hitting the endpoint**

Run: `cd apps/bff && go run . &` then `curl -s http://localhost:8080/api/config | python3 -m json.tool`

Expected output:
```json
{
    "remotes": {
        "remote_one": {
            "url": "http://localhost:3001/mf-manifest.json",
            "version": "0.0.0"
        },
        "remote_two": {
            "url": "http://localhost:3002/mf-manifest.json",
            "version": "0.0.0"
        },
        "remote_vue": {
            "url": "http://localhost:3003/mf-manifest.json",
            "version": "0.0.0"
        },
        "remote_svelte": {
            "url": "http://localhost:3004/mf-manifest.json",
            "version": "0.0.0"
        }
    }
}
```

Kill the BFF process after verifying.

- [ ] **Step 3: Commit (if any changes were needed)**

If the output matches, no commit needed for this task — the struct tags from Task 2 handle it. If adjustments were made, commit them.

---

### Task 4: Update host rsbuild.config.ts for dev-only remotes

**Files:**
- Modify: `apps/host/rsbuild.config.ts`

- [ ] **Step 1: Make remotes dev-only**

Replace `apps/host/rsbuild.config.ts` with:

```ts
import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginModuleFederation } from "@module-federation/rsbuild-plugin";

const isDev = process.env.NODE_ENV === "development";

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginModuleFederation({
      name: "host",
      remotes: isDev
        ? {
            remote_one: "remote_one@http://localhost:3001/mf-manifest.json",
            remote_two: "remote_two@http://localhost:3002/mf-manifest.json",
            remote_vue: "remote_vue@http://localhost:3003/mf-manifest.json",
            remote_svelte: "remote_svelte@http://localhost:3004/mf-manifest.json",
          }
        : {},
      shared: {
        react: { singleton: true, requiredVersion: "^19.2.6" },
        "react-dom": { singleton: true, requiredVersion: "^19.2.6" },
        "react-router-dom": { singleton: true, requiredVersion: "^7.15.1" },
      },
      shareStrategy: "version-first",
    }),
  ],
  server: {
    port: 3000,
    historyApiFallback: true,
  },
  html: {
    template: "./public/index.html",
  },
  output: {
    assetPrefix: "auto",
  },
});
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd apps/host && npx rsbuild build`
Expected: Build succeeds (remotes are empty object in production mode, which is valid).

- [ ] **Step 3: Commit**

```bash
git add apps/host/rsbuild.config.ts
git commit -m "feat(host): make MF remotes dev-only, production uses runtime discovery"
```

---

### Task 5: Update host bootstrap.tsx for runtime discovery

**Files:**
- Modify: `apps/host/src/bootstrap.tsx`

- [ ] **Step 1: Replace bootstrap.tsx with runtime discovery logic**

Replace `apps/host/src/bootstrap.tsx` with:

```tsx
import { registerRemotes } from "@module-federation/runtime";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

interface RemoteEntry {
  url: string;
  version: string;
}

interface ConfigResponse {
  remotes: Record<string, RemoteEntry>;
}

async function fetchConfig(): Promise<ConfigResponse> {
  const res = await fetch("/api/config");
  if (!res.ok) {
    throw new Error(`Failed to fetch config: ${res.status}`);
  }
  return res.json();
}

async function bootstrap() {
  const isDev = process.env.NODE_ENV === "development";

  if (!isDev) {
    const config = await fetchConfig();
    registerRemotes(
      Object.entries(config.remotes).map(([name, entry]) => ({
        name,
        entry: entry.url,
      }))
    );
  }

  const root = createRoot(document.getElementById("root")!);
  root.render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

bootstrap().catch((err) => {
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `<div style="padding: 2rem; color: red;">
      <h1>Failed to load application</h1>
      <p>${err.message}</p>
    </div>`;
  }
});
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd apps/host && pnpm lint`
Expected: No type errors.

- [ ] **Step 3: Verify dev mode still works**

Run: `pnpm dev` (from repo root)
Expected: Host starts on port 3000. In dev mode, the `isDev` check skips the fetch — remotes are resolved from build-time config as before.

- [ ] **Step 4: Verify production build succeeds**

Run: `cd apps/host && npx rsbuild build`
Expected: Build succeeds without errors.

- [ ] **Step 5: Commit**

```bash
git add apps/host/src/bootstrap.tsx
git commit -m "feat(host): fetch remote URLs from BFF registry at runtime"
```

---

### Task 6: End-to-end verification with pnpm serve

- [ ] **Step 1: Build all apps and run BFF**

Run: `pnpm serve` (from repo root)
Expected: All frontend apps build, BFF starts on port 8080.

- [ ] **Step 2: Verify /api/config returns new shape**

Run: `curl -s http://localhost:8080/api/config | python3 -m json.tool`
Expected: JSON with `remotes` containing objects with `url` and `version` fields.

- [ ] **Step 3: Verify host loads and can reach remotes**

Open `http://localhost:8080` in a browser.
Expected:
- Host shell renders (navbar, sidebar)
- Clicking "Remote One" loads the remote app at `/one`
- Clicking "Remote Two" loads the remote app at `/two`
- Vue and Svelte remotes also load

- [ ] **Step 4: Verify dev mode still works independently**

Run: `pnpm dev` (from repo root)
Expected: All apps start on their dev ports. Host at `http://localhost:3000` loads remotes directly from localhost ports (no BFF involved).

- [ ] **Step 5: Run all Go tests**

Run: `cd apps/bff && go test ./...`
Expected: All tests pass.

- [ ] **Step 6: Run host TypeScript check**

Run: `pnpm lint` (from repo root)
Expected: No type errors across all apps.

- [ ] **Step 7: Final commit (if any cleanup needed)**

If everything passes without additional changes, no commit needed. Otherwise commit any fixes.
