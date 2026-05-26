import { useBreadcrumbs } from "../useBreadcrumbs";

export default function Settings() {
  useBreadcrumbs([
    { label: "Dashboard", path: "/one" },
    { label: "Settings" },
  ]);
  return <h2>Remote One — Settings</h2>;
}
