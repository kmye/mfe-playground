import { useEffect } from "react";
import { eventBus } from "@mfe-poc/platform-sdk";

export default function Settings() {
  useEffect(() => {
    eventBus.publish("breadcrumbs", [
      { label: "Dashboard", path: "/one" },
      { label: "Settings" },
    ]);
  }, []);
  return <h2>Remote One — Settings</h2>;
}
