import { Navigate, useLocation } from 'react-router';
import { useAuth } from './useAuth';

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  // Saves the requested route (including the selection in ?s=&stack=) to come back to it after login.
  return user ? children : <Navigate to="/login" replace state={{ from: location }} />;
}
