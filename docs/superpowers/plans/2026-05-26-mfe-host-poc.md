# MFE Host POC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove a micro-frontend architecture where a host shell dynamically loads independently deployed remote apps at runtime via Module Federation 2.0.

**Architecture:** Monorepo with pnpm workspaces + Turborepo. Host app discovers remotes at runtime by fetching their manifest URLs from a Go BFF. Each remote owns its own routing and runs independently in dev.

**Tech Stack:** Rspack, @module-federation/enhanced, React 18, React Router 6, Go 1.22+, pnpm, Turborepo

---

## File Map

```
mfe-poc/
├── .gitignore
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
├── apps/
│   ├── host/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── rspack.config.ts
│   │   ├── public/index.html
│   │   └── src/
│   │       ├── index.ts
│   │       ├── bootstrap.tsx
│   │       ├── App.tsx
│   │       └── loadRemote.ts
│   ├── remote-one/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── rspack.config.ts
│   │   ├── public/index.html
│   │   └── src/
│   │       ├── index.ts
│   │       ├── bootstrap.tsx
│   │       ├── App.tsx
│   │       └── pages/
│   │           ├── Dashboard.tsx
│   │           └── Settings.tsx
│   ├── remote-two/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── rspack.config.ts
│   │   ├── public/index.html
│   │   └── src/
│   │       ├── index.ts
│   │       ├── bootstrap.tsx
│   │       ├── App.tsx
│   │       └── pages/
│   │           ├── Overview.tsx
│   │           └── Details.tsx
│   └── bff/
│       ├── go.mod
│       ├── main.go
│       ├── main_test.go
│       └── internal/
│           ├── config/
│           │   ├── config.go
│           │   └── config_test.go
│           ├── proxy/
│           │   ├── proxy.go
│           │   └── proxy_test.go
│           └── static/
│               ├── static.go
│               └── static_test.go
└── packages/
    └── .gitkeep
```

---

### Task 1: Initialize Monorepo

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `package.json`
- Create: `.gitignore`
- Create: `packages/.gitkeep`

- [ ] **Step 1: Initialize git repo**

```bash
cd /Users/kmye/codes/mfe-poc
git init
```

- [ ] **Step 2: Create root package.json**

```json
{
  "name": "mfe-poc",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "serve": "turbo run build && cd apps/bff && go run ."
  },
  "devDependencies": {
    "turbo": "^2"
  },
  "packageManager": "pnpm@9.15.4"
}
```

- [ ] **Step 3: Create pnpm-workspace.yaml**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 4: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {}
  }
}
```

- [ ] **Step 5: Create .gitignore**

```
node_modules/
dist/
.turbo/
*.local
```

- [ ] **Step 6: Create packages/.gitkeep**

Empty file — placeholder for future shared packages.

- [ ] **Step 7: Install dependencies**

```bash
pnpm install
```

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "chore: initialize monorepo with pnpm workspaces and turborepo"
```

---

### Task 2: Set Up Remote One (MF Remote)

Build a remote first so the host has something to consume. Each remote is a standalone React app that exposes its root `App` component via Module Federation.

