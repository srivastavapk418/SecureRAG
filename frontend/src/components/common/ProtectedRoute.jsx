import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="screen-center">Loading secure workspace...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/employee"} replace />;
  }

  return children;
}

export default ProtectedRoute;

