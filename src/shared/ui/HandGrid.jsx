import { getHand, RANKS } from '../../domain/hand';
import { ACTION_LABELS, fallbackAction } from '../../domain/actions';
import { actionFor } from '../../domain/range';
import { colorFor } from '../theme/actionColors';
import { theme } from '../theme/theme';

/**
 * Grid 13x13. Solo presenta. Pinta la acción EFECTIVA de cada mano (domain/range#actionFor):
 * las manos sin acción explícita muestran la implícita (FOLD/CHECK) atenuada.
 *
 * Props: assignments ({[hand]: action}), actions (acciones de la situación), onCellClick(hand),
 *        cellSize, showLabels, highlight (hand), verdicts ({[hand]: {expected, correct}})
 */
export function HandGrid({ assignments = {}, actions, onCellClick, cellSize = 42, showLabels = true, highlight = null, verdicts = null }) {
  const implicit = fallbackAction(actions);
  const container = {
    display: 'inline-flex', flexDirection: 'column', alignSelf: 'flex-start', gap: 2, padding: theme.space.sm,
    background: theme.colors.bgElevated,
    border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.md
  };
  const base = {
    width: cellSize, height: cellSize, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: theme.font.mono, fontSize: cellSize >= 36 ? theme.font.sizeSm : theme.font.sizeXs, fontWeight: 600,
    color: theme.colors.text, border: `1px solid ${theme.colors.borderSubtle}`, borderRadius: theme.radius.sm,
    cursor: onCellClick ? 'pointer' : 'default', userSelect: 'none'
  };

  const describe = (hand, action, verdict) => {
    const text = `${hand}: ${ACTION_LABELS[action] ?? action}`;
    if (!verdict) return text;
    return verdict.correct ? `${text}, correcta` : `${text}, incorrecta (correcta: ${ACTION_LABELS[verdict.expected] ?? verdict.expected})`;
  };

  return (
    <div role="table" aria-label="Rango 13×13" style={container} data-testid="hand-grid">
      {RANKS.map((_, r) => (
        <div role="row" key={r} style={{ display: 'flex', gap: 2 }}>
          {RANKS.map((__, c) => {
            const hand = getHand(r, c);
            const action = actionFor(assignments, hand, actions);
            const isImplicit = action === implicit;
            const verdict = verdicts?.[hand];
            const outline = verdict
              ? `2px solid ${verdict.correct ? theme.colors.success : theme.colors.danger}`
              : highlight === hand ? `2px solid ${theme.colors.text}` : 'none';
            const style = { ...base, background: colorFor(action), opacity: isImplicit ? 0.45 : 1, outline, outlineOffset: -2 };
            const data = {
              'data-hand': hand, 'data-action': action, 'data-implicit': isImplicit ? 'true' : undefined,
              'data-verdict': verdict ? (verdict.correct ? 'ok' : 'ko') : undefined
            };
            const label = showLabels ? hand : null;
            return (
              <div role="cell" key={hand} aria-label={onCellClick ? undefined : describe(hand, action, verdict)}>
                {onCellClick ? (
                  <button type="button" style={style} {...data} aria-label={describe(hand, action, verdict)}
                    onClick={() => onCellClick(hand)}>{label}</button>
                ) : (
                  <div style={style} {...data} title={describe(hand, action, verdict)}>{label}</div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
