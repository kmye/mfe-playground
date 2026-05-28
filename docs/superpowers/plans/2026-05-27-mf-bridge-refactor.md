# MF v2 Bridge Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the custom remote-loading and dual-router pattern with MF v2 Bridge for all remotes (React, Vue, Svelte).

**Architecture:** Each remote exposes `./export-app` using the bridge spec (`render`/`destroy`). The host loads all remotes uniformly via `createRemoteAppComponent` from `@module-federation/bridge-react`. React remotes use the official bridge with router-v7 alias. Vue uses `@module-federation/bridge-vue3`. Svelte uses a custom adapter matching the bridge interface.

**Tech Stack:** `@module-federation/bridge-react@^2.5.0`, `@module-federation/bridge-vue3@^2.5.0`, Rsbuild, React 19, Vue 3, Svelte 5

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `apps/remote-one/src/export-app.tsx` | Create | Bridge provider wrapping App component |
| `apps/remote-one/rsbuild.config.ts` | Modify | Add `./export-app` expose + router alias |
| `apps/remote-two/src/export-app.tsx` | Create | Bridge provider wrapping App component |
| `apps/remote-two/rsbuild.config.ts` | Modify | Add `./export-app` expose + router alias |
| `apps/remote-vue/src/export-app.ts` | Create | Vue bridge provider |
| `apps/remote-vue/rsbuild.config.ts` | Modify | Change expose to `./export-app` |
| `apps/remote-svelte/src/export-app.ts` | Create | Custom bridge adapter |
| `apps/remote-svelte/rsbuild.config.ts` | Modify | Change expose to `./export-app` |
| `apps/host/src/remotes.tsx` | Create | Bridge-based remote component definitions |
| `apps/host/src/App.tsx` | Modify | Import from `./remotes`, remove wrapper imports |
| `apps/host/src/loadRemote.ts` | Delete | Replaced by `remotes.tsx` |
| `apps/host/src/VueWrapper.tsx` | Delete | Bridge handles lifecycle |
| `apps/host/src/SvelteWrapper.tsx` | Delete | Bridge handles lifecycle |
| `apps/host/src/remote-types.d.ts` | Create | Type declarations for remote imports |

---

### Task 1: Install bridge dependencies

**Files:**
- Modify: `apps/host/package.json`
- Modify: `apps/remote-one/package.json`
- Modify: `apps/remote-two/package.json`
- Modify: `apps/remote-vue/package.json`

- [ ] **Step 1: Add bridge-react to host, remote-one, remote-two**

```bash
pnpm --filter host add @module-federation/bridge-react
pnpm --filter remote-one add @module-federation/bridge-react
pnpm --filter remote-two add @module-federation/bridge-react
```

- [ ] **Step 2: Add bridge-vue3 to remote-vue**

```bash
pnpm --filter remote-vue add @module-federation/bridge-vue3
```

- [ ] **Step 3: Verify install succeeded**

Run: `pnpm ls --filter host @module-federation/bridge-react`
Expected: Shows `@module-federation/bridge-react 2.5.x`

Run: `pnpm ls --filter remote-vue @module-federation/bridge-vue3`
Expected: Shows `@module-federation/bridge-vue3 2.5.x`

- [ ] **Step 4: Commit**

```bash
git add apps/host/package.json apps/remote-one/package.json apps/remote-two/package.json apps/remote-vue/package.json pnpm-lock.yaml
git commit -m "chore: add MF v2 bridge dependencies"
```

---

### Task 2: Create bridge provider for remote-one

**Files:**
- Create: `apps/remote-one/src/export-app.tsx`
- Modify: `apps/remote-one/rsbuild.config.ts`

- [ ] **Step 1: Create export-app.tsx**

Create `apps/remote-one/src/export-app.tsx`:

```tsx
import { createBridgeComponent } from "@module-federation/bridge-react";
import App from "./App";

export default createBridgeComponent({ rootComponent: App });
```

- [ ] **Step 2: Update rsbuild.config.ts — add expose and router alias**

Replace the full content of `apps/remote-one/rsbuild.config.ts`:

