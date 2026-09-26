import { ANY } from '../../domain/selection';
import { theme } from '../theme/theme';

const FORMATS = { '3max': '3-max', hu: 'Heads-up' };

/** Props: situations (catalog), value (key | 'any'), onChange(key) */
export function SituationSelector({ situations, value, onChange }) {
  const select = {
    padding: `${theme.space.sm} ${theme.space.md}`, background: theme.colors.bgSunken, color: theme.colors.text,
    border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.sm,
    fontSize: theme.font.sizeSm, minWidth: 260, cursor: 'pointer'
  };
  const byFormat = {};
  for (const s of situations) (byFormat[s.format] ??= []).push(s);

  return (
    <select style={select} value={value} onChange={e => onChange(e.target.value)} data-testid="situation-select"
      aria-label="Situación">
      <option value={ANY}>Any · situación aleatoria</option>
      {Object.entries(byFormat).map(([format, items]) => (
        <optgroup key={format} label={FORMATS[format] ?? format}>
          {items.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </optgroup>
      ))}
    </select>
  );
}

/** Props: stacks (options), value (number | 'any'), onChange(stack). Always includes "Any". */
export function StackSelector({ stacks, value, onChange }) {
  const btn = active => ({
    padding: `${theme.space.xs} ${theme.space.md}`,
    background: active ? theme.colors.accent : theme.colors.bgSunken, color: active ? theme.colors.onAccent : theme.colors.text,
    border: `1px solid ${active ? theme.colors.accent : theme.colors.border}`, borderRadius: theme.radius.pill,
    fontFamily: theme.font.mono, fontSize: theme.font.sizeSm, fontWeight: active ? 700 : 500, cursor: 'pointer'
  });
  return (
    <div style={{ display: 'flex', gap: theme.space.xs, flexWrap: 'wrap' }} data-testid="stack-selector" role="group" aria-label="Stack">
      {[ANY, ...stacks].map(s => (
        <button key={s} type="button" style={btn(s === value)} onClick={() => onChange(s)} data-stack={s} aria-pressed={s === value}>
          {s === ANY ? 'Any' : `${s} BB`}
        </button>
      ))}
    </div>
  );
}
