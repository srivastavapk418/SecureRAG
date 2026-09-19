import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Topbar from "./Topbar";

function AppShell({ sidebar, title, subtitle, actions, children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Automatically close mobile sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSidebarOpen]);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  // Inject isOpen and onClose props into sidebar component if valid React element
  const renderedSidebar = React.isValidElement(sidebar)
    ? React.cloneElement(sidebar, {
        isOpen: isSidebarOpen,
        onClose: closeSidebar,
      })
    : sidebar;

  return (
    <div className={`app-shell ${isSidebarOpen ? "sidebar-open" : ""}`}>
      {/* Mobile Drawer Backdrop */}
      <div
        className={`sidebar-backdrop ${isSidebarOpen ? "active" : ""}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />
      {renderedSidebar}
      <main className="app-main">
        <Topbar
          title={title}
          subtitle={subtitle}
          actions={actions}
          onToggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
        />
        <div className="app-main-content">{children}</div>
      </main>
    </div>
  );
}

export default AppShell;

