import Topbar from "./Topbar";

function AppShell({ sidebar, title, subtitle, actions, children }) {
  return (
    <div className="app-shell">
      {sidebar}
      <main className="app-main">
        <Topbar title={title} subtitle={subtitle} actions={actions} />
        <div className="app-main-content">{children}</div>
      </main>
    </div>
  );
}

export default AppShell;

