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