```ts
import path from "node:path";
import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginModuleFederation } from "@module-federation/rsbuild-plugin";

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginModuleFederation({
      name: "remote_one",
      filename: "remoteEntry.js",
      exposes: {
        "./export-app": "./src/export-app.tsx",
      },
      shared: {
        react: { singleton: true, requiredVersion: "^19.2.6" },
        "react-dom": { singleton: true, requiredVersion: "^19.2.6" },
        "react-router-dom": { singleton: true, requiredVersion: "^7.15.1" },
      },
    }),
  ],
  source: {
    alias: {
      "react-router-dom$": path.resolve(
        __dirname,
        "node_modules/@module-federation/bridge-react/dist/router-v7.es.js",
      ),
    },
  },
  server: {
    port: 3001,
    headers: { "Access-Control-Allow-Origin": "*" },
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

- [ ] **Step 3: Verify TypeScript passes for remote-one**

Run: `pnpm --filter remote-one lint`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add apps/remote-one/src/export-app.tsx apps/remote-one/rsbuild.config.ts
git commit -m "feat(remote-one): add MF v2 bridge provider"
```

---

### Task 3: Create bridge provider for remote-two

**Files:**
- Create: `apps/remote-two/src/export-app.tsx`
- Modify: `apps/remote-two/rsbuild.config.ts`

- [ ] **Step 1: Create export-app.tsx**

Create `apps/remote-two/src/export-app.tsx`:

```tsx
import { createBridgeComponent } from "@module-federation/bridge-react";
import App from "./App";

export default createBridgeComponent({ rootComponent: App });
```

- [ ] **Step 2: Update rsbuild.config.ts — add expose and router alias**

Replace the full content of `apps/remote-two/rsbuild.config.ts`:

```ts
import path from "node:path";
import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginModuleFederation } from "@module-federation/rsbuild-plugin";

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginModuleFederation({
      name: "remote_two",
      filename: "remoteEntry.js",
      exposes: {
        "./export-app": "./src/export-app.tsx",
      },
      shared: {
        react: { singleton: true, requiredVersion: "^19.2.6" },
        "react-dom": { singleton: true, requiredVersion: "^19.2.6" },
        "react-router-dom": { singleton: true, requiredVersion: "^7.15.1" },
      },
    }),
  ],
  source: {
    alias: {
      "react-router-dom$": path.resolve(
        __dirname,
        "node_modules/@module-federation/bridge-react/dist/router-v7.es.js",
      ),
    },
  },
  server: {
    port: 3002,
    headers: { "Access-Control-Allow-Origin": "*" },
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

- [ ] **Step 3: Verify TypeScript passes for remote-two**

Run: `pnpm --filter remote-two lint`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add apps/remote-two/src/export-app.tsx apps/remote-two/rsbuild.config.ts
git commit -m "feat(remote-two): add MF v2 bridge provider"
```

---

### Task 4: Create bridge provider for remote-vue

**Files:**
- Create: `apps/remote-vue/src/export-app.ts`
- Modify: `apps/remote-vue/rsbuild.config.ts`

- [ ] **Step 1: Create export-app.ts**

Create `apps/remote-vue/src/export-app.ts`:

```ts
import { createBridgeComponent } from "@module-federation/bridge-vue3";
import App from "./App.vue";
import { createAppRouter } from "./router";

export default createBridgeComponent({
  rootComponent: App,
  appOptions: ({ basename }) => {
    const router = createAppRouter(basename ?? "/");
    return { router };
  },
});
```

- [ ] **Step 2: Update rsbuild.config.ts — change expose to export-app**

Replace the full content of `apps/remote-vue/rsbuild.config.ts`:

```ts
import { defineConfig } from "@rsbuild/core";
import { pluginVue } from "@rsbuild/plugin-vue";
import { pluginModuleFederation } from "@module-federation/rsbuild-plugin";

export default defineConfig({
  plugins: [
    pluginVue(),
    pluginModuleFederation({
      name: "remote_vue",
      filename: "remoteEntry.js",
      exposes: {
        "./export-app": "./src/export-app.ts",
      },
      shared: {
        vue: { singleton: true, requiredVersion: "^3.5.13" },
        "vue-router": { singleton: true, requiredVersion: "^4.5.1" },
      },
    }),
  ],
  server: {
    port: 3003,
    headers: { "Access-Control-Allow-Origin": "*" },
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

- [ ] **Step 3: Verify TypeScript passes for remote-vue**

Run: `pnpm --filter remote-vue lint`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add apps/remote-vue/src/export-app.ts apps/remote-vue/rsbuild.config.ts
git commit -m "feat(remote-vue): add MF v2 bridge provider"
```

