import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router';
import { ERASE, evaluateRange, explicitHands, paintHand, summarize } from '../../domain/range';
import { ACTION_LABELS } from '../../domain/actions';
import { comboKey } from '../../domain/selection';
import { useEffectiveRange } from '../../shared/api/queries';
import { HandGrid } from '../../shared/ui/HandGrid';
import { ActionPalette } from '../../shared/ui/ActionPalette';
import { ComboPicker } from '../../shared/ui/ComboPicker';
import { Empty, ErrorBox, Loading } from '../../shared/ui/Feedback';
import { layout } from '../../shared/ui/styles';
import { theme } from '../../shared/theme/theme';

/**
 * Builder: ejercicio de autoevaluación. Construyes el rango de memoria y lo verificas contra el rango efectivo
 * (custom si existe, si no el del PDF; ADR-0012). No persiste nada: guardar rangos es cosa del Explorer.
 */
export function BuilderPage() {
  const { situations, selection } = useOutletContext();
  const [pickedBrush, setPickedBrush] = useState(null);

  return (
    <div style={layout.page}>
      <h2 style={layout.title}>Builder</h2>
      {/* La key reinicia la elección de combinación al cambiar la selección. */}
      <ComboPicker key={`${selection.situationKey}@${selection.stack}`}
        situations={situations} combos={selection.combos} random={selection.isAny}>
        {(combo, situation) => (
          <BuilderCombo key={comboKey(combo)} situation={situation} stack={combo.stack}
            pickedBrush={pickedBrush} onPickBrush={setPickedBrush} />
        )}
      </ComboPicker>
    </div>
  );
}

function BuilderCombo({ situation, stack, pickedBrush, onPickBrush }) {
  const effective = useEffectiveRange(situation.key, stack);
  // Pincel derivado: se conserva entre situaciones si sigue siendo válido (la goma siempre lo es).
  const brush = pickedBrush === ERASE || situation.actions.includes(pickedBrush) ? pickedBrush : situation.actions[0];

  if (effective.isLoading) return <Loading />;
  if (!effective.range && effective.error) return <ErrorBox error={effective.error} />;
  const target = effective.range?.hands ?? {};
  if (explicitHands(target, situation.actions).length === 0) {
    return <Empty>Rango sin cargar para esta situación / stack: no hay nada con qué comparar.</Empty>;
  }

  return (
    <>
      {effective.userRange && (
        <small style={{ color: theme.colors.accent }} data-testid="builder-custom-target">
          Se verifica contra tu rango personalizado (guardado en el Explorer).
        </small>
      )}
      <ActionPalette actions={situation.actions} selected={brush} onSelect={onPickBrush} eraser />
      <BuilderExercise situation={situation} target={target} brush={brush} />
    </>
  );
}

function BuilderExercise({ situation, target, brush }) {
  const [draft, setDraft] = useState({});
  const [evaluation, setEvaluation] = useState(null);
  const actions = situation.actions;
  const summary = useMemo(() => summarize(draft, actions), [draft, actions]);

  const paint = hand => {
    setDraft(d => paintHand(d, hand, brush, actions));
    setEvaluation(null);
  };

  return (
    <>
      <HandGrid assignments={draft} actions={actions} onPaint={paint} verdicts={evaluation?.verdicts} label="Tu rango" />
      <div style={layout.mono} data-testid="builder-summary">
        {Object.entries(summary).map(([a, s]) => `${ACTION_LABELS[a] ?? a}: ${s.hands}`).join(' · ')}
      </div>
      <div style={layout.row}>
        <button type="button" style={layout.primary} onClick={() => setEvaluation(evaluateRange(target, draft, actions))}
          data-testid="builder-evaluate">Verificar</button>
        <button type="button" style={layout.secondary} onClick={() => { setDraft({}); setEvaluation(null); }}
          data-testid="builder-clear">Limpiar</button>
      </div>
      {evaluation && (
        <div data-testid="builder-evaluation" style={{ padding: theme.space.md, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.sm }}>
          <strong>{evaluation.correct} / {evaluation.total}</strong> manos correctas ({Math.round(evaluation.accuracy * 100)}%)
          <div style={layout.mono}>
            {Object.entries(evaluation.byAction).map(([a, s]) => `${ACTION_LABELS[a] ?? a}: ${s.correct}/${s.total}`).join(' · ')}
          </div>
        </div>
      )}
    </>
  );
}
