import { useState } from 'react';
import { Link } from 'react-router';
import { authErrorMessage } from '../../shared/auth/authErrors';
import { useAuth } from '../../shared/auth/useAuth';
import { BrandMark } from '../../shared/ui/BrandMark';
import { layout } from '../../shared/ui/styles';
import { theme } from '../../shared/theme/theme';

// Google's sign-in button, dark theme (its branding guidelines): the multicolour "G" on a near-black surface.
const googleButton = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: theme.space.md, width: '100%',
  padding: `${theme.space.md} ${theme.space.lg}`, minHeight: 48, background: '#131314', color: '#e3e3e3',
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

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false" style={{ flexShrink: 0, marginTop: 3 }}>
      <path d="M3 8.5l3 3 7-7" fill="none" stroke={theme.colors.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Signing in, the same on the sign-in page and in the landing page's dialog: Google is the only way in (ADR-0020,
 * ADR-0023), and the account is created the first time. In mock mode, where `signIn` exists, a test-player field lets
 * the E2E suite play as different players on the same tab.
 * Props: returnPath (where to go once signed in), headingId, headingLevel (1 on the page, 2 in the dialog)
 */
export function SignInCard({ returnPath, headingId, headingLevel = 1 }) {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const Heading = `h${headingLevel}`;

  const run = async action => {
    setError(null); setSubmitting(true);
    const { error } = await action();
    // On success Google takes over the page (or, in the mock, the session change moves on): only errors stay.
    setSubmitting(false);
    if (error) setError(authErrorMessage(error));
  };

  const muted = { margin: 0, fontSize: theme.font.sizeSm, color: theme.colors.textMuted, lineHeight: 1.5 };
  const field = { display: 'flex', flexDirection: 'column', gap: theme.space.xs, fontSize: theme.font.sizeSm, color: theme.colors.textMuted };
  const input = { padding: theme.space.sm, background: theme.colors.bg, color: theme.colors.text,
    border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.sm };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.space.lg }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: theme.space.md }}>
        <BrandMark size={44} />
        <span style={{ fontFamily: theme.font.display, fontSize: 26, letterSpacing: 2, color: theme.colors.accent }}>Spin Trainer</span>
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.space.sm }}>
        <Heading id={headingId} style={{ margin: 0, fontFamily: theme.font.display, fontWeight: 400, fontSize: 'clamp(32px, 5vw, 40px)',
          letterSpacing: 1.5, lineHeight: 1, color: theme.colors.text, textWrap: 'balance' }}>
          Sign in to keep training
        </Heading>
        <p style={{ ...muted, fontSize: theme.font.sizeMd }}>
          Your custom ranges, every answer and your progress, saved to your account.
        </p>
      </div>

      <button type="button" style={googleButton} disabled={submitting} onClick={() => run(() => signInWithGoogle(returnPath))}
        data-testid="login-google">
        <GoogleMark />Continue with Google
      </button>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: theme.space.sm }}>
        {[
          'Free, and no password: Google is the only way in.',
          'First time here? Your account is created when you continue.',
          'Only your email is kept, with your ranges and answers.'
        ].map(point => (
          <li key={point} style={{ ...muted, display: 'flex', gap: theme.space.sm, color: theme.colors.text }}><Check />{point}</li>
        ))}
      </ul>

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
      <p style={muted}>
        How your data is used: <Link to="/privacy" style={{ color: theme.colors.accent }} data-testid="login-privacy">Privacy</Link>
      </p>
    </div>
  );
}
