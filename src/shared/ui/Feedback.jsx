import { theme } from '../theme/theme';

export function Empty({ children }) {
  return (
    <div style={{ padding: theme.space.xl, border: `1px dashed ${theme.colors.border}`, borderRadius: theme.radius.md,
      color: theme.colors.textMuted, textAlign: 'center' }} data-testid="empty">{children}</div>
  );
}

/** Error of a request; with `onRetry`, a button to try again (queries stop retrying on their own at some point). */
export function ErrorBox({ error, onRetry }) {
  if (!error) return null;
  return (
    <div style={{ display: 'flex', gap: theme.space.md, alignItems: 'center', flexWrap: 'wrap', padding: theme.space.md,
      border: `1px solid ${theme.colors.danger}`, borderRadius: theme.radius.sm, color: theme.colors.danger }} data-testid="error">
      <span>{error.title ?? 'Error'}: {error.message}</span>
      {onRetry && (
        <button type="button" onClick={() => onRetry()} data-testid="error-retry"
          style={{ padding: `${theme.space.xs} ${theme.space.md}`, borderRadius: theme.radius.sm, cursor: 'pointer',
            border: `1px solid ${theme.colors.border}`, background: 'transparent', color: theme.colors.text }}>Retry</button>
      )}
    </div>
  );
}

/** Inline confirmation (no window.confirm): accessible and easy to automate. */
export function ConfirmBar({ message, confirmLabel, cancelLabel = 'Cancel', onConfirm, onCancel, testId = 'confirm' }) {
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
  return <small style={{ color: theme.colors.textMuted }} data-testid="loading">Loading…</small>;
}
