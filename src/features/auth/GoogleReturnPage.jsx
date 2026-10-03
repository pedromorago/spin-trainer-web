import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router';
import { authErrorMessage } from '../../shared/auth/authErrors';
import { forgetPending, readGoogleAnswer, readPending } from '../../shared/auth/googleSignIn';
import { useAuth } from '../../shared/auth/useAuth';
import { ErrorBox, Loading } from '../../shared/ui/Feedback';
import { theme } from '../../shared/theme/theme';

// Google's answer is handled once per page load. Signing in changes the user, which creates this page again
// (UserScope): the new one picks up the same exchange instead of reading an address already cleaned.
let handled = null;

function handleGoogleAnswer(signInWithIdToken) {
  if (!handled) {
    const answer = readGoogleAnswer(window.location.hash, readPending());
    // Neither the token nor the error stays in the address bar or the history; the state and nonce are used once.
    window.history.replaceState(window.history.state, '', window.location.pathname);
    forgetPending();
    const outcome = answer.error
      ? Promise.resolve({ error: answer.error })
      : signInWithIdToken(answer.token, answer.nonce).then(({ error }) => (error ? { error: authErrorMessage(error) } : { ok: true }));
    handled = { outcome, returnPath: answer.returnPath ?? '/' };
  }
  return handled;
}

/**
 * Where Google sends the browser back with an ID token (ADR-0023). Checks it answers the sign-in this tab started,
 * has Supabase exchange it for a session and goes on to the route the user was heading to; if Google reports an error,
 * or the answer is not this tab's, says so with a way back to the sign-in.
 */
export function GoogleReturnPage() {
  const { user, signInWithIdToken } = useAuth();
  const [result, setResult] = useState(null);

  useEffect(() => {
    let current = true;
    const { outcome, returnPath } = handleGoogleAnswer(signInWithIdToken);
    outcome.then(answer => { if (current) setResult({ ...answer, returnPath }); });
    return () => { current = false; };
  }, [signInWithIdToken]);

  if (result?.error) {
    return (
      <main style={{ maxWidth: 480, margin: '10vh auto', display: 'flex', flexDirection: 'column', gap: theme.space.md }}>
        <div role="alert"><ErrorBox error={{ title: 'Could not sign in', message: result.error }} /></div>
        <Link to="/login" replace style={{ color: theme.colors.accent }} data-testid="oauth-back">Back to sign-in</Link>
      </main>
    );
  }
  // Signing in from the landing page itself leads into the app, not back to the landing.
  if (result?.ok && user) return <Navigate to={result.returnPath === '/' ? '/explorer' : result.returnPath} replace />;
  return <main style={{ maxWidth: 480, margin: '10vh auto' }}><Loading /></main>;
}
