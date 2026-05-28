import { Suspense, useState } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import { createRemoteComponent } from "./loadRemote";
import VueWrapper from "./VueWrapper";
import SvelteWrapper from "./SvelteWrapper";
import type { PlatformUser } from "@mfe-poc/platform-types";

const RemoteOneApp = createRemoteComponent("remote_one", "App");
const RemoteTwoApp = createRemoteComponent("remote_two", "App");

const navItems = [
  { to: "/one", label: "Remote One" },
  { to: "/two", label: "Remote Two" },
  { to: "/vue", label: "Remote Vue" },
  { to: "/svelte", label: "Remote Svelte" },
];

// Hardcoded mock user for development — replace with real IdP integration
const mockUser: PlatformUser = {
  name: "Jane Developer",
  email: "jane@example.com",
};

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user] = useState<PlatformUser>(mockUser);

  return (
    <div className="flex h-screen flex-col">
      {/* Navbar */}
      <header className="flex h-14 items-center border-b border-gray-200 bg-white px-4 shadow-sm">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="mr-4 rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          aria-label="Toggle sidebar"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-gray-900">MFE Host</h1>
        <span className="ml-auto text-sm text-gray-500">{user.name}</span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "w-56" : "w-0"
          } flex-shrink-0 overflow-hidden border-r border-gray-200 bg-gray-50 transition-all duration-200`}
        >
          <nav className="flex flex-col gap-1 p-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <p className="text-gray-500">Loading...</p>
              </div>
            }
          >
            <Routes>
              <Route
                path="/"
                element={
                  <div className="flex items-center justify-center py-12">
                    <p className="text-gray-500">
                      Select a remote app from the sidebar.
                    </p>
                  </div>
                }
              />
              <Route path="/one/*" element={<RemoteOneApp user={user} />} />
              <Route path="/two/*" element={<RemoteTwoApp user={user} />} />
              <Route path="/vue/*" element={<VueWrapper user={user} />} />
              <Route path="/svelte/*" element={<SvelteWrapper user={user} />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
