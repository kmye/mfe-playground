import { useEffect } from "react";
import { useHostSlots } from "@mfe-poc/host-slots";

export default function Overview() {
  const { setBreadcrumbs, setPageTitle } = useHostSlots();

  useEffect(() => {
    setBreadcrumbs([{ label: "Overview" }]);
    setPageTitle({ title: "Overview", subtitle: "Remote Two" });
  }, [setBreadcrumbs, setPageTitle]);

  return <h2>Remote Two — Overview</h2>;
}
