import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user || isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
