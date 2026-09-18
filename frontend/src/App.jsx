import { Navigate, Route, Routes } from "react-router-dom";

// SecureRAG Frontend v1.1 - Dashboard Scrollbars & Profile Management
import ProtectedRoute from "./components/common/ProtectedRoute";
import { useAuth } from "./hooks/useAuth";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AuthPage from "./pages/AuthPage";
import EmployeeDashboardPage from "./pages/EmployeeDashboardPage";
import NotFoundPage from "./pages/NotFoundPage";

function HomeRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="screen-center">Loading workspace...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <Navigate to={user.role === "admin" ? "/admin" : "/employee"} replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/employee"
        element={
          <ProtectedRoute allowedRoles={["employee", "admin"]}>
            <EmployeeDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;