---

### Task 5: Create bridge adapter for remote-svelte

**Files:**
- Create: `apps/remote-svelte/src/export-app.ts`
- Modify: `apps/remote-svelte/rsbuild.config.ts`

- [ ] **Step 1: Create export-app.ts**

Create `apps/remote-svelte/src/export-app.ts`:

```ts
import { mount, unmount as svelteUnmount } from "svelte";
import App from "./App.svelte";

let instance: Record<string, any> | null = null;

export default {
  render(info: { dom: HTMLElement; basename?: string }) {
    instance = mount(App, {
      target: info.dom,
      props: { basename: info.basename ?? "/" },
    });
  },
  destroy(_info: { dom: HTMLElement }) {
    if (instance) {
      svelteUnmount(instance);
      instance = null;
    }
  },
};
```

- [ ] **Step 2: Update rsbuild.config.ts — change expose to export-app**

Replace the full content of `apps/remote-svelte/rsbuild.config.ts`:

```ts
import { defineConfig } from "@rsbuild/core";
import { pluginSvelte } from "@rsbuild/plugin-svelte";
import { pluginModuleFederation } from "@module-federation/rsbuild-plugin";

export default defineConfig({
  plugins: [
    pluginSvelte(),
    pluginModuleFederation({
      name: "remote_svelte",
      filename: "remoteEntry.js",
      exposes: {
        "./export-app": "./src/export-app.ts",
      },
      shared: {
        "svelte-spa-router": { singleton: true, requiredVersion: "^5.1.0" },
      },
    }),
  ],
  server: {
    port: 3004,
    headers: { "Access-Control-Allow-Origin": "*" },
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

- [ ] **Step 3: Verify TypeScript passes for remote-svelte**

Run: `pnpm --filter remote-svelte lint`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add apps/remote-svelte/src/export-app.ts apps/remote-svelte/rsbuild.config.ts
git commit -m "feat(remote-svelte): add custom bridge adapter"
```

---

### Task 6: Refactor host to use bridge consumer API

**Files:**
- Create: `apps/host/src/remotes.tsx`
- Create: `apps/host/src/remote-types.d.ts`
- Modify: `apps/host/src/App.tsx`
- Delete: `apps/host/src/loadRemote.ts`
- Delete: `apps/host/src/VueWrapper.tsx`
- Delete: `apps/host/src/SvelteWrapper.tsx`

- [ ] **Step 1: Create type declarations for remote imports**

Create `apps/host/src/remote-types.d.ts`:

```ts
declare module "remote_one/export-app" {
  const module: {
    default: () => {
      render(info: { dom: HTMLElement; basename?: string }): Promise<void>;
      destroy(info: { dom: HTMLElement }): void;
    };
  };
  export default module;
}

declare module "remote_two/export-app" {
  const module: {
    default: () => {
      render(info: { dom: HTMLElement; basename?: string }): Promise<void>;
      destroy(info: { dom: HTMLElement }): void;
    };
  };
  export default module;
}

declare module "remote_vue/export-app" {
  const module: {
    default: () => {
      render(info: { dom: HTMLElement; basename?: string }): Promise<void>;
      destroy(info: { dom: HTMLElement }): void;
    };
  };
  export default module;
}

declare module "remote_svelte/export-app" {
  const module: {
    default: () => {
      render(info: { dom: HTMLElement; basename?: string }): Promise<void>;
      destroy(info: { dom: HTMLElement }): void;
    };
  };
  export default module;
}
```

- [ ] **Step 2: Create remotes.tsx**

Create `apps/host/src/remotes.tsx`:

