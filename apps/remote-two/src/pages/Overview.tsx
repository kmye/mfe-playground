import { useEffect } from "react";
import { eventBus } from "@mfe-poc/platform-sdk";

export default function Overview() {
  useEffect(() => {
    eventBus.publish("breadcrumbs", [{ label: "Overview" }]);
  }, []);
  return <h2>Remote Two — Overview</h2>;
}
