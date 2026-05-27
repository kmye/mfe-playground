import type { BreadcrumbItem, PageTitleData, SlotState } from "./types";

declare global {
  var __HOST_SLOTS_LOADED__: boolean | undefined;
}

if (globalThis.__HOST_SLOTS_LOADED__) {
  console.error(
    "[@mfe-poc/host-slots] Duplicate instance detected! " +
      "This means the store is not being shared as a singleton. " +
      'Ensure every app has `"@mfe-poc/host-slots": { singleton: true }` in its Module Federation shared config.'
  );
}
globalThis.__HOST_SLOTS_LOADED__ = true;

type Listener = (state: SlotState) => void;

let state: SlotState = {
  breadcrumbs: [],
  pageTitle: null,
};

const listeners = new Set<Listener>();

function notify() {
  for (const listener of listeners) {
    listener(state);
  }
}

export function getSlotState(): SlotState {
  return state;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setBreadcrumbs(items: BreadcrumbItem[]) {
  state = { ...state, breadcrumbs: items };
  notify();
}

export function clearBreadcrumbs() {
  state = { ...state, breadcrumbs: [] };
  notify();
}

export function setPageTitle(data: PageTitleData) {
  state = { ...state, pageTitle: data };
  notify();
}

export function clearPageTitle() {
  state = { ...state, pageTitle: null };
  notify();
}
