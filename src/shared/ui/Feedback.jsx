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
