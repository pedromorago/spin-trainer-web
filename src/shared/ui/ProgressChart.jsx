import { useState } from 'react';
import { labelIndices, linearScale, niceMax } from './chart/scale';
import { useElementWidth } from './useElementWidth';
import { theme } from '../theme/theme';

// Geometry (px). Two charts aligned on the same day axis: never a dual-axis chart.
// Right margin reserved for the direct label of the last point (without clashing with the line).
const M = { left: 44, right: 44, top: 22 };
const H_ACC = 150;
const GAP = 34;
const H_VOL = 64;
const X_BAND = 22;
const C = theme.colors;
const pct = x => `${Math.round(x * 100)} %`;
const dayLabel = date => `${date.slice(8, 10)}/${date.slice(5, 7)}`;

/** Column with 4 px rounding at the top and a flat base. */
function columnPath(x0, x1, yTop, yBase) {
  const r = Math.min(4, (x1 - x0) / 2, yBase - yTop);
  return `M${x0},${yBase} V${yTop + r} Q${x0},${yTop} ${x0 + r},${yTop} H${x1 - r} Q${x1},${yTop} ${x1},${yTop + r} V${yBase} Z`;
}

/**
 * Daily progress: accuracy (line: the story) and hands played (gray columns: the context), aligned by day.
 * Crosshair + tooltip with mouse and with keyboard (arrows, Home/End); table view as the accessible equivalent.
 * Props: series (domain/stats#dailySeries), stale (the previous data is shown while reloading)
 */
