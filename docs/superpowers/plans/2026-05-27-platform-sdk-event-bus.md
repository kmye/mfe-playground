# Platform SDK Event Bus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `@mfe-poc/platform-sdk` with a typed event bus (pub/sub + request/response), wire it as a Module Federation shared singleton, and migrate existing CustomEvent breadcrumb communication to use it.

**Architecture:** A new workspace package (`packages/platform-sdk`) exports a singleton `EventBus` instance. All MF apps declare it as a shared singleton so a single instance exists at runtime. React convenience hooks are exported from a `/react` subpath. Existing `useBreadcrumbs` CustomEvent code in remotes and `useBreadcrumbListener` in host are replaced.

**Tech Stack:** TypeScript, pnpm workspaces, Module Federation 2.0 (Rsbuild plugin), React 19, Vitest (new — for unit tests)

---

## File Map

| Path | Action | Responsibility |
|------|--------|---------------|
| `packages/platform-sdk/package.json` | Create | Package manifest with exports map |
| `packages/platform-sdk/tsconfig.json` | Create | TypeScript config |
| `packages/platform-sdk/src/event-bus/types.ts` | Create | EventMap, RequestMap, EventBus interface |
| `packages/platform-sdk/src/event-bus/bus.ts` | Create | EventBusImpl class + singleton |
| `packages/platform-sdk/src/types.ts` | Create | Shared platform types (BreadcrumbItem) |
| `packages/platform-sdk/src/index.ts` | Create | Barrel export |
| `packages/platform-sdk/src/react/index.ts` | Create | useSubscribe, useRequest hooks |
| `packages/platform-sdk/src/__tests__/bus.test.ts` | Create | Unit tests for EventBusImpl |
| `packages/platform-sdk/vitest.config.ts` | Create | Vitest config |
| `apps/host/rsbuild.config.ts` | Modify | Add platform-sdk to shared |
| `apps/remote-one/rsbuild.config.ts` | Modify | Add platform-sdk to shared |
| `apps/remote-two/rsbuild.config.ts` | Modify | Add platform-sdk to shared |
| `apps/host/package.json` | Modify | Add platform-sdk dep |
| `apps/remote-one/package.json` | Modify | Add platform-sdk dep |
| `apps/remote-two/package.json` | Modify | Add platform-sdk dep |
| `apps/host/src/Breadcrumbs.tsx` | Modify | Use useSubscribe instead of useBreadcrumbListener |
| `apps/host/src/useBreadcrumbListener.ts` | Delete | Replaced by platform-sdk |
| `apps/remote-one/src/pages/Dashboard.tsx` | Modify | Use eventBus.publish |
| `apps/remote-one/src/pages/Settings.tsx` | Modify | Use eventBus.publish |
| `apps/remote-one/src/useBreadcrumbs.ts` | Delete | Replaced by platform-sdk |
| `apps/remote-two/src/pages/Overview.tsx` | Modify | Use eventBus.publish |
| `apps/remote-two/src/pages/Details.tsx` | Modify | Use eventBus.publish |
| `apps/remote-two/src/useBreadcrumbs.ts` | Delete | Replaced by platform-sdk |

---

## Task 1: Scaffold platform-sdk package

