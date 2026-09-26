import { ACTION_LABELS } from '../../domain/actions';
import { colorFor } from '../theme/actionColors';
import { theme } from '../theme/theme';

const pct = x => `${(x * 100).toFixed(1)}%`;

/**
 * Side panel of the range: totals, stacked bar per action, card per action and the note of the situation.
 * Props: stats (domain/range#rangeStats), notes (text of the situation, optional)
 */
export function RangePanel({ stats, notes }) {
  const card = {
    display: 'grid', gridTemplateColumns: '12px 1fr auto', alignItems: 'center', gap: theme.space.sm,
    padding: `${theme.space.sm} ${theme.space.md}`, background: theme.colors.bgElevated,
    border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.sm
  };
  const summary = stats.byAction.map(a => `${ACTION_LABELS[a.action] ?? a.action} ${pct(a.pct)}`).join(', ');

  return (
    <aside style={{ display: 'flex', flexDirection: 'column', gap: theme.space.md, minWidth: 240, flex: '0 1 300px' }}
      aria-label="Resumen del rango" data-testid="range-panel">
      <div style={{ display: 'flex', gap: theme.space.lg }}>
        {[['Manos', stats.hands, 'range-hands'], ['Combos', stats.combos, 'range-combos'], ['Rango', pct(stats.pct), 'range-pct']].map(([k, v, id]) => (
          <div key={k}>
            <div style={{ fontFamily: theme.font.display, letterSpacing: 1, color: theme.colors.textMuted }}>{k}</div>
            <div style={{ fontFamily: theme.font.mono, fontSize: theme.font.sizeXl, fontWeight: 700, color: theme.colors.accentStrong }}
              data-testid={id}>{v}</div>
          </div>
        ))}
      </div>

      <div role="img" aria-label={`Reparto de combos: ${summary}`} data-testid="range-bar"
        style={{ display: 'flex', height: 14, borderRadius: theme.radius.pill, overflow: 'hidden', background: theme.colors.bgSunken }}>
        {stats.byAction.filter(a => a.combos > 0).map(a => (
          <div key={a.action} data-action={a.action} title={`${ACTION_LABELS[a.action] ?? a.action}: ${pct(a.pct)}`}
            style={{ width: `${a.pct * 100}%`, background: colorFor(a.action), opacity: a.implicit ? 0.45 : 1 }} />
        ))}
      </div>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: theme.space.xs }}>
        {stats.byAction.map(a => (
          <li key={a.action} style={{ ...card, opacity: a.implicit ? 0.7 : 1 }} data-testid={`range-card-${a.action}`}>
            <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: 3, background: colorFor(a.action) }} />
            <span style={{ fontSize: theme.font.sizeSm }}>{ACTION_LABELS[a.action] ?? a.action}</span>
            <span style={{ fontFamily: theme.font.mono, fontSize: theme.font.sizeSm, textAlign: 'right' }}>
              <strong>{pct(a.pct)}</strong>
              <span style={{ color: theme.colors.textMuted }}> · {a.combos}c</span>
            </span>
          </li>
        ))}
      </ul>

      {notes && (
        <div style={{ padding: theme.space.md, borderLeft: `3px solid ${theme.colors.accent}`, background: theme.colors.accentSoft,
          borderRadius: theme.radius.sm, fontSize: theme.font.sizeSm }} data-testid="range-tip">
          <div style={{ fontFamily: theme.font.display, letterSpacing: 1, color: theme.colors.accent }}>Tip</div>
          {notes}
        </div>
      )}
    </aside>
  );
}