**Files:**
- Create: `apps/remote-one/package.json`
- Create: `apps/remote-one/tsconfig.json`
- Create: `apps/remote-one/rspack.config.ts`
- Create: `apps/remote-one/public/index.html`
- Create: `apps/remote-one/src/index.ts`
- Create: `apps/remote-one/src/bootstrap.tsx`
- Create: `apps/remote-one/src/App.tsx`
- Create: `apps/remote-one/src/pages/Dashboard.tsx`
- Create: `apps/remote-one/src/pages/Settings.tsx`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "remote-one",
  "private": true,
  "version": "0.0.0",
  "scripts": {
    "dev": "rspack serve",
    "build": "rspack build",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0"
  },
  "devDependencies": {
    "@module-federation/enhanced": "^0.8.0",
    "@rspack/cli": "^1.1.0",
    "@rspack/core": "^1.1.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "outDir": "./dist",
    "baseUrl": "."
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create rspack.config.ts**

```typescript
import { defineConfig } from "@rspack/cli";
import { ModuleFederationPlugin } from "@module-federation/enhanced/rspack";

export default defineConfig({
  entry: "./src/index.ts",
  output: {
    publicPath: "auto",
    clean: true,
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".jsx"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: "builtin:swc-loader",
          options: {
            jsc: {
              parser: { syntax: "typescript", tsx: true },
              transform: { react: { runtime: "automatic" } },
            },
          },
        },
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: "remote_one",
      filename: "remoteEntry.js",
      exposes: {
        "./App": "./src/App.tsx",
      },
      shared: {
        react: { singleton: true, requiredVersion: "^18.3.1" },
        "react-dom": { singleton: true, requiredVersion: "^18.3.1" },
        "react-router-dom": { singleton: true, requiredVersion: "^6.28.0" },
      },
    }),
  ],
  devServer: {
    port: 3001,
    headers: { "Access-Control-Allow-Origin": "*" },
    historyApiFallback: true,
  },
  devtool: false,
});
```

- [ ] **Step 4: Create public/index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Remote One</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>
```

- [ ] **Step 5: Create src/index.ts**

```typescript
import("./bootstrap");
```

- [ ] **Step 6: Create src/bootstrap.tsx**

```tsx
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

const root = createRoot(document.getElementById("root")!);
root.render(
  <BrowserRouter basename="/one">
    <App />
  </BrowserRouter>
);
```

- [ ] **Step 7: Create src/App.tsx**

```tsx
import { Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <div>
      <nav>
        <Link to="/">Dashboard</Link> | <Link to="/settings">Settings</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </div>
  );
}
```

- [ ] **Step 8: Create src/pages/Dashboard.tsx**

```tsx
export default function Dashboard() {
  return <h2>Remote One — Dashboard</h2>;
}
```

- [ ] **Step 9: Create src/pages/Settings.tsx**

```tsx
export default function Settings() {
  return <h2>Remote One — Settings</h2>;
}
```

- [ ] **Step 10: Install dependencies and verify dev server starts**

```bash
cd apps/remote-one && pnpm install
pnpm dev
```

Expected: Dev server starts on `http://localhost:3001`, page renders "Remote One — Dashboard".

- [ ] **Step 11: Verify build produces mf-manifest.json**

```bash
pnpm build
ls dist/
```

Expected: `dist/` contains `remoteEntry.js` and `mf-manifest.json`.

- [ ] **Step 12: Commit**

```bash
git add .
git commit -m "feat: add remote-one app with module federation config"
```

---

### Task 3: Set Up Remote Two (MF Remote)

Same pattern as remote-one with different content.