**Files:**
- Create: `packages/platform-sdk/package.json`
- Create: `packages/platform-sdk/tsconfig.json`
- Create: `packages/platform-sdk/src/index.ts` (empty placeholder)

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@mfe-poc/platform-sdk",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "import": "./src/index.ts"
    },
    "./react": {
      "types": "./src/react/index.ts",
      "import": "./src/react/index.ts"
    }
  },
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "tsc --noEmit",
    "test": "vitest run"
  },
  "peerDependencies": {
    "react": "^19.0.0"
  },
  "devDependencies": {
    "react": "^19.2.6",
    "typescript": "^5.8.0",
    "vitest": "^3.2.1",
    "@types/react": "^19.2.15"
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

- [ ] **Step 3: Create empty barrel**

Create `packages/platform-sdk/src/index.ts`:

```ts
export {};
```

- [ ] **Step 4: Install dependencies**

Run: `pnpm install`

Expected: Resolves workspace deps, no errors. `packages/platform-sdk` appears in workspace.

- [ ] **Step 5: Verify TypeScript**

Run: `cd packages/platform-sdk && pnpm lint`

Expected: PASS (no type errors on empty file)

- [ ] **Step 6: Commit**

```bash
git add packages/platform-sdk/
git commit -m "chore: scaffold @mfe-poc/platform-sdk package"
```

---

## Task 2: Implement event bus types

**Files:**
- Create: `packages/platform-sdk/src/types.ts`
- Create: `packages/platform-sdk/src/event-bus/types.ts`

- [ ] **Step 1: Create shared platform types**

Create `packages/platform-sdk/src/types.ts`:

```ts
export interface BreadcrumbItem {
  label: string;
  path?: string;
}
```

- [ ] **Step 2: Create event bus type definitions**

Create `packages/platform-sdk/src/event-bus/types.ts`:

```ts
import type { BreadcrumbItem } from "../types";

export interface EventMap {
  breadcrumbs: BreadcrumbItem[];
}

export interface RequestMap {}

export type Listener<T = unknown> = (payload: T) => void;
export type Handler<Req = unknown, Res = unknown> = (
  payload: Req
) => Res | Promise<Res>;

export interface EventBus {
  publish<K extends keyof EventMap>(event: K, payload: EventMap[K]): void;
  subscribe<K extends keyof EventMap>(
    event: K,
    handler: Listener<EventMap[K]>
  ): () => void;
  request<K extends keyof RequestMap>(
    type: K,
    payload?: RequestMap[K] extends { request: infer R } ? R : never,
    timeoutMs?: number
  ): Promise<RequestMap[K] extends { response: infer R } ? R : never>;
  handle<K extends keyof RequestMap>(
    type: K,
    handler: Handler<
      RequestMap[K] extends { request: infer Req } ? Req : never,
      RequestMap[K] extends { response: infer Res } ? Res : never
    >
  ): () => void;
}
```

- [ ] **Step 3: Verify TypeScript**

Run: `cd packages/platform-sdk && pnpm lint`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/platform-sdk/src/types.ts packages/platform-sdk/src/event-bus/types.ts
git commit -m "feat(platform-sdk): add event bus type definitions"
```

---

## Task 3: Implement EventBusImpl with TDD

**Files:**
- Create: `packages/platform-sdk/vitest.config.ts`
- Create: `packages/platform-sdk/src/__tests__/bus.test.ts`
- Create: `packages/platform-sdk/src/event-bus/bus.ts`

- [ ] **Step 1: Create vitest config**

Create `packages/platform-sdk/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
  },
});
```

- [ ] **Step 2: Write failing tests for pub/sub**

Create `packages/platform-sdk/src/__tests__/bus.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { createEventBus } from "../event-bus/bus";
import type { EventBus } from "../event-bus/types";

