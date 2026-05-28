import { registerRemotes } from "@module-federation/runtime";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

interface RemoteEntry {
  url: string;
  version: string;
}

interface ConfigResponse {
  remotes: Record<string, RemoteEntry>;
}

async function fetchConfig(): Promise<ConfigResponse> {
  const res = await fetch("/api/config");
  if (!res.ok) {
    throw new Error(`Failed to fetch config: ${res.status}`);
  }
  return res.json();
}

async function bootstrap() {
  const isDev = process.env.NODE_ENV === "development";

  if (!isDev) {
    const config = await fetchConfig();
    registerRemotes(
      Object.entries(config.remotes).map(([name, entry]) => ({
        name,
        entry: entry.url,
      }))
    );
  }

  const root = createRoot(document.getElementById("root")!);
  root.render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

bootstrap().catch((err) => {
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `<div style="padding: 2rem; color: red;">
      <h1>Failed to load application</h1>
      <p>${err.message}</p>
    </div>`;
  }
});
