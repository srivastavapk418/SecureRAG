function Sidebar({ brand, tagline, children, footer }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark">EK</span>
        <div>
          <h2>{brand}</h2>
          <p>{tagline}</p>
        </div>
      </div>
      <div className="sidebar-scroll">{children}</div>
      {footer ? <div className="sidebar-footer">{footer}</div> : null}
    </aside>
  );
}

export default Sidebar;

