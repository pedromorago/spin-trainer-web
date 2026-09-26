import { summarize } from '../../domain/range';
import { ACTION_LABELS } from '../../domain/actions';
import { useDefaultRange, useUserRange } from '../../shared/api/queries';
import { useSituationSelection } from '../../shared/ui/useSituationSelection';
import { HandGrid } from '../../shared/ui/HandGrid';
import { ActionPalette } from '../../shared/ui/ActionPalette';
import { SituationSelector, StackSelector } from '../../shared/ui/SituationSelector';
import { Empty, ErrorBox, Loading, layout } from '../../shared/ui/Feedback';
import { theme } from '../../shared/theme/theme';

export function ExplorerPage() {
  const sel = useSituationSelection();
  const def = useDefaultRange(sel.situationKey, sel.stack);
  const user = useUserRange(sel.situationKey, sel.stack);

  if (sel.isLoading) return <Loading />;
  if (sel.error) return <ErrorBox error={sel.error} />;
  if (!sel.situation) return <Empty>Situación desconocida.</Empty>;

  const hands = def.data?.hands ?? {};
  const isEmpty = Object.keys(hands).length === 0;
  const summary = summarize(hands, sel.situation.actions);

  return (
    <div style={layout.page}>
      <h2 style={{ margin: 0 }}>Explorer</h2>
      <div style={layout.row}>
        <SituationSelector situations={sel.situations} value={sel.situationKey} onChange={sel.setSituation} />
        <StackSelector stacks={sel.situation.stacks} value={sel.stack} onChange={sel.setStack} />
      </div>
      {sel.situation.notes && <small style={{ color: theme.colors.textMuted }}>{sel.situation.notes}</small>}
      <ActionPalette actions={sel.situation.actions} />
      <ErrorBox error={def.error} />
      {def.isLoading ? <Loading /> : isEmpty ? (
        <Empty>Rango sin cargar para esta situación / stack. Se cargan del PDF en la Fase 3.</Empty>
      ) : (
        <>
          <HandGrid assignments={hands} />
          <div style={layout.mono} data-testid="explorer-summary">
            {Object.entries(summary).map(([a, s]) => `${ACTION_LABELS[a] ?? a}: ${s.hands} manos / ${s.combos} combos`).join(' · ')}
            {user.data && ' · Tienes un rango custom para esta situación (Builder)'}
          </div>
        </>
      )}
    </div>
  );
}
