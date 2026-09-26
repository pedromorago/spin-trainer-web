import { useOutletContext } from 'react-router';
import { summarize } from '../../domain/range';
import { ACTION_LABELS } from '../../domain/actions';
import { useDefaultRange, useUserRange } from '../../shared/api/queries';
import { HandGrid } from '../../shared/ui/HandGrid';
import { ActionPalette } from '../../shared/ui/ActionPalette';
import { Empty, ErrorBox, Loading } from '../../shared/ui/Feedback';
import { layout } from '../../shared/ui/styles';
import { theme } from '../../shared/theme/theme';

export function ExplorerPage() {
  const { selection } = useOutletContext();

  return (
    <div style={layout.page}>
      <h2 style={layout.title}>Explorer</h2>
      {selection.isAny ? (
        <Empty>
          <span data-testid="explorer-random">
            Modo aleatorio: el Explorer muestra una situación y un stack concretos. Quiz y Builder elegirán combinaciones al azar.
          </span>
        </Empty>
      ) : (
        <RangeView situation={selection.situation} stack={selection.stack} />
      )}
    </div>
  );
}

function RangeView({ situation, stack }) {
  const def = useDefaultRange(situation.key, stack);
  const user = useUserRange(situation.key, stack);
  const hands = def.data?.hands ?? {};
  const isEmpty = Object.keys(hands).length === 0;
  const summary = summarize(hands, situation.actions);

  return (
    <>
      {situation.notes && <small style={{ color: theme.colors.textMuted }}>{situation.notes}</small>}
      <ActionPalette actions={situation.actions} />
      <ErrorBox error={def.error} />
      {def.isLoading ? <Loading /> : isEmpty ? (
        <Empty>Rango sin cargar para esta situación / stack (pendiente del seed del PDF).</Empty>
      ) : (
        <>
          <HandGrid assignments={hands} actions={situation.actions} />
          <div style={layout.mono} data-testid="explorer-summary">
            {Object.entries(summary).map(([a, s]) => `${ACTION_LABELS[a] ?? a}: ${s.hands} manos / ${s.combos} combos`).join(' · ')}
            {user.data && ' · Tienes un rango custom para esta situación (Builder)'}
          </div>
        </>
      )}
    </>
  );
}