export function ProgressChart({ series, stale = false }) {
  const [width, ref] = useElementWidth();
  const [active, setActive] = useState(null);
  const [asTable, setAsTable] = useState(false);
  const withData = series.flatMap((d, i) => (d.attempts ? [i] : []));

  const W = Math.max(280, width ?? 640);
  const n = series.length;
  const plotW = W - M.left - M.right;
  const band = plotW / n;
  const x = i => M.left + (i + 0.5) * band;
  const yAcc = linearScale([0, 1], [M.top + H_ACC, M.top]);
  const volTop = M.top + H_ACC + GAP;
  const volMax = niceMax(Math.max(...series.map(d => d.attempts)));
  const yVol = linearScale([0, volMax], [volTop + H_VOL, volTop]);
  const height = volTop + H_VOL + X_BAND;
  const barW = Math.max(1, Math.min(24, band - 2)); // ≤ 24 px and 2 px of gap between columns

  // Segments of consecutive days with data: no continuity is invented over days without attempts.
  const segments = [];
  series.forEach((d, i) => {
    if (d.accuracy === null) return;
    const last = segments.at(-1);
    if (last && last.at(-1) === i - 1) last.push(i); else segments.push([i]);
  });
  const lastIndex = withData.at(-1);
  const total = series.reduce((acc, d) => ({ attempts: acc.attempts + d.attempts, correct: acc.correct + d.correct }), { attempts: 0, correct: 0 });
  const summary = total.attempts
    ? `Precisión diaria de los últimos ${n} días: ${pct(total.correct / total.attempts)} de media en ${total.attempts} manos; `
      + `último día con intentos ${series[lastIndex].date}, ${pct(series[lastIndex].accuracy)}.`
    : `Sin intentos en los últimos ${n} días.`;

  const pick = e => {
    const rect = e.currentTarget.getBoundingClientRect();
    return Math.max(0, Math.min(n - 1, Math.floor((e.clientX - rect.left - M.left) / band)));
  };
  const onKeyDown = e => {
    const moves = { ArrowLeft: -1, ArrowRight: 1 };
    if (e.key in moves) setActive(a => Math.max(0, Math.min(n - 1, (a ?? lastIndex ?? n - 1) + moves[e.key])));
    else if (e.key === 'Home') setActive(0);
    else if (e.key === 'End') setActive(n - 1);
    else if (e.key === 'Escape') setActive(null);
    else return;
    e.preventDefault();
  };

  const toggle = (
    <button type="button" onClick={() => setAsTable(v => !v)} aria-pressed={asTable} data-testid="progress-table-toggle"
      style={{ alignSelf: 'flex-end', background: 'transparent', color: C.textMuted, border: `1px solid ${C.border}`,
        borderRadius: theme.radius.sm, padding: `2px ${theme.space.sm}`, cursor: 'pointer', fontSize: theme.font.sizeSm }}>
      {asTable ? 'Ver gráfico' : 'Ver tabla'}
    </button>
  );

  if (!total.attempts) {
    return <p style={{ color: C.textMuted, margin: 0 }} data-testid="progress-empty">{summary}</p>;
  }

  const d = active !== null ? series[active] : null;
  const text = { fontFamily: theme.font.mono, fontSize: 11, fill: C.textMuted };

  return (
    <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: theme.space.sm, opacity: stale ? 0.5 : 1,
      transition: 'opacity 120ms' }} data-testid="progress-chart" aria-busy={stale}>
      {toggle}
      {asTable ? (
        <table style={{ borderCollapse: 'collapse', fontSize: theme.font.sizeSm, fontVariantNumeric: 'tabular-nums' }} data-testid="progress-table">
          <caption style={{ textAlign: 'left', color: C.textMuted, paddingBottom: theme.space.xs }}>{summary}</caption>
          <thead><tr>{['Día', 'Manos', 'Aciertos', 'Precisión'].map(h => <th key={h} style={{ textAlign: 'left', padding: '4px 12px 4px 0' }}>{h}</th>)}</tr></thead>
          <tbody>
            {withData.map(i => (
              <tr key={series[i].date}>
                <td style={{ padding: '2px 12px 2px 0' }}>{series[i].date}</td>
                <td>{series[i].attempts}</td><td>{series[i].correct}</td><td>{pct(series[i].accuracy)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div ref={ref} style={{ position: 'relative', width: '100%' }}>
          <svg width={W} height={height} role="img" aria-label={summary} tabIndex={0} onKeyDown={onKeyDown}
            onFocus={() => setActive(a => a ?? lastIndex)} onBlur={() => setActive(null)}
            onPointerMove={e => setActive(pick(e))} onPointerLeave={() => setActive(null)}
            style={{ display: 'block', touchAction: 'pan-y', outlineOffset: 4 }} data-testid="progress-svg">
            <text x={M.left} y={M.top - 8} style={{ ...text, fill: C.textMuted }}>Precisión</text>
            {[0, 0.5, 1].map(v => (
              <g key={v}>
                <line x1={M.left} x2={W - M.right} y1={yAcc(v)} y2={yAcc(v)} stroke={v === 0 ? C.chartAxis : C.chartGrid} strokeWidth={1} />
                <text x={M.left - 8} y={yAcc(v) + 4} textAnchor="end" style={text}>{pct(v)}</text>
              </g>
            ))}
            <text x={M.left} y={volTop - 8} style={text}>Manos jugadas</text>
            {[0, volMax].map(v => (
              <g key={v}>
                <line x1={M.left} x2={W - M.right} y1={yVol(v)} y2={yVol(v)} stroke={v === 0 ? C.chartAxis : C.chartGrid} strokeWidth={1} />
                <text x={M.left - 8} y={yVol(v) + 4} textAnchor="end" style={text}>{v}</text>
              </g>
            ))}

            {series.map((day, i) => day.attempts > 0 && (
              <path key={day.date} d={columnPath(x(i) - barW / 2, x(i) + barW / 2, yVol(day.attempts), yVol(0))}
                fill={C.chartContext} opacity={active === null || active === i ? 1 : 0.55} data-date={day.date} />
            ))}

            {active !== null && (
              <line x1={x(active)} x2={x(active)} y1={M.top} y2={volTop + H_VOL} stroke={C.textMuted} strokeWidth={1} data-testid="progress-crosshair" />
            )}
            {segments.filter(s => s.length > 1).map(s => (
              <polyline key={s[0]} points={s.map(i => `${x(i)},${yAcc(series[i].accuracy)}`).join(' ')}
                fill="none" stroke={C.chartAccent} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            ))}
            {withData.map(i => (
              <circle key={series[i].date} cx={x(i)} cy={yAcc(series[i].accuracy)} r={active === i ? 6 : 4}
                fill={C.chartAccent} stroke={C.bgElevated} strokeWidth={2} data-point={series[i].date} />
            ))}
            {/* Direct label only on the last day with data (never a number on every point). */}
            <text x={x(lastIndex) + 8} y={yAcc(series[lastIndex].accuracy) + 4} textAnchor="start"
              style={{ fontFamily: theme.font.mono, fontSize: 12, fontWeight: 700, fill: C.text }} data-testid="progress-last-label">
              {pct(series[lastIndex].accuracy)}
            </text>

            {labelIndices(n, Math.max(2, Math.floor(plotW / 64))).map((i, k, all) => (
              <text key={i} x={x(i)} y={volTop + H_VOL + 16} style={text}
                textAnchor={k === 0 ? 'start' : k === all.length - 1 ? 'end' : 'middle'}>{dayLabel(series[i].date)}</text>
            ))}
          </svg>

          {d && (
            <div role="status" aria-live="polite" data-testid="progress-tooltip" style={{
              position: 'absolute', top: M.top, left: Math.min(Math.max(x(active) + 12, 0), W - 150), pointerEvents: 'none',
              background: C.bg, border: `1px solid ${C.border}`, borderRadius: theme.radius.sm, padding: '6px 10px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)', minWidth: 120
            }}>
              <div style={{ fontFamily: theme.font.mono, fontSize: 16, fontWeight: 700, color: C.text }}>
                {d.accuracy === null ? 'Sin intentos' : pct(d.accuracy)}
              </div>
              <div style={{ fontSize: 12, color: C.textMuted }}>
                <span aria-hidden="true" style={{ display: 'inline-block', width: 10, height: 2, background: C.chartAccent, verticalAlign: 'middle', marginRight: 6 }} />
                {dayLabel(d.date)} · {d.correct}/{d.attempts} manos
              </div>
            </div>
          )}
        </div>
      )}
    </figure>
  );
}
