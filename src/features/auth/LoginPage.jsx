import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { authErrorMessage } from '../../shared/auth/oauth';
import { useAuth } from '../../shared/auth/useAuth';
import { theme } from '../../shared/theme/theme';
import { layout } from '../../shared/ui/styles';

// Google's sign-in button, dark theme (its branding guidelines): the multicolour "G" on a near-black surface.
const googleButton = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: theme.space.md,
  padding: `${theme.space.sm} ${theme.space.lg}`, minHeight: 40, background: '#131314', color: '#e3e3e3',
  border: '1px solid #8e918f', borderRadius: theme.radius.sm, cursor: 'pointer', fontWeight: 600, fontSize: theme.font.sizeMd
};

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

/**
 * Google is the only way in (ADR-0020): the account is created the first time. In mock mode, where `signIn` exists, a
 * test-player field lets the E2E suite play as different players on the same tab.
 */
export function LoginPage() {
  const { user, signIn, signInWithGoogle } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const from = location.state?.from;
  const returnPath = from ? `${from.pathname}${from.search}` : '/';
  if (user) return <Navigate to={returnPath} replace />;

  const run = async action => {
    setError(null); setSubmitting(true);
    const { error } = await action();
    // On success Google takes over the page (or, in the mock, the session change redirects): only errors stay.
    setSubmitting(false);
    if (error) setError(authErrorMessage(error));
  };

  const box = { maxWidth: 360, margin: '10vh auto', padding: theme.space.xl, background: theme.colors.bgElevated,
    border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.md, display: 'flex', flexDirection: 'column', gap: theme.space.md };
  const field = { display: 'flex', flexDirection: 'column', gap: theme.space.xs, fontSize: theme.font.sizeSm, color: theme.colors.textMuted };
  const input = { padding: theme.space.sm, background: theme.colors.bg, color: theme.colors.text,
    border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.sm };
  const muted = { margin: 0, fontSize: theme.font.sizeSm, color: theme.colors.textMuted };

  return (
    <main style={box} aria-labelledby="login-title">
      <h1 id="login-title" style={{ margin: 0, fontFamily: theme.font.display, fontWeight: 400, fontSize: 40, letterSpacing: 2, color: theme.colors.accent }}>Spin Trainer</h1>
      <p style={muted}>Spin &amp; Go preflop ranges: explore them, train them and track your progress.</p>

      <button type="button" style={googleButton} disabled={submitting} onClick={() => run(() => signInWithGoogle(returnPath))}
        data-testid="login-google">
        <GoogleMark />Continue with Google
      </button>
      <p style={muted}>First time here? Your account is created when you continue with Google.</p>

      {signIn && (
        <form onSubmit={e => { e.preventDefault(); run(() => signIn(email)); }} aria-label="Test player"
          style={{ display: 'flex', flexDirection: 'column', gap: theme.space.sm, paddingTop: theme.space.md,
            borderTop: `1px dashed ${theme.colors.border}` }}>
          <label style={field}>
            Test player's email (mock mode)
            <input style={input} type="email" required value={email} onChange={e => setEmail(e.target.value)}
              data-testid="login-email" />
          </label>
          <button type="submit" style={layout.secondary} disabled={submitting} data-testid="login-submit">Sign in as this player</button>
        </form>
      )}

      <div role="status" aria-live="polite">
        {error && <small style={{ color: theme.colors.danger }} data-testid="login-error">{error}</small>}
      </div>
      <Link to="/privacy" style={{ ...muted, color: theme.colors.accent, alignSelf: 'center' }} data-testid="login-privacy">Privacy</Link>
    </main>
  );
}
