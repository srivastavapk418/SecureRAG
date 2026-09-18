import { useNavigate } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";

function Topbar({ title, subtitle, actions }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/auth", { replace: true });
  }

  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Enterprise knowledge workspace</p>
        <h1>{title}</h1>
        <p className="topbar-subtitle">{subtitle}</p>
      </div>
      <div className="topbar-actions">
        {actions}
        <div className="user-chip">
          <div className="user-chip-labels">
            <strong>{user?.name}</strong>
            <span>{user?.role}</span>
          </div>
          <button className="ghost-button" onClick={handleLogout} type="button">
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}

export default Topbar;

