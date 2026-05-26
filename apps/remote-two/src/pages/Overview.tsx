import { useBreadcrumbs } from "../useBreadcrumbs";

export default function Overview() {
  useBreadcrumbs([{ label: "Overview" }]);
  return <h2>Remote Two — Overview</h2>;
}
