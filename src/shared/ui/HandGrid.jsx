import { useEffect, useRef } from 'react';
import { getHand, RANKS } from '../../domain/hand';
import { ACTION_LABELS, fallbackAction } from '../../domain/actions';
import { actionFor } from '../../domain/range';
import { colorFor } from '../theme/actionColors';
import { readableText } from '../theme/contrast';
import { VERDICT_STYLES } from '../theme/verdictStyles';
import { theme } from '../theme/theme';
import { CELL_GAP, cellFontSize, gridCellSize } from './gridSize';
import { useElementWidth } from './useElementWidth';

/**
 * 13x13 grid. Presentation only. Paints the EFFECTIVE action of each hand (domain/range#actionFor):
 * hands without an explicit action show the implicit one (FOLD/CHECK) dimmed.
 *
 * Props:
 *  - assignments ({[hand]: action}), actions (actions of the situation)
 *  - onPaint(hand): if passed, the grid is editable: click, drag (mouse or touch) and keyboard (Enter/Space)
 *  - cellSize: number of px or 'auto' (fits the available width, 20–70 px)
 *  - showLabels, highlight (highlighted hand), label (accessible name)
 *  - verdicts ({[hand]: {expected, kind, played}} from domain/range#evaluateRange): outline and glyph by kind on the played hands
 */
export function HandGrid({ assignments = {}, actions, onPaint, cellSize = 'auto', showLabels = true,
  highlight = null, verdicts = null, label = '13×13 range' }) {
  const [width, wrapperRef] = useElementWidth(cellSize === 'auto');
  const size = cellSize === 'auto' ? (width ? gridCellSize(width) : 42) : cellSize;
  const stroke = useStroke(onPaint);
  const implicit = fallbackAction(actions);

  const container = {
    display: 'inline-flex', flexDirection: 'column', gap: CELL_GAP, padding: theme.space.sm,
    background: theme.colors.bgElevated, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.md,
    touchAction: onPaint ? 'none' : 'auto'
  };
  const base = {
    width: size, height: size, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: theme.font.mono, fontSize: cellFontSize(size), fontWeight: 600,
    border: `1px solid ${theme.colors.borderSubtle}`, borderRadius: size >= 28 ? theme.radius.sm : 2,
    cursor: onPaint ? 'crosshair' : 'default', userSelect: 'none', WebkitUserSelect: 'none'
  };
  const describe = (hand, action, verdict) => {
    const text = `${hand}: ${ACTION_LABELS[action] ?? action}`;
    if (!verdict) return text;
    const kind = VERDICT_STYLES[verdict.kind].label.toLowerCase();
    return verdict.correct ? `${text}, ${kind}` : `${text}, ${kind} (correct: ${ACTION_LABELS[verdict.expected] ?? verdict.expected})`;
  };

  return (
    <div ref={wrapperRef} style={{ width: cellSize === 'auto' ? '100%' : undefined, minWidth: 0 }}>
      <div role="table" aria-label={label} style={container} data-testid="hand-grid" {...stroke.handlers}>
        {RANKS.map((_, r) => (
          <div role="row" key={r} style={{ display: 'flex', gap: CELL_GAP }}>
            {RANKS.map((__, c) => {
              const hand = getHand(r, c);
              const action = actionFor(assignments, hand, actions);
              const isImplicit = action === implicit;
              const color = colorFor(action);
              const verdict = verdicts?.[hand];
              // Only the played hands are marked: getting the folds of the 169 right adds no information.
              const marked = verdict?.played ? VERDICT_STYLES[verdict.kind] : null;
              const outline = marked
                ? `${size >= 28 ? 3 : 2}px ${marked.line} ${marked.color}`
                : highlight === hand ? `3px solid ${theme.colors.accentStrong}` : 'none';
              const style = {
                ...base,
                background: isImplicit ? `color-mix(in srgb, ${color} 35%, ${theme.colors.bgElevated})` : color,
                color: isImplicit ? theme.colors.textMuted : readableText(color),
                outline, outlineOffset: -2, position: 'relative'
              };
              const glyph = marked?.glyph && showLabels && (
                <span aria-hidden="true" style={{ position: 'absolute', top: 1, right: 3, fontSize: Math.max(9, cellFontSize(size) - 3),
                  fontWeight: 800, lineHeight: 1, color: marked.color, textShadow: '0 0 2px #000, 0 0 2px #000' }}>{marked.glyph}</span>
              );
              const data = {
                'data-hand': hand, 'data-action': action, 'data-implicit': isImplicit ? 'true' : undefined,
                'data-verdict': verdict?.kind, 'data-played': verdict ? String(verdict.played) : undefined,
                'data-highlight': highlight === hand ? 'true' : undefined
              };
              const text = showLabels ? hand : null;
              return (
                <div role="cell" key={hand} aria-label={onPaint ? undefined : describe(hand, action, verdict)}>
                  {onPaint ? (
                    <button type="button" style={style} {...data} aria-label={describe(hand, action, verdict)}
                      onClick={e => { if (e.detail === 0) onPaint(hand); /* keyboard; the mouse paints on pointerdown */ }}>
                      {text}{glyph}
                    </button>
                  ) : (
                    <div style={style} {...data} title={describe(hand, action, verdict)}>{text}{glyph}</div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Paint stroke with Pointer Events: paints on press and when passing over other cells while the pointer is held down.
 * On touch the browser captures the pointer in the initial cell, so the cell under the finger is resolved
 * with elementFromPoint on each move.
 */
function useStroke(onPaint) {
  const painting = useRef(false);
  const last = useRef(null);
  const editable = Boolean(onPaint);

  useEffect(() => {
    if (!editable) return;
    const end = () => { painting.current = false; last.current = null; };
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    return () => { window.removeEventListener('pointerup', end); window.removeEventListener('pointercancel', end); };
  }, [editable]);

  if (!editable) return { handlers: {} };
  const paintAt = hand => {
    if (!hand || hand === last.current) return;
    last.current = hand;
    onPaint(hand);
  };
  const handAt = el => el?.closest?.('[data-hand]')?.dataset.hand;

  return {
    handlers: {
      onPointerDown: e => {
        if (e.button > 0) return;
        const hand = handAt(e.target);
        if (!hand) return;
        e.preventDefault();
        painting.current = true;
        last.current = null;
        paintAt(hand);
      },
      onPointerMove: e => {
        if (!painting.current) return;
        paintAt(handAt(document.elementFromPoint(e.clientX, e.clientY)));
      }
    }
  };
}
