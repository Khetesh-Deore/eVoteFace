import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

export default function SuperAdminRoute({ children }) {
  const { user, token, isSuperAdmin, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!token || !user) return <Navigate to="/login" replace />;

  // Voter admin gets redirected to their own dashboard
  if (!isSuperAdmin) return <Navigate to="/voter-admin/dashboard" replace />;

  return children;
}