```tsx
import { createRemoteAppComponent } from "@module-federation/bridge-react";

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="flex items-center justify-center py-12">
      <p className="text-red-600">Failed to load remote: {error.message}</p>
    </div>
  );
}

export const RemoteOneApp = createRemoteAppComponent({
  loader: () => import("remote_one/export-app"),
  loading: <div className="flex items-center justify-center py-12"><p className="text-gray-500">Loading...</p></div>,
  fallback: ErrorFallback,
});

export const RemoteTwoApp = createRemoteAppComponent({
  loader: () => import("remote_two/export-app"),
  loading: <div className="flex items-center justify-center py-12"><p className="text-gray-500">Loading...</p></div>,
  fallback: ErrorFallback,
});

export const RemoteVueApp = createRemoteAppComponent({
  loader: () => import("remote_vue/export-app"),
  loading: <div className="flex items-center justify-center py-12"><p className="text-gray-500">Loading...</p></div>,
  fallback: ErrorFallback,
});

export const RemoteSvelteApp = createRemoteAppComponent({
  loader: () => import("remote_svelte/export-app"),
  loading: <div className="flex items-center justify-center py-12"><p className="text-gray-500">Loading...</p></div>,
  fallback: ErrorFallback,
});
```

- [ ] **Step 3: Update App.tsx to use bridge components**

Replace the full content of `apps/host/src/App.tsx`:

```tsx
import { useState } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import { RemoteOneApp, RemoteTwoApp, RemoteVueApp, RemoteSvelteApp } from "./remotes";

const navItems = [
  { to: "/one", label: "Remote One" },
  { to: "/two", label: "Remote Two" },
  { to: "/vue", label: "Remote Vue" },
  { to: "/svelte", label: "Remote Svelte" },
];

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
            <Route path="/one/*" element={<RemoteOneApp basename="/one" />} />
            <Route path="/two/*" element={<RemoteTwoApp basename="/two" />} />
            <Route path="/vue/*" element={<RemoteVueApp basename="/vue" />} />
            <Route path="/svelte/*" element={<RemoteSvelteApp basename="/svelte" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Delete old files**

```bash
rm apps/host/src/loadRemote.ts
rm apps/host/src/VueWrapper.tsx
rm apps/host/src/SvelteWrapper.tsx
```

- [ ] **Step 5: Verify TypeScript passes for host**

Run: `pnpm --filter host lint`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add apps/host/src/remotes.tsx apps/host/src/remote-types.d.ts apps/host/src/App.tsx
git add -u apps/host/src/loadRemote.ts apps/host/src/VueWrapper.tsx apps/host/src/SvelteWrapper.tsx
git commit -m "feat(host): refactor to MF v2 bridge consumer API

Replace custom loadRemote + Vue/Svelte wrappers with createRemoteAppComponent.
All remotes now load uniformly through the bridge pattern."
```

---

### Task 7: Full build and integration verification

**Files:** None (verification only)

- [ ] **Step 1: Run full lint across all apps**

Run: `pnpm lint`
Expected: All apps pass type-checking

- [ ] **Step 2: Run full build**

Run: `pnpm build`
Expected: All apps build successfully, each producing `mf-manifest.json` in their dist

- [ ] **Step 3: Start dev and verify all remotes load**

Run: `pnpm dev`

Verify in browser at `http://localhost:3000`:
1. Navigate to `/one` — Remote One loads, shows Dashboard
2. Navigate to `/one/settings` — Settings page renders
3. Navigate to `/two` — Remote Two loads, shows Overview
4. Navigate to `/two/details` — Details page renders
5. Navigate to `/vue` — Vue remote loads, shows Home
6. Navigate to `/vue/about` — About page renders
7. Navigate to `/svelte` — Svelte remote loads, shows Home
8. Navigate to `/svelte` then click About link — About page renders
9. Browser back/forward works across all transitions

- [ ] **Step 4: Verify standalone dev still works**

Run each remote individually and confirm it renders standalone:

```bash
pnpm --filter remote-one dev
# Visit http://localhost:3001 — should show Dashboard with working nav

pnpm --filter remote-vue dev
# Visit http://localhost:3003 — should show Home with working nav
```

- [ ] **Step 5: Final commit if any fixes were needed**

If any adjustments were made during verification, commit them:

```bash
git add -A
git commit -m "fix: address bridge integration issues found during verification"
```
