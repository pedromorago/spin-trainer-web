import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { forgetReturnPath, readReturnPath } from '../../shared/auth/oauth';
import { useAuth } from '../../shared/auth/useAuth';
import { ErrorBox, Loading } from '../../shared/ui/Feedback';
import { theme } from '../../shared/theme/theme';

/**
 * Where Google sends the user back (through Supabase) with a one-time code (ADR-0019). Exchanges it for a session and
 * goes on to the route the user was heading to; if Google reports an error or the code is not valid, says so with a
 * way back to the login.
 */
export function AuthCallbackPage() {
  const { user, completeOAuth } = useAuth();
  const { search } = useLocation();
  const [returnPath] = useState(readReturnPath);
  const [result, setResult] = useState(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    completeOAuth(search).then(result => {
      if (!result.error) forgetReturnPath();
      setResult(result);
    });
  }, [completeOAuth, search]);

  if (result?.error) {
    return (
      <main style={{ maxWidth: 480, margin: '10vh auto', display: 'flex', flexDirection: 'column', gap: theme.space.md }}>
        <div role="alert"><ErrorBox error={{ title: 'Could not sign in', message: result.error }} /></div>
        <Link to="/login" replace style={{ color: theme.colors.accent }} data-testid="oauth-back">Back to sign-in</Link>
      </main>
    );
  }
  // Signing in from the landing page itself leads into the app, not back to the landing.
  if (result && user) return <Navigate to={returnPath === '/' ? '/explorer' : returnPath} replace />;
  return <main style={{ maxWidth: 480, margin: '10vh auto' }}><Loading /></main>;
}
