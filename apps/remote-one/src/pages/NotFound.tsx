import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div>
      <h2>404 — Page Not Found</h2>
      <p>The page you're looking for doesn't exist.</p>
      <Link to=".">← Back to Dashboard</Link>
    </div>
  );
}
