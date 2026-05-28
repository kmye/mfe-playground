import { useParams, Link } from "react-router-dom";

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <h2>Item Detail — #{id}</h2>
      <p>You are viewing item <strong>{id}</strong>.</p>
      <p>This page demonstrates deep linking through the MF v2 bridge.</p>
      <Link to="/items">← Back to Items</Link>
    </div>
  );
}
