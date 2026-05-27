# Breadcrumbs — Design Spec

## Overview

Add breadcrumb navigation to the host shell that remotes can update dynamically. The host owns the base breadcrumb ("Home"), and remotes extend it with their own trail via a CustomEvent. Remotes can update breadcrumbs at any time (on route change or after async data loads).

## Event Contract

**Event name:** `mfe:breadcrumbs`

**Payload shape** (defined locally in each app):

```typescript
interface BreadcrumbItem {
  label: string;
  path?: string; // If omitted, item renders as text (current page)
}
```

**Dispatch example:**
```typescript
window.dispatchEvent(new CustomEvent("mfe:breadcrumbs", {
  detail: [
    { label: "Dashboard", path: "/one" },
    { label: "Settings" }
  ]
}));
```

No shared packages or build-time coupling. Each app types its own side of the contract.

## Host Behavior

### State

- **Base breadcrumb:** Always `{ label: "Home", path: "/" }` — hardcoded in host.
- **Remote breadcrumbs:** Array from last `mfe:breadcrumbs` event. Stored in React state. Reset to `[]` when the top-level route changes (user switches remotes or navigates to `/`).

### Listener

Host adds a `window` event listener for `mfe:breadcrumbs` on mount. Updates state with `event.detail`.

### Rendering Rules

- All items except the last render as clickable `<Link>` elements.
- The last item renders as plain text.
- If no remote breadcrumbs exist, only "Home" is shown as text.
- If remote breadcrumbs exist, "Home" becomes a link.

### Examples

| Route | Remote dispatches | Rendered |
|-------|------------------|----------|
| `/` | nothing | `Home` (text) |
| `/one` | `[{label: "Dashboard"}]` | `Home` (link) > `Dashboard` (text) |
| `/one/settings` | `[{label: "Dashboard", path: "/one"}, {label: "Settings"}]` | `Home` (link) > `Dashboard` (link) > `Settings` (text) |

### Component Location

New `Breadcrumbs` component in the host, rendered above the `<Routes>` outlet in `App.tsx`.

### Cleanup

When the top-level route changes (detected via React Router's `useLocation`), remote breadcrumbs reset to `[]`. No cleanup event from the remote is needed.

## Remote Behavior

### Hook

Each remote implements a local `useBreadcrumbs` hook:

```typescript
function useBreadcrumbs(items: BreadcrumbItem[]) {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("mfe:breadcrumbs", { detail: items }));
  }, [items]);
}
```

### Usage

Each page calls `useBreadcrumbs` with its trail:

```tsx
// Dashboard (root page of remote)
useBreadcrumbs([{ label: "Dashboard" }]);

// Settings (sub-page)
useBreadcrumbs([
  { label: "Dashboard", path: "/one" },
  { label: "Settings" },
]);
```

### Dynamic Updates

Remotes can call `useBreadcrumbs` with updated data at any time:

```tsx
useBreadcrumbs(user
  ? [{ label: "Users", path: "/one" }, { label: user.name }]
  : [{ label: "Users", path: "/one" }, { label: "Loading..." }]
);
```

### Standalone Mode

When a remote runs in isolation (no host), events fire harmlessly — no errors, no side effects.

## Files Affected

- `apps/host/src/Breadcrumbs.tsx` — new component
- `apps/host/src/App.tsx` — add Breadcrumbs above Routes, reset on route change
- `apps/remote-one/src/useBreadcrumbs.ts` — new hook
- `apps/remote-one/src/pages/Dashboard.tsx` — call useBreadcrumbs
- `apps/remote-one/src/pages/Settings.tsx` — call useBreadcrumbs
- `apps/remote-two/src/useBreadcrumbs.ts` — new hook
- `apps/remote-two/src/pages/Overview.tsx` — call useBreadcrumbs
- `apps/remote-two/src/pages/Details.tsx` — call useBreadcrumbs

## Out of Scope

- Styling/CSS (basic inline or minimal styles sufficient for POC)
- Accessibility (aria-label on nav, aria-current on last item — nice to have, not required)
- Breadcrumb persistence across page refreshes
- Nested remote routing beyond two levels
