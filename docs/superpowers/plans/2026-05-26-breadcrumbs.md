# Breadcrumbs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add breadcrumb navigation to the host that remotes can update dynamically via CustomEvent.

**Architecture:** Host listens for `mfe:breadcrumbs` CustomEvent on window, stores the payload in state, and renders a breadcrumb trail prepended with "Home". Remotes dispatch this event from a local `useBreadcrumbs` hook. Breadcrumbs reset when the active remote changes.

**Tech Stack:** React 19, React Router 7, CustomEvent API

---

## File Map

```
apps/host/src/
├── App.tsx              (modify — add Breadcrumbs, route-change reset)
├── Breadcrumbs.tsx      (create — renders breadcrumb trail)
└── useBreadcrumbListener.ts (create — listens for CustomEvent, manages state)

apps/remote-one/src/
├── useBreadcrumbs.ts    (create — dispatches CustomEvent)
├── pages/Dashboard.tsx  (modify — call useBreadcrumbs)
└── pages/Settings.tsx   (modify — call useBreadcrumbs)

apps/remote-two/src/
├── useBreadcrumbs.ts    (create — dispatches CustomEvent)
├── pages/Overview.tsx   (modify — call useBreadcrumbs)
└── pages/Details.tsx    (modify — call useBreadcrumbs)
```

---

### Task 1: Host — Breadcrumb Listener Hook

**Files:**
- Create: `apps/host/src/useBreadcrumbListener.ts`

- [ ] **Step 1: Create the hook file**

```typescript
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

interface BreadcrumbItem {
  label: string;
  path?: string;
}

export function useBreadcrumbListener(): BreadcrumbItem[] {
  const [remoteCrumbs, setRemoteCrumbs] = useState<BreadcrumbItem[]>([]);
  const location = useLocation();

  // Derive top-level route prefix (e.g., "/one", "/two", or "/")
  const topLevelPrefix = "/" + (location.pathname.split("/")[1] || "");

  // Reset remote breadcrumbs when the active remote changes
  useEffect(() => {
    setRemoteCrumbs([]);
  }, [topLevelPrefix]);

  // Listen for breadcrumb events from remotes
  useEffect(() => {
    function handleBreadcrumbs(event: Event) {
      const detail = (event as CustomEvent<BreadcrumbItem[]>).detail;
      setRemoteCrumbs(detail);
    }

    window.addEventListener("mfe:breadcrumbs", handleBreadcrumbs);
    return () => window.removeEventListener("mfe:breadcrumbs", handleBreadcrumbs);
  }, []);

  return remoteCrumbs;
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd apps/host && npx tsc --noEmit
```

Expected: No errors (or only pre-existing ones unrelated to this file).

- [ ] **Step 3: Commit**

```bash
git add apps/host/src/useBreadcrumbListener.ts
git commit -m "feat(host): add useBreadcrumbListener hook for breadcrumb events"
```

---

### Task 2: Host — Breadcrumbs Component

**Files:**
- Create: `apps/host/src/Breadcrumbs.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { Link } from "react-router-dom";
import { useBreadcrumbListener } from "./useBreadcrumbListener";

interface BreadcrumbItem {
  label: string;
  path?: string;
}

export default function Breadcrumbs() {
  const remoteCrumbs = useBreadcrumbListener();

  const allCrumbs: BreadcrumbItem[] = [
    { label: "Home", path: "/" },
    ...remoteCrumbs,
  ];

  // Last item is always text, others are links
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

- [ ] **Step 2: Verify it compiles**

```bash
cd apps/host && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/host/src/Breadcrumbs.tsx
git commit -m "feat(host): add Breadcrumbs component"
```

---

### Task 3: Host — Wire Breadcrumbs into App

**Files:**
- Modify: `apps/host/src/App.tsx`

- [ ] **Step 1: Update App.tsx to include Breadcrumbs**

Replace the entire content of `apps/host/src/App.tsx` with:

```tsx
import { Suspense } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { createRemoteComponent } from "./loadRemote";
import Breadcrumbs from "./Breadcrumbs";

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
      <Breadcrumbs />
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

- [ ] **Step 2: Verify build**

```bash
cd apps/host && pnpm build
```

Expected: Builds successfully.

- [ ] **Step 3: Commit**

```bash
git add apps/host/src/App.tsx
git commit -m "feat(host): wire Breadcrumbs into App layout"
```

---

### Task 4: Remote One — useBreadcrumbs Hook

**Files:**
- Create: `apps/remote-one/src/useBreadcrumbs.ts`

- [ ] **Step 1: Create the hook**

```typescript
import { useEffect } from "react";

interface BreadcrumbItem {
  label: string;
  path?: string;
}

export function useBreadcrumbs(items: BreadcrumbItem[]) {
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("mfe:breadcrumbs", { detail: items })
    );
  }, [JSON.stringify(items)]);
}
```

Note: `JSON.stringify(items)` as the dependency ensures the effect re-runs only when the actual breadcrumb content changes, avoiding infinite loops from new array references.

- [ ] **Step 2: Commit**

```bash
git add apps/remote-one/src/useBreadcrumbs.ts
git commit -m "feat(remote-one): add useBreadcrumbs hook"
```

