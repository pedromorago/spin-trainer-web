import { SituationSelector, StackSelector } from './SituationSelector';
import { theme } from '../theme/theme';

const FORMATS = { '3max': '3-max', hu: 'HU' };

/** Single situation and stack selector (with "Any"), shared by all the tabs. Props: situations, selection */
export function SituationBar({ situations, selection }) {
  return (
    <div style={{ display: 'flex', gap: theme.space.lg, alignItems: 'center', flexWrap: 'wrap' }} data-testid="situation-bar">
      <SituationSelector situations={situations} value={selection.situationKey} onChange={selection.setSituation} />
      <StackSelector stacks={selection.stacks} value={selection.stack} onChange={selection.setStack} />
      {selection.situation && (
        <span style={{ fontFamily: theme.font.display, letterSpacing: 1, color: theme.colors.textMuted }}>
          {FORMATS[selection.situation.format] ?? selection.situation.format}
        </span>
      )}
      {selection.isAny && (
        <span style={{ fontSize: theme.font.sizeSm, color: theme.colors.accent }} data-testid="random-mode">
          Random mode · {selection.combos.length} spots
        </span>
      )}
    </div>
  );
}
