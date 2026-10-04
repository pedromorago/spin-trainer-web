import { Link, Navigate, useLocation } from 'react-router';
import { useAuth } from '../../shared/auth/useAuth';
import { theme } from '../../shared/theme/theme';
import { ShowcaseChart } from '../landing/ShowcaseChart';
import { SignInCard } from './SignInCard';

const gutter = `clamp(${theme.space.md}, 4vw, ${theme.space.xl})`;

/**
 * The sign-in page, for whoever opens a page of the app signed out (the landing page signs in in a dialog instead):
 * the sign-in card beside a live example range, a way back home, and back to the requested route afterwards.
 */
export function LoginPage() {
  const { user } = useAuth();
  const location = useLocation();
  const from = location.state?.from;
  const returnPath = from ? `${from.pathname}${from.search}` : '/explorer';
  if (user) return <Navigate to={returnPath} replace />;

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: `${theme.space.xl} ${gutter}` }}>
      <div style={{ width: '100%', maxWidth: 1040, display: 'grid', gap: 48, alignItems: 'center',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))' }}>
        <main aria-labelledby="login-title" style={{ display: 'flex', flexDirection: 'column', gap: theme.space.lg, maxWidth: 440,
          padding: theme.space.xl, background: theme.colors.bgElevated, border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.lg }}>
          <SignInCard returnPath={returnPath} headingId="login-title" />
          <Link to="/" style={{ color: theme.colors.textMuted, fontSize: theme.font.sizeSm }} data-testid="login-home">
            ← Back to home
          </Link>
        </main>
        <aside aria-label="An example range" style={{ minWidth: 0 }}>
          <ShowcaseChart caption="Your ranges, your answers, your progress" />
        </aside>
      </div>
    </div>
  );
}
