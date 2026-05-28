import { Routes, Route, Link, Outlet } from "react-router-dom";
import type { PlatformUser } from "@mfe-poc/platform-types";
import Overview from "./pages/Overview";
import Details from "./pages/Details";

interface AppProps {
  user?: PlatformUser;
}

function Layout({ user }: { user?: PlatformUser }) {
  return (
    <div>
      <nav>
        <Link to=".">Overview</Link> | <Link to="details">Details</Link>
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
          <Route index element={<Overview />} />
          <Route path="details" element={<Details />} />
        </Route>
      </Routes>
    </div>
  );
}
