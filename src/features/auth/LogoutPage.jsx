import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { useAuth } from '../../shared/auth/useAuth';
import { ErrorBox, Loading } from '../../shared/ui/Feedback';
import { theme } from '../../shared/theme/theme';

/**
 * "Sign out" navigates here instead of signing out on the spot: the navigation goes through the unsaved-changes guard
 * (useUnsavedChanges), so leaving with a range half painted asks first. Signing in again goes back to where the user
 * was (the route and the selection). The demo has nobody to sign out (ADR-0022): this address leads home.
 */
export function LogoutPage() {
  const { user, signOut, demo } = useAuth();
  const from = useLocation().state?.from;
  const started = useRef(false);
  const [error, setError] = useState(null);

  const run = () => {
    setError(null);
    signOut().then(result => { if (result?.error) setError(result.error); });
  };
  useEffect(() => {
    if (demo || !user || started.current) return;
    started.current = true;
    run();
  });

  if (demo) return <Navigate to="/" replace />;
  if (!user) return <Navigate to="/login" replace state={from ? { from } : undefined} />;
  return (
    <div style={{ maxWidth: 480, margin: '10vh auto', display: 'flex', flexDirection: 'column', gap: theme.space.md }}>
      {error ? (
        <>
          <ErrorBox error={{ title: 'Could not sign out', message: error.message }} onRetry={run} />
          <Link to="/" style={{ color: theme.colors.accent }}>Back</Link>
        </>
      ) : <Loading />}
    </div>
  );
}
