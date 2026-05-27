import {Routes, Route, Link, Outlet} from "react-router-dom";
import Overview from "./pages/Overview";
import Details from "./pages/Details";

function Layout() {
  return (
    <div>
      <nav>
        <Link to=".">Overview</Link> | <Link to="details">Details</Link>
      </nav>
        <Outlet />
    </div>
    );
}

export default function App() {
  return (
    <div>
      <Routes>
        <Route path='/' element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="details" element={<Details />} />
        </Route>
      </Routes>
    </div>
  );
}
