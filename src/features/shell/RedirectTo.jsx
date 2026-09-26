import { Navigate, useLocation } from 'react-router';

/** Redirect that keeps the query string: it carries the selection (?s=&stack=). */
export function RedirectTo({ pathname }) {
  const { search } = useLocation();
  return <Navigate to={{ pathname, search }} replace />;
}
