import { Navigate } from 'react-router';
import { useAuth } from './useAuth';

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}