describe("EventBus", () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = createEventBus();
  });

  describe("publish/subscribe", () => {
    it("delivers payload to subscriber", () => {
      const handler = vi.fn();
      bus.subscribe("breadcrumbs", handler);
      bus.publish("breadcrumbs", [{ label: "Home" }]);
      expect(handler).toHaveBeenCalledWith([{ label: "Home" }]);
    });

    it("delivers to multiple subscribers", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      bus.subscribe("breadcrumbs", handler1);
      bus.subscribe("breadcrumbs", handler2);
      bus.publish("breadcrumbs", [{ label: "Test" }]);
      expect(handler1).toHaveBeenCalledOnce();
      expect(handler2).toHaveBeenCalledOnce();
    });

    it("does not deliver after unsubscribe", () => {
      const handler = vi.fn();
      const unsub = bus.subscribe("breadcrumbs", handler);
      unsub();
      bus.publish("breadcrumbs", [{ label: "Ignored" }]);
      expect(handler).not.toHaveBeenCalled();
    });

    it("does nothing when publishing with no subscribers", () => {
      expect(() =>
        bus.publish("breadcrumbs", [{ label: "Noop" }])
      ).not.toThrow();
    });
  });

  describe("request/handle", () => {
    it("resolves with handler response", async () => {
      bus.handle("get-test" as any, (payload: any) => ({ value: payload.key }));
      const result = await bus.request("get-test" as any, { key: "hello" });
      expect(result).toEqual({ value: "hello" });
    });

    it("resolves with async handler response", async () => {
      bus.handle("get-test" as any, async (payload: any) => {
        return { value: "async-" + payload.key };
      });
      const result = await bus.request("get-test" as any, { key: "data" });
      expect(result).toEqual({ value: "async-data" });
    });

    it("throws when no handler is registered", async () => {
      await expect(bus.request("unknown" as any)).rejects.toThrow(
        'No handler registered for "unknown"'
      );
    });

    it("rejects on timeout", async () => {
      bus.handle("slow" as any, () => new Promise(() => {}));
      await expect(bus.request("slow" as any, undefined, 50)).rejects.toThrow(
        'Request "slow" timed out'
      );
    });

    it("unregisters handler on cleanup", async () => {
      const cleanup = bus.handle("temp" as any, () => "ok");
      cleanup();
      await expect(bus.request("temp" as any)).rejects.toThrow(
        'No handler registered for "temp"'
      );
    });

    it("last handler wins when registered twice", async () => {
      bus.handle("dup" as any, () => "first");
      bus.handle("dup" as any, () => "second");
      const result = await bus.request("dup" as any);
      expect(result).toBe("second");
    });
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd packages/platform-sdk && pnpm test`

Expected: FAIL — `Cannot find module '../event-bus/bus'`

- [ ] **Step 4: Implement EventBusImpl**

Create `packages/platform-sdk/src/event-bus/bus.ts`:

```ts
import type { EventBus, EventMap, RequestMap, Listener, Handler } from "./types";

class EventBusImpl implements EventBus {
  private listeners = new Map<string, Set<Listener>>();
  private handlers = new Map<string, Handler>();

  publish<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    const set = this.listeners.get(event as string);
    if (set) set.forEach((fn) => fn(payload));
  }

  subscribe<K extends keyof EventMap>(
    event: K,
    handler: Listener<EventMap[K]>
  ): () => void {
    const key = event as string;
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    this.listeners.get(key)!.add(handler);
    return () => {
      this.listeners.get(key)?.delete(handler);
    };
  }

  async request<K extends keyof RequestMap>(
    type: K,
    payload?: RequestMap[K] extends { request: infer R } ? R : never,
    timeoutMs = 5000
  ): Promise<RequestMap[K] extends { response: infer R } ? R : never> {
    const handler = this.handlers.get(type as string);
    if (!handler)
      throw new Error(`No handler registered for "${String(type)}"`);
    return Promise.race([
      Promise.resolve(handler(payload)),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Request "${String(type)}" timed out`)),
          timeoutMs
        )
      ),
    ]);
  }

  handle<K extends keyof RequestMap>(
    type: K,
    handler: Handler<
      RequestMap[K] extends { request: infer Req } ? Req : never,
      RequestMap[K] extends { response: infer Res } ? Res : never
    >
  ): () => void {
    this.handlers.set(type as string, handler);
    return () => {
      this.handlers.delete(type as string);
    };
  }
}

export function createEventBus(): EventBus {
  return new EventBusImpl();
}

export const eventBus: EventBus = createEventBus();
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd packages/platform-sdk && pnpm test`

Expected: All 8 tests PASS

- [ ] **Step 6: Commit**

```bash
git add packages/platform-sdk/vitest.config.ts packages/platform-sdk/src/__tests__/bus.test.ts packages/platform-sdk/src/event-bus/bus.ts
git commit -m "feat(platform-sdk): implement EventBusImpl with tests"
```

---

## Task 4: Add React hooks and barrel export

**Files:**
- Create: `packages/platform-sdk/src/react/index.ts`
- Modify: `packages/platform-sdk/src/index.ts`

- [ ] **Step 1: Create React hooks**

Create `packages/platform-sdk/src/react/index.ts`:

```ts
import { useEffect, useState } from "react";
import { eventBus } from "../event-bus/bus";
import type { EventMap, RequestMap } from "../event-bus/types";

export function useSubscribe<K extends keyof EventMap>(
  event: K,
  handler: (payload: EventMap[K]) => void
): void {
  useEffect(() => eventBus.subscribe(event, handler), [event]);
}

export function useRequest<K extends keyof RequestMap>(
  type: K,
  payload?: RequestMap[K] extends { request: infer R } ? R : never
): (RequestMap[K] extends { response: infer R } ? R : never) | null {
  const [data, setData] = useState<
    (RequestMap[K] extends { response: infer R } ? R : never) | null
  >(null);
  useEffect(() => {
    eventBus.request(type, payload).then(setData);
  }, [type]);
  return data;
}
```

- [ ] **Step 2: Update barrel export**

Replace `packages/platform-sdk/src/index.ts` with:

```ts
export { eventBus, createEventBus } from "./event-bus/bus";
export type { EventBus, EventMap, RequestMap } from "./event-bus/types";
export type { BreadcrumbItem } from "./types";
```

- [ ] **Step 3: Verify TypeScript**

Run: `cd packages/platform-sdk && pnpm lint`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/platform-sdk/src/react/index.ts packages/platform-sdk/src/index.ts
git commit -m "feat(platform-sdk): add React hooks and barrel exports"
```

---

## Task 5: Wire platform-sdk as MF shared singleton

**Files:**
- Modify: `apps/host/package.json`
- Modify: `apps/remote-one/package.json`
- Modify: `apps/remote-two/package.json`
- Modify: `apps/host/rsbuild.config.ts`
- Modify: `apps/remote-one/rsbuild.config.ts`
- Modify: `apps/remote-two/rsbuild.config.ts`

- [ ] **Step 1: Add workspace dependency to all apps**

Add `"@mfe-poc/platform-sdk": "workspace:*"` to `dependencies` in:
- `apps/host/package.json`
- `apps/remote-one/package.json`
- `apps/remote-two/package.json`

- [ ] **Step 2: Run pnpm install**

Run: `pnpm install`

Expected: Symlinks workspace package, no errors.

- [ ] **Step 3: Add to MF shared config in host**

In `apps/host/rsbuild.config.ts`, add to the `shared` object:

```ts
shared: {
  react: { singleton: true, requiredVersion: "^19.2.6" },
  "react-dom": { singleton: true, requiredVersion: "^19.2.6" },
  "react-router-dom": { singleton: true, requiredVersion: "^7.15.1" },
  "@mfe-poc/platform-sdk": { singleton: true, requiredVersion: "*" },
},
```

- [ ] **Step 4: Add to MF shared config in remote-one**

In `apps/remote-one/rsbuild.config.ts`, add to the `shared` object:

```ts
shared: {
  react: { singleton: true, requiredVersion: "^19.2.6" },
  "react-dom": { singleton: true, requiredVersion: "^19.2.6" },
  "react-router-dom": { singleton: true, requiredVersion: "^7.15.1" },
  "@mfe-poc/platform-sdk": { singleton: true, requiredVersion: "*" },
},
```

- [ ] **Step 5: Add to MF shared config in remote-two**

In `apps/remote-two/rsbuild.config.ts`, add to the `shared` object:

```ts
shared: {
  react: { singleton: true, requiredVersion: "^19.2.6" },
  "react-dom": { singleton: true, requiredVersion: "^19.2.6" },
  "react-router-dom": { singleton: true, requiredVersion: "^7.15.1" },
  "@mfe-poc/platform-sdk": { singleton: true, requiredVersion: "*" },
},
```

- [ ] **Step 6: Verify all apps type-check**

Run: `pnpm lint`

Expected: PASS for all workspaces

- [ ] **Step 7: Commit**

```bash
git add apps/host/package.json apps/remote-one/package.json apps/remote-two/package.json \
  apps/host/rsbuild.config.ts apps/remote-one/rsbuild.config.ts apps/remote-two/rsbuild.config.ts \
  pnpm-lock.yaml
git commit -m "chore: wire @mfe-poc/platform-sdk as MF shared singleton"
```

---

## Task 6: Migrate host breadcrumb listener

**Files:**
- Modify: `apps/host/src/Breadcrumbs.tsx`
- Delete: `apps/host/src/useBreadcrumbListener.ts`

- [ ] **Step 1: Rewrite Breadcrumbs.tsx to use platform-sdk**

Replace `apps/host/src/Breadcrumbs.tsx` with:

```tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { useSubscribe } from "@mfe-poc/platform-sdk/react";
import type { BreadcrumbItem } from "@mfe-poc/platform-sdk";

export default function Breadcrumbs() {
  const [remoteCrumbs, setRemoteCrumbs] = useState<BreadcrumbItem[]>([]);

  useSubscribe("breadcrumbs", setRemoteCrumbs);

  const allCrumbs: BreadcrumbItem[] = [
    { label: "Home", path: "/" },
    ...remoteCrumbs,
  ];

  return (
    <nav aria-label="Breadcrumb">
      {allCrumbs.map((crumb, index) => {
        const isLast = index === allCrumbs.length - 1;
        return (
          <span key={index}>
            {index > 0 && " > "}
            {isLast || !crumb.path ? (
              <span>{crumb.label}</span>
            ) : (
              <Link to={crumb.path}>{crumb.label}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 2: Delete useBreadcrumbListener.ts**

Run: `rm apps/host/src/useBreadcrumbListener.ts`

- [ ] **Step 3: Verify host type-checks**

Run: `cd apps/host && pnpm lint`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/host/src/Breadcrumbs.tsx
git rm apps/host/src/useBreadcrumbListener.ts
git commit -m "refactor(host): migrate breadcrumbs to platform-sdk event bus"
```

---

## Task 7: Migrate remote-one to platform-sdk

**Files:**
- Modify: `apps/remote-one/src/pages/Dashboard.tsx`
- Modify: `apps/remote-one/src/pages/Settings.tsx`
- Delete: `apps/remote-one/src/useBreadcrumbs.ts`

- [ ] **Step 1: Update Dashboard.tsx**

Replace `apps/remote-one/src/pages/Dashboard.tsx` with:

```tsx
import { useEffect } from "react";
import { eventBus } from "@mfe-poc/platform-sdk";

export default function Dashboard() {
  useEffect(() => {
    eventBus.publish("breadcrumbs", [{ label: "Dashboard" }]);
  }, []);
  return <h2>Remote One — Dashboard</h2>;
}
```

- [ ] **Step 2: Update Settings.tsx**

Replace `apps/remote-one/src/pages/Settings.tsx` with:

```tsx
import { useEffect } from "react";
import { eventBus } from "@mfe-poc/platform-sdk";

export default function Settings() {
  useEffect(() => {
    eventBus.publish("breadcrumbs", [
      { label: "Dashboard", path: "/one" },
      { label: "Settings" },
    ]);
  }, []);
  return <h2>Remote One — Settings</h2>;
}
```

- [ ] **Step 3: Delete useBreadcrumbs.ts**

Run: `rm apps/remote-one/src/useBreadcrumbs.ts`

- [ ] **Step 4: Verify type-check**

Run: `cd apps/remote-one && pnpm lint`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/remote-one/src/pages/Dashboard.tsx apps/remote-one/src/pages/Settings.tsx
git rm apps/remote-one/src/useBreadcrumbs.ts
git commit -m "refactor(remote-one): migrate breadcrumbs to platform-sdk event bus"
```

---

## Task 8: Migrate remote-two to platform-sdk

**Files:**
- Modify: `apps/remote-two/src/pages/Overview.tsx`
- Modify: `apps/remote-two/src/pages/Details.tsx`
- Delete: `apps/remote-two/src/useBreadcrumbs.ts`

- [ ] **Step 1: Update Overview.tsx**

Replace `apps/remote-two/src/pages/Overview.tsx` with:

```tsx
import { useEffect } from "react";
import { eventBus } from "@mfe-poc/platform-sdk";

export default function Overview() {
  useEffect(() => {
    eventBus.publish("breadcrumbs", [{ label: "Overview" }]);
  }, []);
  return <h2>Remote Two — Overview</h2>;
}
```

- [ ] **Step 2: Update Details.tsx**

Replace `apps/remote-two/src/pages/Details.tsx` with:

```tsx
import { useEffect } from "react";
import { eventBus } from "@mfe-poc/platform-sdk";

export default function Details() {
  useEffect(() => {
    eventBus.publish("breadcrumbs", [
      { label: "Overview", path: "/two" },
      { label: "Details" },
    ]);
  }, []);
  return <h2>Remote Two — Details</h2>;
}
```

- [ ] **Step 3: Delete useBreadcrumbs.ts**

Run: `rm apps/remote-two/src/useBreadcrumbs.ts`

- [ ] **Step 4: Verify type-check**

Run: `cd apps/remote-two && pnpm lint`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/remote-two/src/pages/Overview.tsx apps/remote-two/src/pages/Details.tsx
git rm apps/remote-two/src/useBreadcrumbs.ts
git commit -m "refactor(remote-two): migrate breadcrumbs to platform-sdk event bus"
```

---

## Task 9: Integration verification

**Files:** None (verification only)

- [ ] **Step 1: Run full lint**

Run: `pnpm lint`

Expected: All workspaces PASS

- [ ] **Step 2: Run platform-sdk tests**

Run: `cd packages/platform-sdk && pnpm test`

Expected: All tests PASS

- [ ] **Step 3: Run dev servers**

Run: `pnpm dev`

Expected: Host (3000), remote-one (3001), remote-two (3002) all start without errors.

- [ ] **Step 4: Verify breadcrumbs in browser**

1. Open `http://localhost:3000`
2. Click "Remote One" → see breadcrumb: `Home > Dashboard`
3. Navigate to Settings → see breadcrumb: `Home > Dashboard > Settings`
4. Click "Remote Two" → see breadcrumb: `Home > Overview`
5. Navigate to Details → see breadcrumb: `Home > Overview > Details`

- [ ] **Step 5: Commit any fixes if needed**

If any issues were found and fixed during verification, commit them.
