import { ACTION_DESCRIPTIONS, ACTION_LABELS, GLOSSARY } from '../../domain/actions';
import { theme } from '../theme/theme';

/** What the actions of a situation mean, plus the charts' abbreviations: the content of the palette's "?" tip. */
export function Glossary({ actions }) {
  const term = { fontWeight: 700, color: theme.colors.accentStrong };
  return (
    <span style={{ display: 'flex', flexDirection: 'column', gap: theme.space.xs }}>
      {actions.map(action => (
        <span key={action}><span style={term}>{ACTION_LABELS[action] ?? action}</span>: {ACTION_DESCRIPTIONS[action] ?? ''}</span>
      ))}
      <span style={{ marginTop: theme.space.xs, color: theme.colors.textMuted }}>
        {GLOSSARY.map(([abbr, meaning]) => `${abbr} = ${meaning}`).join(' · ')}
      </span>
    </span>
  );
}
