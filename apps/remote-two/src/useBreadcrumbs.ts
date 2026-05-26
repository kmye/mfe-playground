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
