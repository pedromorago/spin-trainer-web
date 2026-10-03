import { ACTION_DESCRIPTIONS, ACTION_LABELS } from '../../domain/actions';
import { ERASE } from '../../domain/range';
import { colorFor } from '../theme/actionColors';
import { Glossary } from './Glossary';
import { shortcutKey } from './shortcuts';
import { InfoTip, Tooltip } from './Tooltip';
import { theme } from '../theme/theme';

/**
 * Action buttons. They work as a legend (without onSelect), as a brush (with onSelect and `eraser`) or as Quiz answers.
 * Each button explains its action in a tooltip, and a "?" next to the group explains them all (touch screens).
 * Props: actions, selected, onSelect(action), disabled, eraser (adds the eraser: ERASE), shortcuts (shows the keys: 1..9, then 0)
 */
export function ActionPalette({ actions, selected, onSelect, disabled = false, eraser = false, shortcuts = false }) {
  const items = eraser ? [...actions, ERASE] : actions;
  return (
    <div style={{ display: 'flex', gap: theme.space.sm, alignItems: 'flex-start' }} data-tour="palette">
    <div style={{ display: 'flex', gap: theme.space.sm, flexWrap: 'wrap' }} data-testid="action-palette"
      role="group" aria-label={eraser ? 'Brush' : 'Actions'}>
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
        const shortcut = shortcuts ? shortcutKey(i) : undefined;
        const swatch = isEraser
          ? { width: 12, height: 12, borderRadius: 3, flexShrink: 0, border: `1px dashed ${color}` }
          : { width: 12, height: 12, borderRadius: 3, flexShrink: 0, background: color };
        const explanation = isEraser ? 'Eraser: puts a hand back to the implicit action (it is not played).' : ACTION_DESCRIPTIONS[action];
        return (
          <Tooltip key={action} content={explanation}>
          <button type="button" style={btn} disabled={disabled} onClick={() => onSelect?.(action)} data-action={action}
            aria-pressed={onSelect ? active : undefined} aria-keyshortcuts={shortcut}>
            {/* The shortcut is announced with aria-keyshortcuts; the kbd must not be part of the accessible name. */}
            {shortcut && <kbd aria-hidden="true" style={{ fontFamily: theme.font.mono, fontSize: theme.font.sizeXs, color: theme.colors.textMuted }}>{shortcut}</kbd>}
            <span aria-hidden="true" style={swatch} />
            <span>{isEraser ? 'Eraser' : ACTION_LABELS[action] ?? action}</span>
          </button>
          </Tooltip>
        );
      })}
    </div>
    <InfoTip label="What do these actions mean?" testId="actions-glossary"><Glossary actions={actions} /></InfoTip>
    </div>
  );
}