**Files:**
- Create: `apps/remote-two/package.json`
- Create: `apps/remote-two/tsconfig.json`
- Create: `apps/remote-two/rspack.config.ts`
- Create: `apps/remote-two/public/index.html`
- Create: `apps/remote-two/src/index.ts`
- Create: `apps/remote-two/src/bootstrap.tsx`
- Create: `apps/remote-two/src/App.tsx`
- Create: `apps/remote-two/src/pages/Overview.tsx`
- Create: `apps/remote-two/src/pages/Details.tsx`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "remote-two",
  "private": true,
  "version": "0.0.0",
  "scripts": {
    "dev": "rspack serve",
    "build": "rspack build",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0"
  },
  "devDependencies": {
    "@module-federation/enhanced": "^0.8.0",
    "@rspack/cli": "^1.1.0",
    "@rspack/core": "^1.1.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "outDir": "./dist",
    "baseUrl": "."
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create rspack.config.ts**

```typescript
import { defineConfig } from "@rspack/cli";
import { ModuleFederationPlugin } from "@module-federation/enhanced/rspack";

export default defineConfig({
  entry: "./src/index.ts",
  output: {
    publicPath: "auto",
    clean: true,
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".jsx"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: "builtin:swc-loader",
          options: {
            jsc: {
              parser: { syntax: "typescript", tsx: true },
              transform: { react: { runtime: "automatic" } },
            },
          },
        },
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: "remote_two",
      filename: "remoteEntry.js",
      exposes: {
        "./App": "./src/App.tsx",
      },
      shared: {
        react: { singleton: true, requiredVersion: "^18.3.1" },
        "react-dom": { singleton: true, requiredVersion: "^18.3.1" },
        "react-router-dom": { singleton: true, requiredVersion: "^6.28.0" },
      },
    }),
  ],
  devServer: {
    port: 3002,
    headers: { "Access-Control-Allow-Origin": "*" },
    historyApiFallback: true,
  },
  devtool: false,
});
```

- [ ] **Step 4: Create public/index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Remote Two</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>
```

- [ ] **Step 5: Create src/index.ts**

```typescript
import("./bootstrap");
```

- [ ] **Step 6: Create src/bootstrap.tsx**

```tsx
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

const root = createRoot(document.getElementById("root")!);
root.render(
  <BrowserRouter basename="/two">
    <App />
  </BrowserRouter>
);
```

- [ ] **Step 7: Create src/App.tsx**

```tsx
import { Routes, Route, Link } from "react-router-dom";
import Overview from "./pages/Overview";
import Details from "./pages/Details";

export default function App() {
  return (
    <div>
      <nav>
        <Link to="/">Overview</Link> | <Link to="/details">Details</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/details" element={<Details />} />
      </Routes>
    </div>
  );
}
```

- [ ] **Step 8: Create src/pages/Overview.tsx**

```tsx
export default function Overview() {
  return <h2>Remote Two — Overview</h2>;
}
```

- [ ] **Step 9: Create src/pages/Details.tsx**

```tsx
export default function Details() {
  return <h2>Remote Two — Details</h2>;
}
```

- [ ] **Step 10: Install dependencies and verify dev server starts**

```bash
cd apps/remote-two && pnpm install
pnpm dev
```

Expected: Dev server starts on `http://localhost:3002`, page renders "Remote Two — Overview".

- [ ] **Step 11: Verify build produces mf-manifest.json**

```bash
pnpm build
ls dist/
```

Expected: `dist/` contains `remoteEntry.js` and `mf-manifest.json`.

- [ ] **Step 12: Commit**

```bash
git add .
git commit -m "feat: add remote-two app with module federation config"
```

---

### Task 4: Set Up Host App (MF Consumer)

The host discovers remotes at runtime by fetching config, then dynamically loads them.

**Files:**
- Create: `apps/host/package.json`
- Create: `apps/host/tsconfig.json`
- Create: `apps/host/rspack.config.ts`
- Create: `apps/host/public/index.html`
- Create: `apps/host/src/index.ts`
- Create: `apps/host/src/bootstrap.tsx`
- Create: `apps/host/src/App.tsx`
- Create: `apps/host/src/loadRemote.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "host",
  "private": true,
  "version": "0.0.0",
  "scripts": {
    "dev": "rspack serve",
    "build": "rspack build",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0"
  },
  "devDependencies": {
    "@module-federation/enhanced": "^0.8.0",
    "@module-federation/runtime": "^0.8.0",
    "@rspack/cli": "^1.1.0",
    "@rspack/core": "^1.1.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "outDir": "./dist",
    "baseUrl": "."
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create rspack.config.ts**

```typescript
import { defineConfig } from "@rspack/cli";
import { ModuleFederationPlugin } from "@module-federation/enhanced/rspack";

export default defineConfig({
  entry: "./src/index.ts",
  output: {
    publicPath: "auto",
    clean: true,
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".jsx"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: "builtin:swc-loader",
          options: {
            jsc: {
              parser: { syntax: "typescript", tsx: true },
              transform: { react: { runtime: "automatic" } },
            },
          },
        },
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: "host",
      remotes: {
        remote_one: "remote_one@http://localhost:3001/mf-manifest.json",
        remote_two: "remote_two@http://localhost:3002/mf-manifest.json",
      },
      shared: {
        react: { singleton: true, requiredVersion: "^18.3.1" },
        "react-dom": { singleton: true, requiredVersion: "^18.3.1" },
        "react-router-dom": { singleton: true, requiredVersion: "^6.28.0" },
      },
    }),
  ],
  devServer: {
    port: 3000,
    historyApiFallback: true,
  },
  devtool: false,
});
```

Note: The `remotes` URLs here are dev defaults. In production, the host will use runtime discovery via the BFF's `/api/config` endpoint (see `loadRemote.ts` below). The static config is kept for simple `pnpm dev` workflow.

- [ ] **Step 4: Create public/index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MFE Host</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>
```

