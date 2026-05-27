import { useEffect } from "react";
import { eventBus } from "@mfe-poc/platform-sdk";

export default function Dashboard() {
  useEffect(() => {
    eventBus.publish("breadcrumbs", [{ label: "Dashboard" }]);
  }, []);
  return <h2>Remote One — Dashboard</h2>;
}
