import { useEffect, useRef } from "react";
import {
  setBreadcrumbs,
  clearBreadcrumbs,
  setPageTitle,
  clearPageTitle,
} from "./store";
import type { BreadcrumbItem, PageTitleData } from "./types";

export function useHostSlots() {
  const activeSlots = useRef<Set<string>>(new Set());

  useEffect(() => {
    return () => {
      if (activeSlots.current.has("breadcrumbs")) {
        clearBreadcrumbs();
      }
      if (activeSlots.current.has("pageTitle")) {
        clearPageTitle();
      }
    };
  }, []);

  function set(items: BreadcrumbItem[]) {
    activeSlots.current.add("breadcrumbs");
    setBreadcrumbs(items);
  }

  function setTitle(data: PageTitleData) {
    activeSlots.current.add("pageTitle");
    setPageTitle(data);
  }

  return { setBreadcrumbs: set, setPageTitle: setTitle };
}
