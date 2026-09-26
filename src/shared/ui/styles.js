import { theme } from '../theme/theme';

/** Composition styles shared by the features. */
export const layout = {
  page: { display: 'flex', flexDirection: 'column', gap: theme.space.lg },
  row: { display: 'flex', gap: theme.space.lg, alignItems: 'center', flexWrap: 'wrap' },
  primary: {
    padding: `${theme.space.sm} ${theme.space.lg}`, background: theme.colors.accent, color: theme.colors.onAccent,
    border: 'none', borderRadius: theme.radius.sm, cursor: 'pointer', fontWeight: 600
  },
  secondary: {
    padding: `${theme.space.sm} ${theme.space.lg}`, background: 'transparent', color: theme.colors.text,
    border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.sm, cursor: 'pointer'
  },
  // Read by screen readers, not shown (e.g. a live region with a short announcement).
  visuallyHidden: {
    position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap', border: 0
  },
  mono: { fontSize: theme.font.sizeSm, color: theme.colors.textMuted, fontFamily: theme.font.mono },
  title: { margin: 0, fontFamily: theme.font.display, fontSize: 34, fontWeight: 400, letterSpacing: 1.5, color: theme.colors.text }
};
