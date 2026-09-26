import { Navigate, useLocation } from 'react-router';
import { useAuth } from './useAuth';

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  // Guarda la ruta pedida (incluida la selección en ?s=&stack=) para volver tras el login.
  return user ? children : <Navigate to="/login" replace state={{ from: location }} />;
}
