import { useBreadcrumbs } from "../useBreadcrumbs";

export default function Details() {
  useBreadcrumbs([
    { label: "Overview", path: "/two" },
    { label: "Details" },
  ]);
  return <h2>Remote Two — Details</h2>;
}
