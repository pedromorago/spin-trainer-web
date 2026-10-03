import { SituationSelector, StackSelector } from './SituationSelector';
import { theme } from '../theme/theme';
import { InfoTip } from './Tooltip';

const FORMATS = { '3max': '3-max', hu: 'HU' };

/** Single situation and stack selector (with "Any"), shared by all the tabs. Props: situations, selection */
export function SituationBar({ situations, selection }) {
  return (
    <div style={{ display: 'flex', gap: theme.space.lg, alignItems: 'center', flexWrap: 'wrap' }} data-testid="situation-bar">
      <SituationSelector situations={situations} value={selection.situationKey} onChange={selection.setSituation} />
      <span style={{ display: 'flex', gap: theme.space.sm, alignItems: 'center' }}>
        <StackSelector stacks={selection.stacks} value={selection.stack} onChange={selection.setStack} />
        <InfoTip label="About the stack and Any" testId="stack-info">
          The effective stack in big blinds (BB). <strong>Any</strong> picks situations and stacks at random in the Quiz and
          the Builder; the Explorer always shows one.
        </InfoTip>
      </span>
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
