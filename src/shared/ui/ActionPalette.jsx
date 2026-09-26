import { ACTION_LABELS } from '../../domain/actions';
import { ERASE } from '../../domain/range';
import { colorFor } from '../theme/actionColors';
import { theme } from '../theme/theme';

/**
 * Botones de acción. Sirven de leyenda (sin onSelect), de pincel (con onSelect y `eraser`) o de respuesta en el Quiz.
 * Props: actions, selected, onSelect(action), disabled, eraser (añade la goma: ERASE), shortcuts (muestra 1..n)
 */
export function ActionPalette({ actions, selected, onSelect, disabled = false, eraser = false, shortcuts = false }) {
  const items = eraser ? [...actions, ERASE] : actions;
  return (
    <div style={{ display: 'flex', gap: theme.space.sm, flexWrap: 'wrap' }} data-testid="action-palette"
      role="group" aria-label={eraser ? 'Pincel' : 'Acciones'}>
      {items.map((action, i) => {
        const isEraser = action === ERASE;
        const color = isEraser ? theme.colors.textMuted : colorFor(action);
        const active = selected === action;
        const btn = {
          display: 'flex', alignItems: 'center', gap: theme.space.sm,
          padding: `${theme.space.sm} ${theme.space.md}`,
          background: active ? theme.colors.accentSoft : theme.colors.bgElevated, color: theme.colors.text,
          border: `1px solid ${active ? theme.colors.accent : theme.colors.border}`, borderRadius: theme.radius.sm,
          fontSize: theme.font.sizeSm, fontWeight: active ? 700 : 500,
          cursor: disabled ? 'not-allowed' : onSelect ? 'pointer' : 'default', opacity: disabled ? 0.6 : 1
        };
        const swatch = isEraser
          ? { width: 12, height: 12, borderRadius: 3, flexShrink: 0, border: `1px dashed ${color}` }
          : { width: 12, height: 12, borderRadius: 3, flexShrink: 0, background: color };
        return (
          <button key={action} type="button" style={btn} disabled={disabled} onClick={() => onSelect?.(action)} data-action={action}
            aria-pressed={onSelect ? active : undefined} aria-keyshortcuts={shortcuts ? String(i + 1) : undefined}>
            {shortcuts && <kbd style={{ fontFamily: theme.font.mono, fontSize: theme.font.sizeXs, color: theme.colors.textMuted }}>{i + 1}</kbd>}
            <span aria-hidden="true" style={swatch} />
            <span>{isEraser ? 'Goma' : ACTION_LABELS[action] ?? action}</span>
          </button>
        );
      })}
    </div>
  );
}
