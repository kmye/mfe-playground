import { useEffect } from "react";
import { useHostSlots } from "@mfe-poc/host-slots";

export default function Settings() {
  const { setBreadcrumbs, setPageTitle } = useHostSlots();

  useEffect(() => {
    setBreadcrumbs([
      { label: "Dashboard", path: "/one" },
      { label: "Settings" },
    ]);
    setPageTitle({ title: "Settings", subtitle: "Remote One" });
  }, [setBreadcrumbs, setPageTitle]);

  return <h2>Remote One — Settings</h2>;
}
