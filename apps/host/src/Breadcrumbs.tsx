import { useState } from "react";
import { Link } from "react-router-dom";
import { useSubscribe } from "@mfe-poc/platform-sdk/react";
import type { BreadcrumbItem } from "@mfe-poc/platform-sdk";

export default function Breadcrumbs() {
  const [remoteCrumbs, setRemoteCrumbs] = useState<BreadcrumbItem[]>([]);

  useSubscribe("breadcrumbs", setRemoteCrumbs);

  const allCrumbs: BreadcrumbItem[] = [
    { label: "Home", path: "/" },
    ...remoteCrumbs,
  ];

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
