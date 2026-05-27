import { Suspense } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { HostSlotsProvider, useSlotState } from "@mfe-poc/host-slots";
import { createRemoteComponent } from "./loadRemote";
import Breadcrumbs from "./Breadcrumbs";

const RemoteOneApp = createRemoteComponent("remote_one", "App");
const RemoteTwoApp = createRemoteComponent("remote_two", "App");

function PageTitle() {
  const { pageTitle } = useSlotState();
  if (!pageTitle) return null;
  return (
    <header>
      <h2>{pageTitle.title}</h2>
      {pageTitle.subtitle && <p>{pageTitle.subtitle}</p>}
    </header>
  );
}

export default function App() {
  return (
    <HostSlotsProvider>
      <div>
        <h1>MFE Host</h1>
        <nav>
          <Link to="/one">Remote One</Link> |{" "}
          <Link to="/two">Remote Two</Link>
        </nav>
        <hr />
        <Breadcrumbs />
        <PageTitle />
        <hr />
        <Suspense fallback={<p>Loading...</p>}>
          <Routes>
            <Route path="/" element={<p>Select a remote app above.</p>} />
            <Route path="/one/*" element={<RemoteOneApp />} />
            <Route path="/two/*" element={<RemoteTwoApp />} />
          </Routes>
        </Suspense>
      </div>
    </HostSlotsProvider>
  );
}
