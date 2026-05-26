import { useBreadcrumbs } from "../useBreadcrumbs";

export default function Dashboard() {
  useBreadcrumbs([{ label: "Dashboard" }]);
  return <h2>Remote One — Dashboard</h2>;
}
