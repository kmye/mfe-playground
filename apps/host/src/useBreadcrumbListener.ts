import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

interface BreadcrumbItem {
  label: string;
  path?: string;
}

export function useBreadcrumbListener(): BreadcrumbItem[] {
  const [remoteCrumbs, setRemoteCrumbs] = useState<BreadcrumbItem[]>([]);
  const location = useLocation();

  const topLevelPrefix = "/" + (location.pathname.split("/")[1] || "");

  useEffect(() => {
    setRemoteCrumbs([]);
  }, [topLevelPrefix]);

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
