import { NavLink, Outlet, useLocation } from 'react-router';
import { useAuth } from '../auth/useAuth';
import { theme } from '../theme/theme';

export function Layout() {
  const { user, signOut } = useAuth();
  const { search } = useLocation();
  const header = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: theme.space.lg,
    padding: `${theme.space.md} ${theme.space.xl}`, borderBottom: `1px solid ${theme.colors.border}`,
    background: theme.colors.bgElevated, flexWrap: 'wrap'
  };
  const link = ({ isActive }) => ({
    color: isActive ? theme.colors.text : theme.colors.textMuted, textDecoration: 'none',
    fontWeight: isActive ? 700 : 500, borderBottom: `2px solid ${isActive ? theme.colors.accent : 'transparent'}`, paddingBottom: 2
  });
  return (
    <>
      <header style={header}>
        <strong>Spin Trainer</strong>
        <nav style={{ display: 'flex', gap: theme.space.lg }}>
          <NavLink to={{ pathname: '/explorer', search }} style={link}>Explorer</NavLink>
          <NavLink to={{ pathname: '/quiz', search }} style={link}>Quiz</NavLink>
          <NavLink to={{ pathname: '/builder', search }} style={link}>Builder</NavLink>
          <NavLink to={{ pathname: '/stats', search }} style={link}>Stats</NavLink>
        </nav>
        <div style={{ display: 'flex', gap: theme.space.md, alignItems: 'center' }}>
          <small style={{ color: theme.colors.textMuted }}>{user?.email}</small>
          <button onClick={signOut} style={{ background: 'transparent', color: theme.colors.textMuted,
            border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.sm,
            padding: `${theme.space.xs} ${theme.space.md}`, cursor: 'pointer' }}>Salir</button>
        </div>
      </header>
      <main style={{ padding: theme.space.xl, maxWidth: 1200, margin: '0 auto' }}>
        <Outlet />
      </main>
    </>
  );
}
