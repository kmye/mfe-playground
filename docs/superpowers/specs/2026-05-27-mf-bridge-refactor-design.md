# Refactor Browser Routing to MF v2 Bridge

## Problem

The current micro-frontend routing has three issues:

1. **Dual-router conflict** — React remotes render their own `<BrowserRouter>` in standalone mode, but when mounted inside the host (which also has a router), two competing router instances fight over URL state.
2. **Manual lifecycle management** — Vue and Svelte remotes use hand-rolled `mount()`/`unmount()` wrappers in the host (`VueWrapper.tsx`, `SvelteWrapper.tsx`). These lack error boundaries, route syncing, and proper cleanup on fast navigation.
3. **No basename injection** — The host cannot tell remotes what URL prefix they're mounted at. Each remote hardcodes its basename (`/one`, `/two`, etc.) which breaks if routes change.

## Solution

Adopt the Module Federation v2 Bridge pattern across all remotes:

- **React remotes** use `@module-federation/bridge-react` (official)
- **Vue remote** uses `@module-federation/bridge-vue3` (official)
- **Svelte remote** uses a custom bridge adapter matching the bridge spec (no official package exists)

The bridge handles: mounting/unmounting, basename injection, memory router isolation, error boundaries, and framework-agnostic lifecycle.

## Architecture

### Bridge Contract

Every remote exposes `./export-app` — a module that returns an object with `render` and `destroy` methods (the bridge spec). The host loads all remotes uniformly via `createRemoteAppComponent` from `@module-federation/bridge-react`.

```
Host (createRemoteAppComponent)
  └── loader: () => import("remote_xxx/export-app")
        └── { render(info: { dom, basename, memoryRoute }), destroy(info: { dom }) }
```

### Remote-One & Remote-Two (React)

**New file: `src/export-app.tsx`**

```tsx
import { createBridgeComponent } from "@module-federation/bridge-react";
import App from "./App";

export default createBridgeComponent({ rootComponent: App });
```

**rsbuild.config.ts changes:**

```ts
exposes: {
  "./App": "./src/App.tsx",         // keep for backward compat during transition
  "./export-app": "./src/export-app.tsx",
},
```

Add alias so the bridge can intercept `react-router-dom` and inject basename/memory router. Since this project uses react-router-dom v7, use the `router-v7` export:

```ts
source: {
  alias: {
    "react-router-dom$": path.resolve(
      __dirname,
      "node_modules/@module-federation/bridge-react/dist/router-v7.es.js",
    ),
  },
},
```

**`bootstrap.tsx`** — unchanged. Standalone dev continues to work with its own `<BrowserRouter basename="/one">`.

**`App.tsx`** — unchanged. Still defines `<Routes>` with relative paths. The bridge injects basename and router context transparently via the alias.

### Remote-Vue (Vue 3)

**New file: `src/export-app.ts`**

```ts
import { createBridgeComponent } from "@module-federation/bridge-vue3";
import App from "./App.vue";
import { createAppRouter } from "./router";

export default createBridgeComponent({
  rootComponent: App,
  appOptions: ({ basename, memoryRoute }) => {
    const router = createAppRouter(basename ?? "/");
    return { router };
  },
});
```

The `appOptions` callback receives `{ app, basename, memoryRoute }` from the bridge. The bridge injects the correct basename based on where the host mounts the remote.

**rsbuild.config.ts changes:**

```ts
exposes: {
  "./export-app": "./src/export-app.ts",
},
```

Remove the old `"./App": "./src/bootstrap.ts"` expose.

**`bootstrap.ts`** — keep for standalone dev (unchanged).

### Remote-Svelte (Custom Bridge Adapter)

No official bridge package exists. Write a thin adapter matching the bridge spec.

**New file: `src/export-app.ts`**

```ts
import App from "./App.svelte";
import { mount, unmount as svelteUnmount } from "svelte";

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

**rsbuild.config.ts changes:**

```ts
exposes: {
  "./export-app": "./src/export-app.ts",
},
```

Remove the old `"./App": "./src/bootstrap.ts"` expose.

**`bootstrap.ts`** — keep for standalone dev (unchanged).

### Host App

**Replace `src/loadRemote.ts`** with `src/remotes.tsx`:

```tsx
import { createRemoteAppComponent } from "@module-federation/bridge-react";

function ErrorFallback({ error }: { error: Error }) {
  return <div>Failed to load remote: {error.message}</div>;
}

export const RemoteOneApp = createRemoteAppComponent({
  loader: () => import("remote_one/export-app"),
  loading: <div>Loading Remote One...</div>,
  fallback: ErrorFallback,
});

