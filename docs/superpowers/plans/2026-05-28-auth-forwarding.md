# Auth Forwarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pass user identity data (name, email) from the host shell to all federated remotes (React, Vue, Svelte) at mount time.

**Architecture:** A shared types package defines the `PlatformUser` interface. The host holds user state and passes it as props (React) or mount options (Vue/Svelte). Remotes accept the data optionally and display it when available.

**Tech Stack:** TypeScript, React 19, Vue 3, Svelte 5, pnpm workspaces, Module Federation 2.0

---

## File Structure

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `packages/platform-types/package.json` | Package metadata |
| Create | `packages/platform-types/tsconfig.json` | TypeScript config |
| Create | `packages/platform-types/src/index.ts` | `PlatformUser` interface export |
| Modify | `apps/host/package.json` | Add `@mfe-poc/platform-types` dependency |
| Modify | `apps/host/src/App.tsx` | Add user state, pass to remotes |
| Modify | `apps/host/src/VueWrapper.tsx` | Accept and forward `user` prop |
| Modify | `apps/host/src/SvelteWrapper.tsx` | Accept and forward `user` prop |
| Modify | `apps/remote-one/package.json` | Add `@mfe-poc/platform-types` dependency |
| Modify | `apps/remote-one/src/App.tsx` | Accept `user` prop, display in Layout |
| Modify | `apps/remote-two/package.json` | Add `@mfe-poc/platform-types` dependency |
| Modify | `apps/remote-two/src/App.tsx` | Accept `user` prop, display in Layout |
| Modify | `apps/remote-vue/src/bootstrap.ts` | Accept `user` in mount options |
| Modify | `apps/remote-vue/src/App.vue` | Display user data from prop |
| Modify | `apps/remote-svelte/src/bootstrap.ts` | Accept `user` in mount options |
| Modify | `apps/remote-svelte/src/App.svelte` | Display user data from prop |

---

### Task 1: Create the shared types package

**Files:**
- Create: `packages/platform-types/package.json`
- Create: `packages/platform-types/tsconfig.json`
- Create: `packages/platform-types/src/index.ts`

- [ ] **Step 1: Create package.json**

Create `packages/platform-types/package.json`:

```json
{
  "name": "@mfe-poc/platform-types",
  "private": true,
  "version": "0.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "files": ["src"]
}
```

- [ ] **Step 2: Create tsconfig.json**

Create `packages/platform-types/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "./dist"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create the PlatformUser interface**

Create `packages/platform-types/src/index.ts`:

```typescript
export interface PlatformUser {
  name: string;
  email: string;
}
```

- [ ] **Step 4: Install workspace dependencies**

Run: `pnpm install`

This registers the new package in the pnpm workspace. Verify it's recognized:

Run: `pnpm ls --filter @mfe-poc/platform-types`

Expected: Package listed with version 0.0.0

- [ ] **Step 5: Commit**

```bash
git add packages/platform-types/
git commit -m "feat: add @mfe-poc/platform-types shared package with PlatformUser interface"
```

---

### Task 2: Wire the host to pass user data to React remotes

**Files:**
- Modify: `apps/host/package.json`
- Modify: `apps/host/src/App.tsx`

- [ ] **Step 1: Add platform-types dependency to host**

Add to `apps/host/package.json` dependencies:

```json
"@mfe-poc/platform-types": "workspace:*"
```

Run: `pnpm install`

- [ ] **Step 2: Add user state and pass to React remotes**

Modify `apps/host/src/App.tsx`:

```typescript
import { Suspense, useState } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import { createRemoteComponent } from "./loadRemote";
import VueWrapper from "./VueWrapper";
import SvelteWrapper from "./SvelteWrapper";
import type { PlatformUser } from "@mfe-poc/platform-types";

const RemoteOneApp = createRemoteComponent("remote_one", "App");
const RemoteTwoApp = createRemoteComponent("remote_two", "App");

