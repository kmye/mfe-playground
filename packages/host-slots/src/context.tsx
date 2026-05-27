import { useSyncExternalStore, type ReactNode } from "react";
import { getSlotState, subscribe } from "./store";
import type { SlotState } from "./types";

export function HostSlotsProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useSlotState(): SlotState {
  return useSyncExternalStore(subscribe, getSlotState, getSlotState);
}
