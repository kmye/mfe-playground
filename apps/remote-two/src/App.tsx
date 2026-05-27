import { Routes, Route, Link } from "react-router-dom";
import Overview from "./pages/Overview";
import Details from "./pages/Details";

export default function App() {
  return (
    <div>
      <nav>
        <Link to=".">Overview</Link> | <Link to="details">Details</Link>
      </nav>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="details" element={<Details />} />
      </Routes>
    </div>
  );
}