const navItems = [
  { to: "/one", label: "Remote One" },
  { to: "/two", label: "Remote Two" },
  { to: "/vue", label: "Remote Vue" },
  { to: "/svelte", label: "Remote Svelte" },
];

// Hardcoded mock user for development — replace with real IdP integration
const mockUser: PlatformUser = {
  name: "Jane Developer",
  email: "jane@example.com",
};

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user] = useState<PlatformUser>(mockUser);

  return (
    <div className="flex h-screen flex-col">
      {/* Navbar */}
      <header className="flex h-14 items-center border-b border-gray-200 bg-white px-4 shadow-sm">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="mr-4 rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          aria-label="Toggle sidebar"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-gray-900">MFE Host</h1>
        <span className="ml-auto text-sm text-gray-500">{user.name}</span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "w-56" : "w-0"
          } flex-shrink-0 overflow-hidden border-r border-gray-200 bg-gray-50 transition-all duration-200`}
        >
          <nav className="flex flex-col gap-1 p-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <p className="text-gray-500">Loading...</p>
              </div>
            }
          >
            <Routes>
              <Route
                path="/"
                element={
                  <div className="flex items-center justify-center py-12">
                    <p className="text-gray-500">
                      Select a remote app from the sidebar.
                    </p>
                  </div>
                }
              />
              <Route path="/one/*" element={<RemoteOneApp user={user} />} />
              <Route path="/two/*" element={<RemoteTwoApp user={user} />} />
              <Route path="/vue/*" element={<VueWrapper user={user} />} />
              <Route path="/svelte/*" element={<SvelteWrapper user={user} />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify type check passes**

Run: `pnpm --filter host lint`

Expected: No errors (React remotes accept any props via `lazy` — the type contract is enforced on the remote side)

- [ ] **Step 4: Commit**

```bash
git add apps/host/
git commit -m "feat(host): add user state and pass to all remote mount points"
```

---

### Task 3: Update React remotes to accept and display user

**Files:**
- Modify: `apps/remote-one/package.json`
- Modify: `apps/remote-one/src/App.tsx`
- Modify: `apps/remote-two/package.json`
- Modify: `apps/remote-two/src/App.tsx`

- [ ] **Step 1: Add platform-types dependency to both remotes**

Add to `apps/remote-one/package.json` and `apps/remote-two/package.json` dependencies:

```json
"@mfe-poc/platform-types": "workspace:*"
```

Run: `pnpm install`

- [ ] **Step 2: Update remote-one App to accept user prop**

Modify `apps/remote-one/src/App.tsx`:

```typescript
import { Routes, Route, Link, Outlet } from "react-router-dom";
import type { PlatformUser } from "@mfe-poc/platform-types";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";

interface AppProps {
  user?: PlatformUser;
}

function Layout({ user }: { user?: PlatformUser }) {
  return (
    <div>
      <nav>
        <Link to=".">Dashboard</Link> | <Link to="settings">Settings</Link>
        {user && <span style={{ float: "right" }}>{user.name} ({user.email})</span>}
      </nav>
      <Outlet />
    </div>
  );
}

export default function App({ user }: AppProps) {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Layout user={user} />}>
          <Route index element={<Dashboard />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </div>
  );
}
```

- [ ] **Step 3: Update remote-two App to accept user prop**

Modify `apps/remote-two/src/App.tsx`:

```typescript
import { Routes, Route, Link, Outlet } from "react-router-dom";
import type { PlatformUser } from "@mfe-poc/platform-types";
import Overview from "./pages/Overview";
import Details from "./pages/Details";

interface AppProps {
  user?: PlatformUser;
}

function Layout({ user }: { user?: PlatformUser }) {
  return (
    <div>
      <nav>
        <Link to=".">Overview</Link> | <Link to="details">Details</Link>
        {user && <span style={{ float: "right" }}>{user.name} ({user.email})</span>}
      </nav>
      <Outlet />
    </div>
  );
}

