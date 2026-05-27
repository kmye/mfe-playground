import { useEffect } from "react";
import { useHostSlots } from "@mfe-poc/host-slots";

export default function Details() {
  const { setBreadcrumbs, setPageTitle } = useHostSlots();

  useEffect(() => {
    setBreadcrumbs([
      { label: "Overview", path: "/two" },
      { label: "Details" },
    ]);
    setPageTitle({ title: "Details", subtitle: "Remote Two" });
  }, [setBreadcrumbs, setPageTitle]);

  return <h2>Remote Two — Details</h2>;
}
