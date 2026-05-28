import { Routes, Route, Link, Outlet } from "react-router-dom";
import type { PlatformUser } from "@mfe-poc/platform-types";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";

interface AppProps {
  user?: PlatformUser;
}

function Layout({ user }: { user?: PlatformUser }) {
  return (
    <div>
      <nav>
        <Link to=".">Dashboard</Link> | <Link to="settings">Settings</Link>
        {user && <span style={{ float: "right" }}>{user.name} ({user.email})</span>}
      </nav>
      <Outlet />
    </div>
  );
}

export default function App({ user }: AppProps) {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Layout user={user} />}>
          <Route index element={<Dashboard />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </div>
  );
}
