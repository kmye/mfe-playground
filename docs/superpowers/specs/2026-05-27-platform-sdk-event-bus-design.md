# Platform SDK Event Bus Design

## Overview

Replace raw `CustomEvent`-based cross-app communication with a typed event bus, delivered as `@mfe-poc/platform-sdk` — the single onboarding dependency for any remote team integrating with the host application.

## Goals

1. **Multiple event types** — support breadcrumbs, notifications, auth state, and future cross-app communication without ad-hoc CustomEvent strings
2. **Type safety & DX** — full TypeScript inference on both publish and subscribe sides via a central event registry
3. **Decoupling & testability** — remotes communicate without knowing who listens; bus is testable in isolation
4. **Framework-agnostic** — core bus is pure TypeScript; React hooks are an optional convenience layer

## Architecture

### Package Structure

```
packages/platform-sdk/
├── package.json            # "@mfe-poc/platform-sdk"
├── tsconfig.json
└── src/
    ├── index.ts            # barrel: eventBus, types
    ├── event-bus/
    │   ├── bus.ts          # EventBusImpl class + singleton export
    │   └── types.ts        # EventMap, RequestMap, EventBus interface
    ├── react/
    │   └── index.ts        # useSubscribe, useRequest hooks
    └── types.ts            # shared platform types (BreadcrumbItem, User, etc.)
```

### Module Federation Integration

The SDK is a MF shared singleton — all apps declare it in their `shared` config:

```ts
'@mfe-poc/platform-sdk': { singleton: true, requiredVersion: '*' }
```

The host creates the singleton instance at module load time. MF guarantees all remotes receive the same instance at runtime. No MF plugin or rsbuild config needed for the SDK package itself.

### Access Patterns

```ts
// Framework-agnostic (Vue, Angular, Svelte, vanilla JS)
import { eventBus } from '@mfe-poc/platform-sdk';

// React convenience hooks (optional)
import { useSubscribe, useRequest } from '@mfe-poc/platform-sdk/react';
```

## API Design

### Type Registry

Events registered in this iteration: `breadcrumbs`. The others below are illustrative — teams add entries as they need new cross-app communication.

```ts
interface EventMap {
  'breadcrumbs': BreadcrumbItem[];
  // Future examples (not implemented this iteration):
  // 'notification': { message: string; level: 'info' | 'error' };
  // 'auth:logout': void;
}

interface RequestMap {
  // Future examples (not implemented this iteration):
  // 'get-user': { request: void; response: User };
  // 'get-config': { request: { key: string }; response: string | null };
}
```

### Bus Interface

```ts
interface EventBus {
  // Pub/sub (fire-and-forget)
  publish<K extends keyof EventMap>(event: K, payload: EventMap[K]): void;
  subscribe<K extends keyof EventMap>(event: K, handler: (payload: EventMap[K]) => void): () => void;

  // Request/response (awaitable)
  request<K extends keyof RequestMap>(type: K, payload?: RequestMap[K]['request'], timeoutMs?: number): Promise<RequestMap[K]['response']>;
  handle<K extends keyof RequestMap>(type: K, handler: (payload: RequestMap[K]['request']) => RequestMap[K]['response'] | Promise<RequestMap[K]['response']>): () => void;
}
```

### Key Behaviors

- `subscribe` and `handle` return unsubscribe functions for cleanup
- `request` throws immediately if no handler is registered (fail-fast)
- `request` rejects with timeout error after 5s (configurable per call)
- One handler per request type (last registered wins)
- Multiple subscribers per event (standard pub/sub)

## Implementation

### Core Bus (~80 LOC)

```ts
type Listener<T = any> = (payload: T) => void;
type Handler<Req = any, Res = any> = (payload: Req) => Res | Promise<Res>;

class EventBusImpl implements EventBus {
  private listeners = new Map<string, Set<Listener>>();
  private handlers = new Map<string, Handler>();

  publish<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    const set = this.listeners.get(event as string);
    if (set) set.forEach(fn => fn(payload));
  }

  subscribe<K extends keyof EventMap>(event: K, handler: Listener<EventMap[K]>): () => void {
    const key = event as string;
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    this.listeners.get(key)!.add(handler);
    return () => this.listeners.get(key)?.delete(handler);
  }

  async request<K extends keyof RequestMap>(
    type: K,
    payload?: RequestMap[K]['request'],
    timeoutMs = 5000
  ): Promise<RequestMap[K]['response']> {
    const handler = this.handlers.get(type as string);
    if (!handler) throw new Error(`No handler registered for "${String(type)}"`);
    return Promise.race([
      Promise.resolve(handler(payload)),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Request "${String(type)}" timed out`)), timeoutMs)
      ),
    ]);
  }

  handle<K extends keyof RequestMap>(
    type: K,
    handler: Handler<RequestMap[K]['request'], RequestMap[K]['response']>
  ): () => void {
    this.handlers.set(type as string, handler);
    return () => this.handlers.delete(type as string);
  }
}

export const eventBus: EventBus = new EventBusImpl();
```

### React Hooks

```ts
export function useSubscribe<K extends keyof EventMap>(
  event: K,
  handler: (payload: EventMap[K]) => void
) {
  useEffect(() => eventBus.subscribe(event, handler), [event]);
}

export function useRequest<K extends keyof RequestMap>(type: K, payload?: RequestMap[K]['request']) {
  const [data, setData] = useState<RequestMap[K]['response'] | null>(null);
  useEffect(() => { eventBus.request(type, payload).then(setData); }, [type]);
  return data;
}
```

## Migration

### What Changes

| Before | After |
|--------|-------|
| `apps/remote-*/src/useBreadcrumbs.ts` (CustomEvent dispatch) | `eventBus.publish('breadcrumbs', items)` |
| `apps/host/src/useBreadcrumbListener.ts` (CustomEvent listener) | `useSubscribe('breadcrumbs', setCrumbs)` |
| Ad-hoc `window.dispatchEvent` / `window.addEventListener` | Typed `eventBus.publish` / `eventBus.subscribe` |

### Files to Delete

- `apps/remote-one/src/useBreadcrumbs.ts`
- `apps/remote-two/src/useBreadcrumbs.ts`
- `apps/host/src/useBreadcrumbListener.ts`

## Testing

- **Unit tests:** Pure TypeScript tests for EventBusImpl — publish/subscribe delivery, request/response resolution, timeout behavior, unsubscribe cleanup, no-handler error
- **Integration:** Run `pnpm dev` and verify breadcrumbs still flow from remotes to host after migration (validates MF singleton behavior end-to-end)

## Future SDK Capabilities

The platform SDK is extensible. Future additions (not in scope for this iteration):
- Auth context / current user
- Feature flags
- Analytics event helpers
- Shared UI primitives (error boundaries, loading states)
