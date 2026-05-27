import type { BreadcrumbItem, PageTitleData, SlotState } from "./types";

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
