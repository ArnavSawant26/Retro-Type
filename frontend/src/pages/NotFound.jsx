import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="fade-in" style={{ textAlign: "center", paddingTop: 60 }}>
    <h1 style={{ color: "var(--text-bright)" }}>Page not found</h1>
    <p style={{ color: "var(--text-dim)" }}>This address does not exist in Retro Type.</p>
    <Link className="btn btn-primary" to="/">RETURN HOME</Link>
  </div>
);

export default NotFound;
