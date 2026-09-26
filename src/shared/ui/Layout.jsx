import { NavLink, useLocation } from 'react-router';
import { SessionScore } from './SessionScore';
import { theme } from '../theme/theme';

const TABS = [['/explorer', 'Explorer'], ['/quiz', 'Quiz'], ['/builder', 'Builder'], ['/stats', 'Stats']];
// Same width and margins for the selection bar and the content.
const gutter = `clamp(${theme.space.md}, 4vw, ${theme.space.xl})`;
const container = { maxWidth: 1200, margin: '0 auto', padding: `0 ${gutter}` };

/**
 * App frame. Presentation only: receives the user, session scoreboard and selection bar via props.
 * Props: user, onSignOut, score ({ accuracy, streak, total }), toolbar (node), children
 */
export function Layout({ user, onSignOut, score, toolbar, children }) {
  const { search } = useLocation();
  const header = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: theme.space.lg, flexWrap: 'wrap',
    padding: `${theme.space.md} ${gutter}`, borderBottom: `1px solid ${theme.colors.border}`,
    background: 'rgba(11, 14, 19, 0.72)', backdropFilter: 'blur(8px)', zIndex: 10
  };
  const link = ({ isActive }) => ({
    color: isActive ? theme.colors.accentStrong : theme.colors.textMuted, textDecoration: 'none',
    fontFamily: theme.font.display, fontSize: 20, letterSpacing: 1,
    borderBottom: `2px solid ${isActive ? theme.colors.accent : 'transparent'}`, paddingBottom: 2
  });
  return (
    <>
      {/* Sticky at the top only on wide screens (global.css): on mobile it would take up half the screen. */}
      <header className="app-header" style={header}>
        <span style={{ fontFamily: theme.font.display, fontSize: 28, letterSpacing: 2, color: theme.colors.accent }}>Spin Trainer</span>
        {/* Navigation keeps the selection (?s=&stack=) when switching tabs. */}
        <nav style={{ display: 'flex', gap: theme.space.lg }} aria-label="Secciones">
          {TABS.map(([path, label]) => <NavLink key={path} to={{ pathname: path, search }} style={link}>{label}</NavLink>)}
        </nav>
        <SessionScore {...score} />
        <div style={{ display: 'flex', gap: theme.space.md, alignItems: 'center' }}>
          <small style={{ color: theme.colors.textMuted }}>{user?.email}</small>
          <button type="button" onClick={onSignOut} style={{ background: 'transparent', color: theme.colors.textMuted,
            border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.sm,
            padding: `${theme.space.xs} ${theme.space.md}`, cursor: 'pointer' }}>Salir</button>
        </div>
      </header>
      {toolbar && (
        <div style={{ padding: `${theme.space.md} 0`, borderBottom: `1px solid ${theme.colors.borderSubtle}` }}>
          <div style={container}>{toolbar}</div>
        </div>
      )}
      <main style={{ ...container, paddingTop: theme.space.xl, paddingBottom: theme.space.xl }}>
        {children}
      </main>
    </>
  );
}
