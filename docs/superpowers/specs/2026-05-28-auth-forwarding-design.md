# Auth Forwarding: Props/Init Options at Mount Time

## Problem

The MFE host shell authenticates users via an external IdP (OAuth2/OIDC), but remote micro-frontends have no way to access user identity data (name, email) for display purposes.

## Decision

Pass user data from the host to each remote at mount time — as a React prop for React remotes and as a mount option for Vue/Svelte remotes.

## Constraints

- Remotes only need display data: name and email
- All API calls go through the BFF proxy — remotes never touch tokens
- Must work across React, Vue, and Svelte remotes equally
- Remotes are passive consumers — no auth actions (logout, refresh)
- External remotes (outside monorepo) must be supported

## User Data Contract

A minimal interface shared across all apps:

```typescript
interface PlatformUser {
  name: string;
  email: string;
}
```

- Internal monorepo apps import from `@mfe-poc/platform-types` (workspace package)
- External remotes duplicate the interface locally (4 lines, no registry dependency)

## Shared Types Package

```
packages/platform-types/
├── package.json        # name: @mfe-poc/platform-types
├── tsconfig.json
└── src/
    └── index.ts        # exports PlatformUser interface
```

- Zero runtime code — type-only, erased at build time
- Not a Module Federation shared dependency (compile-time only)
- Not published to any registry
- Consumed via `"@mfe-poc/platform-types": "workspace:*"`

## Host-Side Flow

1. Host authenticates with external IdP
2. Host obtains user profile (`{ name, email }`) — mechanism is outside this spec's scope
3. Host holds user in React state
4. Host passes user to remotes at mount time
5. Until user is available, remote mount points show a loading fallback (Suspense)
6. If user fetch fails, host handles it (redirect to login / error page) — remotes never mount without valid user

### Host mounting React remotes

```tsx
<Route path="/one/*" element={<RemoteOneApp user={user} />} />
<Route path="/two/*" element={<RemoteTwoApp user={user} />} />
```

### Host mounting Vue/Svelte remotes via wrappers

```tsx
// VueWrapper.tsx
function VueWrapper({ user }: { user?: PlatformUser }) {
  useEffect(() => {
    loadRemote("remote_vue/App").then((mod) => {
      mod.mount(containerRef.current, { basePath: "/vue", user });
    });
  }, []);
}

// SvelteWrapper.tsx — same pattern
function SvelteWrapper({ user }: { user?: PlatformUser }) {
  useEffect(() => {
    loadRemote("remote_svelte/App").then((mod) => {
      mod.mount(containerRef.current, { basePath: "/svelte", user });
    });
  }, []);
}
```

### Host routes

```tsx
<Route path="/vue/*" element={<VueWrapper user={user} />} />
<Route path="/svelte/*" element={<SvelteWrapper user={user} />} />
```

## Remote-Side Consumption

### React remotes (remote-one, remote-two)

```typescript
import type { PlatformUser } from '@mfe-poc/platform-types';

interface AppProps {
  user?: PlatformUser;
}

export default function App({ user }: AppProps) {
  // user.name and user.email available for display
  // pass deeper via props or a local React context
}
```

### Vue remote

```typescript
import type { PlatformUser } from '@mfe-poc/platform-types';

export function mount(el: HTMLElement, opts?: { basePath?: string; user?: PlatformUser }) {
  app = createApp(App, { user: opts?.user });
  const router = createAppRouter(opts?.basePath ?? "/");
  app.use(router);
  app.mount(el);
}
```

Vue components access user via root prop or `provide/inject` for deeper nesting.

### Svelte remote

```typescript
import type { PlatformUser } from '@mfe-poc/platform-types';

export function mount(el: HTMLElement, opts?: { basePath?: string; user?: PlatformUser }) {
  // pass user as prop to root Svelte component
}
```

### Key principle

The `user` prop/option is always optional. Remotes degrade gracefully:
- With user → display name/email
- Without user (standalone dev, tests) → skip user-specific UI or show placeholder

## Out of Scope

- How the host authenticates with the IdP
- Token management (BFF owns this)
- Bidirectional communication (remotes cannot trigger auth actions)
- Reactive updates to user data mid-session (not needed for display-only)
- Publishing `@mfe-poc/platform-types` to a registry (premature for current scale)

## Evolution Path

| Trigger | Migration |
|---|---|
| Need reactive updates (org switch, email change) | Add callback prop: `onUserChange?: (cb) => unsubscribe` |
| Remotes need to trigger logout | Add `actions` prop: `{ logout: () => void }` |
| External remotes multiply, contract grows | Publish `@mfe-poc/platform-types` to private registry |
| BFF gains session management | Add `/api/auth/me` as supplementary verification endpoint |

Each evolution step is additive — nothing in this design needs to be torn out.

## Rejected Alternatives

| Approach | Reason for rejection |
|---|---|
| Host exposes `./platform-sdk` via MF | Circular dependency, breaks standalone dev, hard for non-React remotes |
| Custom Events on `window` | Race conditions, no type safety, memory leak risk |
| Each remote calls `/api/auth/me` | Requires BFF session management (new infrastructure), N+1 requests, flash of unauthenticated content |
| MF `beforeInitContainer` hook | Underdocumented, one-shot only, unclear consumption path in remotes |
| MF shared singleton module | Version coupling, timing issues on population, standalone dev breaks |