export const RemoteTwoApp = createRemoteAppComponent({
  loader: () => import("remote_two/export-app"),
  loading: <div>Loading Remote Two...</div>,
  fallback: ErrorFallback,
});

export const RemoteVueApp = createRemoteAppComponent({
  loader: () => import("remote_vue/export-app"),
  loading: <div>Loading Remote Vue...</div>,
  fallback: ErrorFallback,
});

export const RemoteSvelteApp = createRemoteAppComponent({
  loader: () => import("remote_svelte/export-app"),
  loading: <div>Loading Remote Svelte...</div>,
  fallback: ErrorFallback,
});
```

`createRemoteAppComponent` API:
- `loader`: async import function returning the bridge module
- `loading`: ReactNode shown during load
- `fallback`: React component rendered on error, receives `{ error: Error }`

**Update `src/App.tsx`** routes:

```tsx
import { RemoteOneApp, RemoteTwoApp, RemoteVueApp, RemoteSvelteApp } from "./remotes";

// In Routes (no more Suspense needed — bridge handles loading internally):
<Route path="/one/*" element={<RemoteOneApp basename="/one" />} />
<Route path="/two/*" element={<RemoteTwoApp basename="/two" />} />
<Route path="/vue/*" element={<RemoteVueApp basename="/vue" />} />
<Route path="/svelte/*" element={<RemoteSvelteApp basename="/svelte" />} />
```

**Delete:**
- `src/loadRemote.ts`
- `src/VueWrapper.tsx`
- `src/SvelteWrapper.tsx`

**rsbuild.config.ts** — update `remotes` keys to still point at `mf-manifest.json` (no change needed, the runtime resolves `export-app` from the manifest).

### New Dependencies

| App | Package | Purpose |
|-----|---------|---------|
| host | `@module-federation/bridge-react` | `createRemoteAppComponent` for loading all remotes |
| remote-one | `@module-federation/bridge-react` | `createBridgeComponent` + router alias |
| remote-two | `@module-federation/bridge-react` | `createBridgeComponent` + router alias |
| remote-vue | `@module-federation/bridge-vue3` | `createBridgeComponent` for Vue |

No new dependency for remote-svelte (uses Svelte's built-in `mount`/`unmount`).

## What Changes for Developers

| Before | After |
|--------|-------|
| Remotes hardcode `basename` in bootstrap | Bridge injects basename from host route |
| Host uses custom `React.lazy` wrapper | Host uses `createRemoteAppComponent` with built-in error boundary and loading state |
| Vue/Svelte need manual wrapper components | All remotes load uniformly through bridge |
| Two routers active simultaneously | Single logical router — bridge uses memory router inside remotes |
| No error isolation between remotes | Bridge provides per-remote error boundaries |

## Files Changed

### New Files
- `apps/remote-one/src/export-app.tsx`
- `apps/remote-two/src/export-app.tsx`
- `apps/remote-vue/src/export-app.ts`
- `apps/remote-svelte/src/export-app.ts`
- `apps/host/src/remotes.tsx`

### Modified Files
- `apps/host/src/App.tsx` — import from `./remotes` instead of `./loadRemote`, remove Vue/Svelte wrapper imports
- `apps/host/rsbuild.config.ts` — no structural changes needed (manifest resolution handles export-app)
- `apps/remote-one/rsbuild.config.ts` — add `export-app` expose + router alias
- `apps/remote-two/rsbuild.config.ts` — add `export-app` expose + router alias
- `apps/remote-vue/rsbuild.config.ts` — change expose from `./App` to `./export-app`
- `apps/remote-svelte/rsbuild.config.ts` — change expose from `./App` to `./export-app`
- `apps/host/package.json` — add `@module-federation/bridge-react`
- `apps/remote-one/package.json` — add `@module-federation/bridge-react`
- `apps/remote-two/package.json` — add `@module-federation/bridge-react`
- `apps/remote-vue/package.json` — add `@module-federation/bridge-vue3`

### Deleted Files
- `apps/host/src/loadRemote.ts`
- `apps/host/src/VueWrapper.tsx`
- `apps/host/src/SvelteWrapper.tsx`

## Verification

1. `pnpm install` succeeds
2. `pnpm lint` passes (TypeScript type-check)
3. `pnpm dev` — all four remotes load correctly in the host
4. Navigation between remotes preserves URL state correctly
5. Each remote's internal navigation (Dashboard→Settings, Overview→Details, Home→About) works
6. Browser back/forward navigates correctly across remote boundaries
7. Standalone dev still works for each remote individually
