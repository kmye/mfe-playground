import { Suspense } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { createRemoteComponent } from "./loadRemote";
import VueWrapper from "./VueWrapper";
import SvelteWrapper from "./SvelteWrapper";

const RemoteOneApp = createRemoteComponent("remote_one", "App");
const RemoteTwoApp = createRemoteComponent("remote_two", "App");

export default function App() {
  return (
    <div>
      <h1>MFE Host</h1>
      <nav>
        <Link to="/one">Remote One</Link> | <Link to="/two">Remote Two</Link> |{" "}
        <Link to="/vue">Remote Vue</Link> |{" "}
        <Link to="/svelte">Remote Svelte</Link>
      </nav>
      <hr />
      <Suspense fallback={<p>Loading...</p>}>
        <Routes>
          <Route path="/" element={<p>Select a remote app above.</p>} />
          <Route path="/one/*" element={<RemoteOneApp />} />
          <Route path="/two/*" element={<RemoteTwoApp />} />
          <Route path="/vue/*" element={<VueWrapper />} />
          <Route path="/svelte/*" element={<SvelteWrapper />} />
        </Routes>
      </Suspense>
    </div>
  );
}
