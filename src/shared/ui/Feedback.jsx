import { theme } from '../theme/theme';

export function Empty({ children }) {
  return (
    <div style={{ padding: theme.space.xl, border: `1px dashed ${theme.colors.border}`, borderRadius: theme.radius.md,
      color: theme.colors.textMuted, textAlign: 'center' }} data-testid="empty">{children}</div>
  );
}

export function ErrorBox({ error }) {
  if (!error) return null;
  return (
    <div style={{ padding: theme.space.md, border: `1px solid ${theme.colors.danger}`, borderRadius: theme.radius.sm,
      color: theme.colors.danger }} data-testid="error">{error.title ?? 'Error'}: {error.message}</div>
  );
}

export function Loading() {
  return <small style={{ color: theme.colors.textMuted }} data-testid="loading">Cargando…</small>;
}

export const layout = {
  page: { display: 'flex', flexDirection: 'column', gap: theme.space.lg },
  row: { display: 'flex', gap: theme.space.lg, alignItems: 'center', flexWrap: 'wrap' },
  primary: {
    padding: `${theme.space.sm} ${theme.space.lg}`, background: theme.colors.accent, color: '#fff',
    border: 'none', borderRadius: theme.radius.sm, cursor: 'pointer', fontWeight: 600
  },
  secondary: {
    padding: `${theme.space.sm} ${theme.space.lg}`, background: 'transparent', color: theme.colors.text,
    border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.sm, cursor: 'pointer'
  },
  mono: { fontSize: theme.font.sizeSm, color: theme.colors.textMuted, fontFamily: theme.font.mono }
};