export default function App({ user }: AppProps) {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Layout user={user} />}>
          <Route index element={<Overview />} />
          <Route path="details" element={<Details />} />
        </Route>
      </Routes>
    </div>
  );
}
```

- [ ] **Step 4: Verify type check passes for both remotes**

Run: `pnpm --filter remote-one lint && pnpm --filter remote-two lint`

Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add apps/remote-one/ apps/remote-two/
git commit -m "feat(remote-one,remote-two): accept and display PlatformUser prop"
```

---

### Task 4: Update Vue remote to accept and display user

**Files:**
- Modify: `apps/remote-vue/src/bootstrap.ts`
- Modify: `apps/remote-vue/src/App.vue`

- [ ] **Step 1: Extend Vue mount options to accept user**

Modify `apps/remote-vue/src/bootstrap.ts`:

```typescript
import { createApp, type App as VueApp } from "vue";
import App from "./App.vue";
import { createAppRouter } from "./router";

export interface PlatformUser {
  name: string;
  email: string;
}

let app: VueApp | null = null;

export function mount(el: HTMLElement, opts?: { basePath?: string; user?: PlatformUser }) {
  app = createApp(App, { user: opts?.user });
  const router = createAppRouter(opts?.basePath ?? "/");
  app.use(router);
  app.mount(el);
}

export function unmount() {
  if (app) {
    app.unmount();
    app = null;
  }
}
```

- [ ] **Step 2: Display user in Vue App component**

Modify `apps/remote-vue/src/App.vue`:

```vue
<script setup lang="ts">
defineProps<{
  user?: { name: string; email: string };
}>();
</script>

<template>
  <div>
    <nav>
      <router-link to="/">Home</router-link> |
      <router-link to="/about">About</router-link>
      <span v-if="user" style="float: right">{{ user.name }} ({{ user.email }})</span>
    </nav>
    <router-view />
  </div>
</template>
```

- [ ] **Step 3: Verify type check passes**

Run: `pnpm --filter remote-vue lint`

Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add apps/remote-vue/
git commit -m "feat(remote-vue): accept and display PlatformUser in mount options"
```

---

### Task 5: Update Svelte remote to accept and display user

**Files:**
- Modify: `apps/remote-svelte/src/bootstrap.ts`
- Modify: `apps/remote-svelte/src/App.svelte`

- [ ] **Step 1: Extend Svelte mount to accept user option**

Modify `apps/remote-svelte/src/bootstrap.ts`:

```typescript
import { mount, unmount as svelteUnmount } from "svelte";
import App from "./App.svelte";

export interface PlatformUser {
  name: string;
  email: string;
}

let instance: Record<string, any> | null = null;

export function mountApp(el: HTMLElement, opts?: { basePath?: string; user?: PlatformUser }) {
  instance = mount(App, { target: el, props: { user: opts?.user } });
}

export function unmount() {
  if (instance) {
    svelteUnmount(instance);
    instance = null;
  }
}

export { mountApp as mount };
```

- [ ] **Step 2: Display user in Svelte App component**

Modify `apps/remote-svelte/src/App.svelte`:

```svelte
<script>
  import Router from "svelte-spa-router";
  import Home from "./pages/Home.svelte";
  import About from "./pages/About.svelte";

  let { user } = $props();

  const routes = {
    "/": Home,
    "/about": About,
  };
</script>

