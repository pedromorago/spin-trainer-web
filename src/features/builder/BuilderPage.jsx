import { useEffect, useMemo, useState } from 'react';
import { evaluateRange, normalizeRange, summarize } from '../../domain/range';
import { ACTION_LABELS } from '../../domain/actions';
import { useDefaultRange, useSaveUserRange, useSituations, useUserRange } from '../../shared/api/queries';
import { useSituationSelection } from '../../shared/ui/useSituationSelection';
import { HandGrid } from '../../shared/ui/HandGrid';
import { ActionPalette } from '../../shared/ui/ActionPalette';
import { SituationSelector, StackSelector } from '../../shared/ui/SituationSelector';
import { Empty, ErrorBox, Loading, layout } from '../../shared/ui/Feedback';
import { theme } from '../../shared/theme/theme';

export function BuilderPage() {
  const situations = useSituations();
  const sel = useSituationSelection(situations.data);
  const def = useDefaultRange(sel.situationKey, sel.stack);
  const userRange = useUserRange(sel.situationKey, sel.stack);
  const save = useSaveUserRange(sel.situationKey, sel.stack);

  const [selectedAction, setSelectedAction] = useState(null);
  const [draft, setDraft] = useState({});
  const [evaluation, setEvaluation] = useState(null);
  const [dirty, setDirty] = useState(false);

  // Al cambiar de situación/stack o cargar el rango custom, rehidratar el borrador.
  useEffect(() => {
    setDraft(userRange.data?.hands ?? {});
    setEvaluation(null);
    setDirty(false);
    setSelectedAction(sel.situation?.actions[0] ?? null);
  }, [sel.situationKey, sel.stack, sel.situation, userRange.data]);

  const paint = hand => {
    setDraft(prev => {
      const next = { ...prev };
      if (next[hand] === selectedAction) delete next[hand]; else next[hand] = selectedAction;
      return next;
    });
    setEvaluation(null);
    setDirty(true);
  };

  const evaluate = () => setEvaluation(evaluateRange(def.data?.hands ?? {}, draft, sel.situation.actions));

  const persist = () => {
    const hands = normalizeRange(draft, sel.situation.actions);
    save.mutate({ hands, version: userRange.data?.version }, { onSuccess: () => setDirty(false) });
  };

  const summary = useMemo(() => (sel.situation ? summarize(draft, sel.situation.actions) : {}), [draft, sel.situation]);

  if (situations.isLoading) return <Loading />;
  if (situations.error) return <ErrorBox error={situations.error} />;
  if (!sel.situation) return <Empty>No hay situaciones disponibles.</Empty>;

  const canCompare = Object.keys(def.data?.hands ?? {}).length > 0;

  return (
    <div style={layout.page}>
      <h2 style={{ margin: 0 }}>Builder</h2>
      <div style={layout.row}>
        <SituationSelector situations={situations.data} value={sel.situationKey} onChange={sel.setSituation} />
        <StackSelector stacks={sel.situation.stacks} value={sel.stack} onChange={sel.setStack} />
      </div>
      <ActionPalette actions={sel.situation.actions} selected={selectedAction} onSelect={setSelectedAction} />
      <ErrorBox error={userRange.error ?? save.error} />
      {userRange.isLoading ? <Loading /> : <HandGrid assignments={draft} onCellClick={paint} verdicts={evaluation?.verdicts} />}
      <div style={layout.mono} data-testid="builder-summary">
        {Object.entries(summary).map(([a, s]) => `${ACTION_LABELS[a] ?? a}: ${s.hands}`).join(' · ')}
        {userRange.data && ` · guardado v${userRange.data.version}`}{dirty && ' · sin guardar'}
      </div>
      <div style={layout.row}>
        <button style={layout.primary} onClick={persist} disabled={!dirty || save.isPending} data-testid="builder-save">
          {save.isPending ? 'Guardando…' : 'Guardar rango'}
        </button>
        <button style={layout.secondary} onClick={evaluate} disabled={!canCompare} data-testid="builder-evaluate"
          title={canCompare ? '' : 'Sin rango default cargado para comparar'}>Comparar con el rango correcto</button>
        <button style={layout.secondary} onClick={() => { setDraft({}); setEvaluation(null); setDirty(true); }}>Limpiar</button>
      </div>
      {evaluation && (
        <div data-testid="builder-evaluation" style={{ padding: theme.space.md, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.sm }}>
          <strong>{evaluation.correct} / {evaluation.total}</strong> manos correctas ({Math.round(evaluation.accuracy * 100)}%)
          <div style={layout.mono}>
            {Object.entries(evaluation.byAction).map(([a, s]) => `${ACTION_LABELS[a] ?? a}: ${s.correct}/${s.total}`).join(' · ')}
          </div>
        </div>
      )}
    </div>
  );
}
