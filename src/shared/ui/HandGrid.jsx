import { getHand, RANKS } from '../../domain/hand';
import { colorFor } from '../theme/actionColors';
import { theme } from '../theme/theme';

/**
 * Grid 13x13. Solo presenta: recibe { [hand]: action } y, opcionalmente, veredictos del Builder.
 * Props: assignments, onCellClick(hand), cellSize, showLabels, highlight, verdicts ({[hand]: {correct}})
 */
export function HandGrid({ assignments = {}, onCellClick, cellSize = 42, showLabels = true, highlight = null, verdicts = null }) {
  const container = {
    display: 'inline-grid', gridTemplateColumns: `repeat(13, ${cellSize}px)`, gridAutoRows: `${cellSize}px`,
    gap: 2, padding: theme.space.sm, background: theme.colors.bgElevated,
    border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.md
  };
  const base = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: theme.font.mono, fontSize: cellSize >= 36 ? theme.font.sizeSm : theme.font.sizeXs, fontWeight: 600,
    color: theme.colors.text, border: `1px solid ${theme.colors.borderSubtle}`, borderRadius: theme.radius.sm,
    cursor: onCellClick ? 'pointer' : 'default', userSelect: 'none'
  };

  return (
    <div style={container} data-testid="hand-grid">
      {RANKS.map((_, r) => RANKS.map((__, c) => {
        const hand = getHand(r, c);
        const action = assignments[hand];
        const verdict = verdicts?.[hand];
        const outline = verdict
          ? `2px solid ${verdict.correct ? theme.colors.success : theme.colors.danger}`
          : highlight === hand ? `2px solid ${theme.colors.text}` : 'none';
        const style = { ...base, background: colorFor(action), opacity: action ? 1 : 0.55, outline, outlineOffset: -2 };
        return (
          <div key={hand} style={style} title={hand} data-hand={hand} data-action={action ?? ''}
            data-verdict={verdict ? (verdict.correct ? 'ok' : 'ko') : undefined}
            onClick={onCellClick ? () => onCellClick(hand) : undefined}>
            {showLabels ? hand : null}
          </div>
        );
      }))}
    </div>
  );
}
