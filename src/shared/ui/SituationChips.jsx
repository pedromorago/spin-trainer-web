import { theme } from '../theme/theme';

const pct = x => `${Math.round(x * 100)}%`;

/**
 * Accuracy per situation: one chip per catalog situation with its meter (the track is one step of the same hue).
 * Situations without attempts are shown dimmed: they also tell what is left to practice.
 * Props: situations (catalog), stats ({ [key]: { attempts, correct, accuracy } }), selectedKey
 */
export function SituationChips({ situations, stats, selectedKey }) {
  return (
    <ul aria-label="Accuracy by situation" data-testid="stats-chips"
      style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: theme.space.sm,
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
      {situations.map(s => {
        const st = stats[s.key];
        const selected = s.key === selectedKey;
        return (
          <li key={s.key} data-situation={s.key} aria-current={selected ? 'true' : undefined}
            style={{ padding: theme.space.sm, borderRadius: theme.radius.md, background: theme.colors.bgElevated,
              border: `1px solid ${selected ? theme.colors.accent : theme.colors.border}`, opacity: st ? 1 : 0.55 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: theme.space.sm, fontSize: theme.font.sizeSm }}>
              <span>{s.label}</span>
              <strong style={{ fontFamily: theme.font.mono }}>{st ? pct(st.accuracy) : '—'}</strong>
            </div>
            {/* Without attempts there is no value to measure (not 0%): the empty track is decoration. */}
            <div {...(st
              ? { role: 'meter', 'aria-label': `Accuracy in ${s.label}`, 'aria-valuemin': 0, 'aria-valuemax': 100,
                'aria-valuenow': Math.round(st.accuracy * 100) }
              : { 'aria-hidden': true })}
              style={{ height: 6, marginTop: 6, borderRadius: theme.radius.pill, background: theme.colors.accentSoft, overflow: 'hidden' }}>
              <div style={{ width: st ? `${st.accuracy * 100}%` : 0, height: '100%', background: theme.colors.chartAccent }} />
            </div>
            <div style={{ fontSize: theme.font.sizeXs, color: theme.colors.textMuted, marginTop: 4 }}>
              {st ? `${st.correct}/${st.attempts} hands` : 'No attempts'}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