- [ ] **Step 5: Create src/index.ts**

```typescript
import("./bootstrap");
```

- [ ] **Step 6: Create src/loadRemote.ts**

This lazily loads a remote's exposed module and wraps it in a React lazy component.

```typescript
import { lazy } from "react";
import { loadRemote as mfLoadRemote } from "@module-federation/enhanced/runtime";

export function createRemoteComponent(remoteName: string, exposedModule: string) {
  return lazy(async () => {
    const module = await mfLoadRemote(`${remoteName}/${exposedModule}`);
    return { default: (module as any).default };
  });
}
```

- [ ] **Step 7: Create src/App.tsx**

```tsx
import { Suspense } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { createRemoteComponent } from "./loadRemote";

const RemoteOneApp = createRemoteComponent("remote_one", "App");
const RemoteTwoApp = createRemoteComponent("remote_two", "App");

export default function App() {
  return (
    <div>
      <h1>MFE Host</h1>
      <nav>
        <Link to="/one">Remote One</Link> | <Link to="/two">Remote Two</Link>
      </nav>
      <hr />
      <Suspense fallback={<p>Loading...</p>}>
        <Routes>
          <Route path="/" element={<p>Select a remote app above.</p>} />
          <Route path="/one/*" element={<RemoteOneApp />} />
          <Route path="/two/*" element={<RemoteTwoApp />} />
        </Routes>
      </Suspense>
    </div>
  );
}
```

- [ ] **Step 8: Create src/bootstrap.tsx**

```tsx
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

const root = createRoot(document.getElementById("root")!);
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
```

- [ ] **Step 9: Install dependencies**

```bash
cd apps/host && pnpm install
```

- [ ] **Step 10: Verify host + remotes work together**

Start all three dev servers (from repo root):

```bash
pnpm dev
```

Expected:
- Open `http://localhost:3000` — see "MFE Host" with nav links
- Click "Remote One" → navigates to `/one`, loads remote-one's Dashboard page
- Click "Remote Two" → navigates to `/two`, loads remote-two's Overview page
- Remote internal navigation works (e.g., `/one/settings`)

- [ ] **Step 11: Commit**

```bash
git add .
git commit -m "feat: add host app with module federation consumer config"
```

---

### Task 5: Set Up Go BFF

**Files:**
- Create: `apps/bff/go.mod`
- Create: `apps/bff/main.go`
- Create: `apps/bff/main_test.go`
- Create: `apps/bff/internal/config/config.go`
- Create: `apps/bff/internal/config/config_test.go`
- Create: `apps/bff/internal/proxy/proxy.go`
- Create: `apps/bff/internal/proxy/proxy_test.go`
- Create: `apps/bff/internal/static/static.go`
- Create: `apps/bff/internal/static/static_test.go`

- [ ] **Step 1: Initialize Go module**

```bash
cd apps/bff
go mod init mfe-poc/bff
```

- [ ] **Step 2: Write config test**

Create `apps/bff/internal/config/config_test.go`:

```go
package config_test

import (
	"os"
	"testing"

	"mfe-poc/bff/internal/config"
)

func TestLoadFromEnv(t *testing.T) {
	os.Setenv("REMOTE_ONE_URL", "http://remote-one.example.com/mf-manifest.json")
	os.Setenv("REMOTE_TWO_URL", "http://remote-two.example.com/mf-manifest.json")
	os.Setenv("PORT", "9090")
	defer func() {
		os.Unsetenv("REMOTE_ONE_URL")
		os.Unsetenv("REMOTE_TWO_URL")
		os.Unsetenv("PORT")
	}()

	cfg := config.Load()

	if cfg.Port != "9090" {
		t.Errorf("expected port 9090, got %s", cfg.Port)
	}
	if cfg.Remotes["remote-one"] != "http://remote-one.example.com/mf-manifest.json" {
		t.Errorf("unexpected remote-one URL: %s", cfg.Remotes["remote-one"])
	}
	if cfg.Remotes["remote-two"] != "http://remote-two.example.com/mf-manifest.json" {
		t.Errorf("unexpected remote-two URL: %s", cfg.Remotes["remote-two"])
	}
}

func TestLoadDefaults(t *testing.T) {
	os.Unsetenv("REMOTE_ONE_URL")
	os.Unsetenv("REMOTE_TWO_URL")
	os.Unsetenv("PORT")

	cfg := config.Load()

	if cfg.Port != "8080" {
		t.Errorf("expected default port 8080, got %s", cfg.Port)
	}
	if cfg.Remotes["remote-one"] != "http://localhost:3001/mf-manifest.json" {
		t.Errorf("unexpected default remote-one URL: %s", cfg.Remotes["remote-one"])
	}
}
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd apps/bff && go test ./internal/config/...
```

