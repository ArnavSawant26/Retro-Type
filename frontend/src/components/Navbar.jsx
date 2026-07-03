import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="nav-inner">
        {/* Brand */}
        <NavLink to="/" className="nav-brand">
          <span className="brand-icon">⌨</span>
          <span className="brand-text">RETRO<span className="brand-accent">TYPE</span></span>
        </NavLink>

        {/* Links */}
        <div className="nav-links">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} end>
            Home
          </NavLink>
          <NavLink to="/leaderboard" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            Leaderboard
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            About
          </NavLink>
        </div>

        {/* Auth */}
        <div className="nav-auth">
          <NavLink
            to="/settings"
            className={({ isActive }) => `nav-settings-button ${isActive ? "active" : ""}`}
            aria-label="Appearance settings"
          >
            <span aria-hidden="true">⚙</span>
            <span className="nav-settings-label">Settings</span>
          </NavLink>
          {user ? (
            <>
              <NavLink to="/settings" className={({ isActive }) => `nav-link nav-user ${isActive ? "active" : ""}`}>
                <span className="user-avatar">{user.username[0].toUpperCase()}</span>
                {user.username}
              </NavLink>
              <button className="nav-logout" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <NavLink to="/login" className="btn btn-primary nav-login-btn">
              Login
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
