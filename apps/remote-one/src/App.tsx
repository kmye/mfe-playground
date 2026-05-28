import {Routes, Route, Link, Outlet} from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Items from "./pages/Items";
import ItemDetail from "./pages/ItemDetail";

function Layout() {
  return (
    <div>
      <nav>
        <Link to=".">Dashboard</Link> | <Link to="settings">Settings</Link> | <Link to="items">Items</Link>
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
          <Route index element={<Dashboard />} />
          <Route path="settings" element={<Settings />} />
          <Route path="items" element={<Items />} />
          <Route path="items/:id" element={<ItemDetail />} />
        </Route>
      </Routes>
    </div>
  );
}