Expected: FAIL — package does not exist.

- [ ] **Step 4: Implement config package**

Create `apps/bff/internal/config/config.go`:

```go
package config

import "os"

type Config struct {
	Port         string
	HostDistPath string
	Remotes      map[string]string
}

func Load() Config {
	return Config{
		Port:         envOrDefault("PORT", "8080"),
		HostDistPath: envOrDefault("HOST_DIST_PATH", "../../host/dist"),
		Remotes: map[string]string{
			"remote-one": envOrDefault("REMOTE_ONE_URL", "http://localhost:3001/mf-manifest.json"),
			"remote-two": envOrDefault("REMOTE_TWO_URL", "http://localhost:3002/mf-manifest.json"),
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

- [ ] **Step 5: Run config tests**

```bash
cd apps/bff && go test ./internal/config/...
```

Expected: PASS.

- [ ] **Step 6: Write proxy test**

Create `apps/bff/internal/proxy/proxy_test.go`:

```go
package proxy_test

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"mfe-poc/bff/internal/proxy"
)

func TestProxyForwards(t *testing.T) {
	backend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	}))
	defer backend.Close()

	handler := proxy.New(backend.URL)
	req := httptest.NewRequest("GET", "/api/proxy/test", nil)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
	body, _ := io.ReadAll(rec.Body)
	if string(body) != `{"status":"ok"}` {
		t.Errorf("unexpected body: %s", string(body))
	}
}
```

- [ ] **Step 7: Run proxy test to verify it fails**

```bash
cd apps/bff && go test ./internal/proxy/...
```

Expected: FAIL — package does not exist.

- [ ] **Step 8: Implement proxy package**

Create `apps/bff/internal/proxy/proxy.go`:

```go
package proxy

import (
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
)

func New(targetURL string) http.Handler {
	target, _ := url.Parse(targetURL)
	rp := httputil.NewSingleHostReverseProxy(target)

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		r.URL.Path = strings.TrimPrefix(r.URL.Path, "/api/proxy")
		if r.URL.Path == "" {
			r.URL.Path = "/"
		}
		rp.ServeHTTP(w, r)
	})
}
```

- [ ] **Step 9: Run proxy tests**

```bash
cd apps/bff && go test ./internal/proxy/...
```

Expected: PASS.

- [ ] **Step 10: Write static handler test**

Create `apps/bff/internal/static/static_test.go`:

```go
package static_test

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"mfe-poc/bff/internal/static"
)

func TestServesIndexHTML(t *testing.T) {
	dir := t.TempDir()
	os.WriteFile(filepath.Join(dir, "index.html"), []byte("<html>host</html>"), 0644)

	handler := static.New(dir)
	req := httptest.NewRequest("GET", "/", nil)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
}

func TestSPAFallback(t *testing.T) {
	dir := t.TempDir()
	os.WriteFile(filepath.Join(dir, "index.html"), []byte("<html>spa</html>"), 0644)

	handler := static.New(dir)
	req := httptest.NewRequest("GET", "/one/dashboard", nil)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200 for SPA route, got %d", rec.Code)
	}
}
```

- [ ] **Step 11: Run static test to verify it fails**

```bash
cd apps/bff && go test ./internal/static/...
```

Expected: FAIL — package does not exist.

- [ ] **Step 12: Implement static handler**

Create `apps/bff/internal/static/static.go`:

```go
package static

