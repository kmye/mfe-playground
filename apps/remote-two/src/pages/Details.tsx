import { useEffect } from "react";
import { eventBus } from "@mfe-poc/platform-sdk";

export default function Details() {
  useEffect(() => {
    eventBus.publish("breadcrumbs", [
      { label: "Overview", path: "/two" },
      { label: "Details" },
    ]);
  }, []);
  return <h2>Remote Two — Details</h2>;
}
