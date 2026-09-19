function Sidebar({ brand, tagline, children, footer, isOpen = false, isCollapsed = false, onClose }) {
  const handleContentClick = (e) => {
    // Only auto-close on mobile/tablet when selecting a session or clicking an action
    if (typeof window !== "undefined" && window.innerWidth <= 1024) {
      if (e.target.closest("button, .sidebar-session-item, .sidebar-card")) {
        if (e.target.closest(".sidebar-trash-btn")) return;
        onClose?.();
      }
    }
  };

  return (
    <aside
      className={`sidebar ${isOpen ? "sidebar-mobile-open" : ""} ${isCollapsed ? "sidebar-collapsed" : ""}`}
      aria-label="Main Navigation"
    >
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark">EK</span>
        <div className="sidebar-brand-text">
          <h2>{brand}</h2>
          <p>{tagline}</p>
        </div>
        <button
          type="button"
          className="sidebar-close-btn sidebar-mobile-close-btn"
          onClick={onClose}
          aria-label="Close navigation sidebar"
          title="Close sidebar"
        >
          ✕
        </button>
      </div>
      <div className="sidebar-scroll custom-scrollbar" onClick={handleContentClick}>{children}</div>
      {footer ? <div className="sidebar-footer">{footer}</div> : null}
    </aside>
  );
}

export default Sidebar;