import (
	"net/http"
	"os"
	"path/filepath"
)

func New(distPath string) http.Handler {
	fs := http.FileServer(http.Dir(distPath))

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := filepath.Join(distPath, r.URL.Path)
		if _, err := os.Stat(path); os.IsNotExist(err) {
			http.ServeFile(w, r, filepath.Join(distPath, "index.html"))
			return
		}
		fs.ServeHTTP(w, r)
	})
}
```

- [ ] **Step 13: Run static tests**

```bash
cd apps/bff && go test ./internal/static/...
```

Expected: PASS.

- [ ] **Step 14: Write main.go**

Create `apps/bff/main.go`:

```go
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"mfe-poc/bff/internal/config"
	"mfe-poc/bff/internal/proxy"
	"mfe-poc/bff/internal/static"
)

func main() {
	cfg := config.Load()

	mux := http.NewServeMux()

	mux.HandleFunc("GET /api/config", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"remotes": cfg.Remotes,
		})
	})

	mux.Handle("/api/proxy/", proxy.New("http://localhost:9999"))

	mux.Handle("/", static.New(cfg.HostDistPath))

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("BFF listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, mux))
}
```

- [ ] **Step 15: Write main integration test**

Create `apps/bff/main_test.go`:

```go
package main_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"mfe-poc/bff/internal/config"
)

func TestConfigEndpoint(t *testing.T) {
	os.Setenv("REMOTE_ONE_URL", "http://one.test/mf-manifest.json")
	os.Setenv("REMOTE_TWO_URL", "http://two.test/mf-manifest.json")
	defer func() {
		os.Unsetenv("REMOTE_ONE_URL")
		os.Unsetenv("REMOTE_TWO_URL")
	}()

	cfg := config.Load()

	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"remotes": cfg.Remotes,
		})
	})

	req := httptest.NewRequest("GET", "/api/config", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	var resp struct {
		Remotes map[string]string `json:"remotes"`
	}
	json.NewDecoder(rec.Body).Decode(&resp)

	if resp.Remotes["remote-one"] != "http://one.test/mf-manifest.json" {
		t.Errorf("unexpected remote-one: %s", resp.Remotes["remote-one"])
	}
}
```

- [ ] **Step 16: Run all BFF tests**

```bash
cd apps/bff && go test ./...
```

Expected: All tests PASS.

- [ ] **Step 17: Commit**

```bash
git add .
git commit -m "feat: add Go BFF with config, proxy, and static handlers"
```

---

### Task 6: Integration — Full Stack Verification

Verify the entire system works end-to-end: build all apps, start the BFF, and confirm remotes load dynamically.

**Files:**
- None created — this is a verification task

- [ ] **Step 1: Build all frontend apps from root**

```bash
cd /Users/kmye/codes/mfe-poc
pnpm build
```

Expected: All three apps build successfully, each producing a `dist/` folder.

- [ ] **Step 2: Start BFF pointing to built assets**

```bash
cd apps/bff
HOST_DIST_PATH=../host/dist \
REMOTE_ONE_URL=http://localhost:3001/mf-manifest.json \
REMOTE_TWO_URL=http://localhost:3002/mf-manifest.json \
go run .
```

- [ ] **Step 3: Serve remote assets for integration test**

In separate terminals, serve each remote's dist:

```bash
cd apps/remote-one && npx serve dist -l 3001 --cors
cd apps/remote-two && npx serve dist -l 3002 --cors
```

- [ ] **Step 4: Verify end-to-end**

Open `http://localhost:8080`:
- Host shell loads from BFF
- Navigate to `/one` → remote-one loads, Dashboard renders
- Navigate to `/two` → remote-two loads, Overview renders
- Sub-navigation works within each remote

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "chore: verify full-stack integration works end-to-end"
```

---

## Summary

| Task | What it proves |
|------|---------------|
| 1 | Monorepo tooling works (pnpm + turbo) |
| 2-3 | Remotes build independently, expose MF modules |
| 4 | Host consumes remotes at runtime via MF 2.0 |
| 5 | Go BFF serves assets and config |
| 6 | Full stack integration — the architecture works |
