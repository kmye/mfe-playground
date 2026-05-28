import { Link } from "react-router-dom";

const items = [
  { id: 1, name: "Widget Alpha" },
  { id: 2, name: "Widget Beta" },
  { id: 3, name: "Widget Gamma" },
  { id: 4, name: "Widget Delta" },
  { id: 5, name: "Widget Epsilon" },
];

export default function Items() {
  return (
    <div>
      <h2>Items</h2>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <Link to={`/items/${item.id}`}>{item.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
