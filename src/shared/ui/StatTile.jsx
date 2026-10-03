import { theme } from '../theme/theme';
import { InfoTip } from './Tooltip';

/**
 * Stat tile: label (without a colon), highlighted value and an optional note.
 * Props: label, value, hint, info (explanation behind a "?"), testId
 */
export function StatTile({ label, value, hint, info, testId }) {
  return (
    <div style={{ flex: '1 1 150px', minWidth: 140, padding: theme.space.md, background: theme.colors.bgElevated,
      border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.md }}>
      <div style={{ display: 'flex', gap: theme.space.xs, alignItems: 'center', fontSize: theme.font.sizeSm, color: theme.colors.textMuted }}>
        {label}{info && <InfoTip label={`About ${label.toLowerCase()}`}>{info}</InfoTip>}
      </div>
      <div style={{ fontFamily: theme.font.mono, fontSize: theme.font.sizeXl, fontWeight: 700, color: theme.colors.text }}
        data-testid={testId}>{value}</div>
      {hint && <div style={{ fontSize: theme.font.sizeXs, color: theme.colors.textMuted }}>{hint}</div>}
    </div>
  );
}
