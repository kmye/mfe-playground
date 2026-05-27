import { useEffect } from "react";
import { useHostSlots } from "@mfe-poc/host-slots";

export default function Dashboard() {
  const { setBreadcrumbs, setPageTitle } = useHostSlots();

  useEffect(() => {
    setBreadcrumbs([{ label: "Dashboard" }]);
    setPageTitle({ title: "Dashboard", subtitle: "Remote One" });
  }, [setBreadcrumbs, setPageTitle]);

  return <h2>Remote One — Dashboard</h2>;
}
