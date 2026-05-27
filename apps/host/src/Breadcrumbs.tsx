import { Link } from "react-router-dom";
import { useSlotState, type BreadcrumbItem } from "@mfe-poc/host-slots";

export default function Breadcrumbs() {
  const { breadcrumbs } = useSlotState();

  const allCrumbs: BreadcrumbItem[] = [
    { label: "Home", path: "/" },
    ...breadcrumbs,
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
