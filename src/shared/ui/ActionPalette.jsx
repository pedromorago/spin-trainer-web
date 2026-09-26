import { ACTION_LABELS } from '../../domain/actions';
import { colorFor } from '../theme/actionColors';
import { theme } from '../theme/theme';

export function ActionPalette({ actions, selected, onSelect, disabled = false }) {
  return (
    <div style={{ display: 'flex', gap: theme.space.sm, flexWrap: 'wrap' }} data-testid="action-palette">
      {actions.map(action => {
        const color = colorFor(action);
        const active = selected === action;
        const btn = {
          display: 'flex', alignItems: 'center', gap: theme.space.sm,
          padding: `${theme.space.sm} ${theme.space.md}`,
          background: active ? theme.colors.bg : theme.colors.bgElevated, color: theme.colors.text,
          border: `1px solid ${active ? color : theme.colors.border}`, borderRadius: theme.radius.sm,
          fontFamily: theme.font.family, fontSize: theme.font.sizeSm, fontWeight: active ? 700 : 500,
          cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1
        };
        return (
          <button key={action} style={btn} disabled={disabled} onClick={() => onSelect?.(action)} data-action={action}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: color, flexShrink: 0 }} />
            <span>{ACTION_LABELS[action] ?? action}</span>
          </button>
        );
      })}
    </div>
  );
}
