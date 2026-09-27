import { VERDICT_KINDS } from '../../domain/range';
import { VERDICT_STYLES } from '../theme/verdictStyles';
import { theme } from '../theme/theme';

/** Verdict legend with counts. Props: byKind ({ correct, wrong, extra, missing }) from domain/range#evaluateRange */
export function VerdictLegend({ byKind }) {
  return (
    <ul aria-label="Legend" data-testid="verdict-legend"
      style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', gap: theme.space.md, flexWrap: 'wrap' }}>
      {VERDICT_KINDS.map(kind => {
        const v = VERDICT_STYLES[kind];
        return (
          <li key={kind} data-kind={kind} style={{ display: 'flex', alignItems: 'center', gap: theme.space.xs, fontSize: theme.font.sizeSm }}>
            <span aria-hidden="true" style={{ position: 'relative', width: 16, height: 16, borderRadius: 3, background: theme.colors.bgSunken,
              outline: `2px ${v.line} ${v.color}`, outlineOffset: -2, display: 'inline-flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 10, fontWeight: 800, color: v.color }}>{v.glyph}</span>
            <span>{v.label}</span>
            <strong style={{ fontFamily: theme.font.mono }}>{byKind[kind]}</strong>
          </li>
        );
      })}
    </ul>
  );
}