<div>
  <nav>
    <a href="#/">Home</a> |
    <a href="#/about">About</a>
    {#if user}
      <span style="float: right">{user.name} ({user.email})</span>
    {/if}
  </nav>
  <Router {routes} />
</div>
```

- [ ] **Step 3: Verify type check passes**

Run: `pnpm --filter remote-svelte lint`

Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add apps/remote-svelte/
git commit -m "feat(remote-svelte): accept and display PlatformUser in mount options"
```

---

### Task 6: Update host wrappers to forward user prop

**Files:**
- Modify: `apps/host/src/VueWrapper.tsx`
- Modify: `apps/host/src/SvelteWrapper.tsx`

- [ ] **Step 1: Update VueWrapper to accept and forward user**

Modify `apps/host/src/VueWrapper.tsx`:

```typescript
import { useEffect, useRef } from "react";
import { loadRemote } from "@module-federation/runtime";
import type { PlatformUser } from "@mfe-poc/platform-types";

interface VueRemoteModule {
  mount: (el: HTMLElement, opts?: { basePath?: string; user?: PlatformUser }) => void;
  unmount: () => void;
}

interface VueWrapperProps {
  user?: PlatformUser;
}

export default function VueWrapper({ user }: VueWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const moduleRef = useRef<VueRemoteModule | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadRemote("remote_vue/App").then((mod) => {
      if (cancelled || !containerRef.current) return;
      const vueModule = mod as VueRemoteModule;
      moduleRef.current = vueModule;
      vueModule.mount(containerRef.current, { basePath: "/vue", user });
    });

    return () => {
      cancelled = true;
      moduleRef.current?.unmount();
      moduleRef.current = null;
    };
  }, []);

  return <div ref={containerRef} />;
}
```

- [ ] **Step 2: Update SvelteWrapper to accept and forward user**

Modify `apps/host/src/SvelteWrapper.tsx`:

```typescript
import { useEffect, useRef } from "react";
import { loadRemote } from "@module-federation/runtime";
import type { PlatformUser } from "@mfe-poc/platform-types";

interface SvelteRemoteModule {
  mount: (el: HTMLElement, opts?: { basePath?: string; user?: PlatformUser }) => void;
  unmount: () => void;
}

interface SvelteWrapperProps {
  user?: PlatformUser;
}

export default function SvelteWrapper({ user }: SvelteWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const moduleRef = useRef<SvelteRemoteModule | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadRemote("remote_svelte/App").then((mod) => {
      if (cancelled || !containerRef.current) return;
      const svelteModule = mod as SvelteRemoteModule;
      moduleRef.current = svelteModule;
      svelteModule.mount(containerRef.current, { basePath: "/svelte", user });
    });

    return () => {
      cancelled = true;
      moduleRef.current?.unmount();
      moduleRef.current = null;
    };
  }, []);

  return <div ref={containerRef} />;
}
```

- [ ] **Step 3: Verify host type check passes**

Run: `pnpm --filter host lint`

Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add apps/host/src/VueWrapper.tsx apps/host/src/SvelteWrapper.tsx
git commit -m "feat(host): forward user prop through Vue and Svelte wrappers"
```

---

### Task 7: Full integration verification

- [ ] **Step 1: Run full lint across all apps**

Run: `pnpm lint`

Expected: All apps pass type checking with no errors

- [ ] **Step 2: Build all apps**

Run: `pnpm build`

Expected: All apps build successfully

- [ ] **Step 3: Start dev servers and verify visually**

Run: `pnpm dev`

Verify in browser at `http://localhost:3000`:
1. Host header shows "Jane Developer" in the top-right
2. Navigate to `/one` — remote-one nav shows "Jane Developer (jane@example.com)"
3. Navigate to `/two` — remote-two nav shows "Jane Developer (jane@example.com)"
4. Navigate to `/vue` — Vue remote nav shows "Jane Developer (jane@example.com)"
5. Navigate to `/svelte` — Svelte remote nav shows "Jane Developer (jane@example.com)"

- [ ] **Step 4: Verify standalone remote still works**

Run remote-one in isolation:

Run: `pnpm --filter remote-one dev`

Open `http://localhost:3001` — the app renders normally without user data (graceful degradation, no errors)

- [ ] **Step 5: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: address integration issues from verification"
```

Only commit if fixes were needed; skip if everything passed clean.
