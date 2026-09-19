import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Topbar from "./Topbar";

function AppShell({ sidebar, title, subtitle, actions, children }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const location = useLocation();

  // Automatically close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Close sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (isMobileOpen) setIsMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen]);

  const toggleSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth <= 1024) {
      setIsMobileOpen((prev) => !prev);
    } else {
      setIsDesktopCollapsed((prev) => !prev);
    }
  };

  const closeSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth <= 1024) {
      setIsMobileOpen(false);
    } else {
      setIsDesktopCollapsed(true);
    }
  };

  // Inject isOpen, isCollapsed, and onClose props into sidebar component if valid React element
  const renderedSidebar = React.isValidElement(sidebar)
    ? React.cloneElement(sidebar, {
        isOpen: isMobileOpen,
        isCollapsed: isDesktopCollapsed,
        onClose: closeSidebar,
      })
    : sidebar;

  return (
    <div
      className={`app-shell ${isMobileOpen ? "sidebar-mobile-open" : ""} ${
        isDesktopCollapsed ? "sidebar-collapsed" : ""
      }`}
    >
      {/* Mobile Drawer Backdrop */}
      <div
        className={`sidebar-backdrop ${isMobileOpen ? "active" : ""}`}
        onClick={() => setIsMobileOpen(false)}
        aria-hidden="true"
      />
      {renderedSidebar}
      <main className="app-main">
        <Topbar
          title={title}
          subtitle={subtitle}
          actions={actions}
          onToggleSidebar={toggleSidebar}
          isSidebarOpen={!isDesktopCollapsed}
          isMobileOpen={isMobileOpen}
        />
        <div className="app-main-content">{children}</div>
      </main>
    </div>
  );
}

export default AppShell;