---

### Task 5: Remote One — Wire Breadcrumbs into Pages

**Files:**
- Modify: `apps/remote-one/src/pages/Dashboard.tsx`
- Modify: `apps/remote-one/src/pages/Settings.tsx`

- [ ] **Step 1: Update Dashboard.tsx**

Replace the entire content of `apps/remote-one/src/pages/Dashboard.tsx` with:

```tsx
import { useBreadcrumbs } from "../useBreadcrumbs";

export default function Dashboard() {
  useBreadcrumbs([{ label: "Dashboard" }]);
  return <h2>Remote One — Dashboard</h2>;
}
```

- [ ] **Step 2: Update Settings.tsx**

Replace the entire content of `apps/remote-one/src/pages/Settings.tsx` with:

```tsx
import { useBreadcrumbs } from "../useBreadcrumbs";

export default function Settings() {
  useBreadcrumbs([
    { label: "Dashboard", path: "/one" },
    { label: "Settings" },
  ]);
  return <h2>Remote One — Settings</h2>;
}
```

- [ ] **Step 3: Verify build**

```bash
cd apps/remote-one && pnpm build
```

Expected: Builds successfully.

- [ ] **Step 4: Commit**

```bash
git add apps/remote-one/src/pages/Dashboard.tsx apps/remote-one/src/pages/Settings.tsx
git commit -m "feat(remote-one): dispatch breadcrumbs from pages"
```

---

### Task 6: Remote Two — useBreadcrumbs Hook

**Files:**
- Create: `apps/remote-two/src/useBreadcrumbs.ts`

- [ ] **Step 1: Create the hook**

```typescript
import { useEffect } from "react";

interface BreadcrumbItem {
  label: string;
  path?: string;
}

export function useBreadcrumbs(items: BreadcrumbItem[]) {
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("mfe:breadcrumbs", { detail: items })
    );
  }, [JSON.stringify(items)]);
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/remote-two/src/useBreadcrumbs.ts
git commit -m "feat(remote-two): add useBreadcrumbs hook"
```

---

### Task 7: Remote Two — Wire Breadcrumbs into Pages

**Files:**
- Modify: `apps/remote-two/src/pages/Overview.tsx`
- Modify: `apps/remote-two/src/pages/Details.tsx`

- [ ] **Step 1: Update Overview.tsx**

Replace the entire content of `apps/remote-two/src/pages/Overview.tsx` with:

```tsx
import { useBreadcrumbs } from "../useBreadcrumbs";

export default function Overview() {
  useBreadcrumbs([{ label: "Overview" }]);
  return <h2>Remote Two — Overview</h2>;
}
```

- [ ] **Step 2: Update Details.tsx**

Replace the entire content of `apps/remote-two/src/pages/Details.tsx` with:

```tsx
import { useBreadcrumbs } from "../useBreadcrumbs";

export default function Details() {
  useBreadcrumbs([
    { label: "Overview", path: "/two" },
    { label: "Details" },
  ]);
  return <h2>Remote Two — Details</h2>;
}
```

- [ ] **Step 3: Verify build**

```bash
cd apps/remote-two && pnpm build
```

Expected: Builds successfully.

- [ ] **Step 4: Commit**

```bash
git add apps/remote-two/src/pages/Overview.tsx apps/remote-two/src/pages/Details.tsx
git commit -m "feat(remote-two): dispatch breadcrumbs from pages"
```

---

### Task 8: Integration Verification

**Files:**
- None (verification only)

- [ ] **Step 1: Build all apps**

```bash
pnpm build
```

Expected: All 3 apps build successfully.

- [ ] **Step 2: Start all dev servers**

```bash
pnpm dev
```

- [ ] **Step 3: Verify breadcrumb behavior**

Open `http://localhost:3000` and check:

| Action | Expected breadcrumbs |
|--------|---------------------|
| Load `/` | `Home` (text only) |
| Click "Remote One" → `/one` | `Home` (link) > `Dashboard` (text) |
| Navigate to `/one/settings` (via remote nav) | `Home` (link) > `Dashboard` (link) > `Settings` (text) |
| Click "Remote Two" → `/two` | `Home` (link) > `Overview` (text) |
| Navigate to `/two/details` (via remote nav) | `Home` (link) > `Overview` (link) > `Details` (text) |
| Click "Home" link in breadcrumbs | Navigates to `/`, breadcrumbs show `Home` (text) |

- [ ] **Step 4: Verify standalone mode**

```bash
cd apps/remote-one && pnpm dev
```

Open `http://localhost:3001` — app works normally, no console errors from dispatching events with no listener.

- [ ] **Step 5: Final commit (if any cleanup needed)**

```bash
git add -A && git status
```

If clean, no commit needed. If there are changes, commit with appropriate message.

---

## Summary

| Task | What it does |
|------|-------------|
| 1 | Host hook: listens for CustomEvent, resets on route change |
| 2 | Host component: renders breadcrumb trail with link/text logic |
| 3 | Host App: wires Breadcrumbs into layout |
| 4-5 | Remote One: hook + pages dispatch breadcrumbs |
| 6-7 | Remote Two: hook + pages dispatch breadcrumbs |
| 8 | End-to-end verification |
