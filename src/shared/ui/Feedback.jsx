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

/** Inline confirmation (no window.confirm): accessible and easy to automate. */
export function ConfirmBar({ message, confirmLabel, cancelLabel = 'Cancelar', onConfirm, onCancel, testId = 'confirm' }) {
  const btn = {
    padding: `${theme.space.xs} ${theme.space.md}`, borderRadius: theme.radius.sm, cursor: 'pointer',
    border: `1px solid ${theme.colors.border}`, background: 'transparent', color: theme.colors.text
  };
  return (
    <div role="alertdialog" aria-label={message} data-testid={testId}
      style={{ display: 'flex', gap: theme.space.md, alignItems: 'center', flexWrap: 'wrap', padding: theme.space.md,
        border: `1px solid ${theme.colors.danger}`, borderRadius: theme.radius.sm }}>
      <span>{message}</span>
      <button style={{ ...btn, borderColor: theme.colors.danger, color: theme.colors.danger }} onClick={onConfirm}
        data-testid={`${testId}-yes`}>{confirmLabel}</button>
      <button style={btn} onClick={onCancel} data-testid={`${testId}-no`} autoFocus>{cancelLabel}</button>
    </div>
  );
}

export function Loading() {
  return <small style={{ color: theme.colors.textMuted }} data-testid="loading">Cargando…</small>;
}
