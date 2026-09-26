import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router';
import { ERASE, evaluateRange, paintHand, summarize } from '../../domain/range';
import { ACTION_LABELS, fallbackAction } from '../../domain/actions';
import { playableSpots } from '../../domain/quiz';
import { comboKey, pickCombo } from '../../domain/selection';
import { useEffectiveRanges } from '../../shared/api/queries';
import { HandGrid } from '../../shared/ui/HandGrid';
import { ActionPalette } from '../../shared/ui/ActionPalette';
import { VerdictLegend } from '../../shared/ui/VerdictLegend';
import { Empty, ErrorBox, Loading } from '../../shared/ui/Feedback';
import { layout } from '../../shared/ui/styles';
import { colorFor } from '../../shared/theme/actionColors';
import { theme } from '../../shared/theme/theme';

const pct = x => `${Math.round(x * 100)}%`;

/**
 * Builder: self-assessment exercise. You build the range of a situation and stack from memory and check it against
 * the effective range (custom if it exists, otherwise the PDF one; ADR-0012). Nothing is persisted.
 * The question is the current selection or a random combination ("Nueva pregunta").
 */
export function BuilderPage() {
  const { situations, selection } = useOutletContext();
  const effective = useEffectiveRanges();
  const [pickedBrush, setPickedBrush] = useState(null);

  if (effective.isLoading) return <Loading />;
  if (effective.error) return <ErrorBox error={effective.error} />;

  const toSpot = combo => {
    const range = effective.ranges.get(comboKey(combo));
    const situation = situations.find(s => s.key === combo.situation);
    return range && situation ? { situation: combo.situation, stack: combo.stack, actions: situation.actions, hands: range.hands, source: range.source } : null;
  };
  const allSpots = playableSpots([...effective.ranges.values()].map(toSpot).filter(Boolean));
  const selectionSpots = playableSpots(selection.combos.map(toSpot).filter(Boolean));

  return (
    <div style={layout.page}>
      <h2 style={layout.title}>Builder</h2>
      {/* The key resets the question when the selection changes (no setState in effects). */}
      <BuilderQuestion key={`${selection.situationKey}@${selection.stack}`} situations={situations} selection={selection}
        allSpots={allSpots} selectionSpots={selectionSpots} toSpot={toSpot} pickedBrush={pickedBrush} onPickBrush={setPickedBrush} />
    </div>
  );
}

function BuilderQuestion({ situations, selection, allSpots, selectionSpots, toSpot, pickedBrush, onPickBrush }) {
  // Question picked with "Nueva pregunta"; null = the concrete selection. With "Any" it starts with a random one.
  const [question, setQuestion] = useState(() => (selection.isAny ? pickCombo(selectionSpots) : null));
  const combo = question ?? (selection.isAny ? null : selection.combos[0]);
  const spot = combo && toSpot(combo);
  const pool = selection.isAny ? selectionSpots : allSpots;
  const canPickAnother = pool.some(s => !combo || comboKey(s) !== comboKey(combo));
  const newQuestion = () => setQuestion(pickCombo(pool, Math.random, combo));

  const situation = combo && situations.find(s => s.key === combo.situation);
  // Derived brush: kept across questions while it is still valid (the eraser always is).
  const brush = spot && (pickedBrush === ERASE || spot.actions.includes(pickedBrush) ? pickedBrush : spot.actions[0]);

  return (
    <>
      <div style={{ ...layout.row, gap: theme.space.md }}>
        {combo && (
          <strong style={{ fontFamily: theme.font.display, fontSize: 22, letterSpacing: 1 }} data-testid="builder-question">
            {situation.label} · {combo.stack} BB
          </strong>
        )}
        <button type="button" style={layout.secondary} onClick={newQuestion} disabled={!canPickAnother}
          data-testid="builder-new-question">Nueva pregunta</button>
        {question && !selection.isAny && (
          <button type="button" style={layout.secondary} onClick={() => setQuestion(null)} data-testid="builder-back-to-selection">
            Volver a la selección
          </button>
        )}
        {spot?.source === 'user' && (
          <small style={{ color: theme.colors.accent }} data-testid="builder-custom-target">Se verifica contra tu rango personalizado</small>
        )}
      </div>
      {!spot ? (
        <Empty>
          {pool.length ? 'Esta combinación no tiene rango con el que comparar: pulsa "Nueva pregunta".' : 'Todavía no hay rangos cargados con los que practicar.'}
        </Empty>
      ) : (
        <>
          <ActionPalette actions={spot.actions} selected={brush} onSelect={onPickBrush} eraser />
          {/* The key resets the draft when the question changes. */}
          <BuilderExercise key={comboKey(spot)} spot={spot} brush={brush} onNewQuestion={canPickAnother ? newQuestion : null} />
        </>
      )}
    </>
  );
}

function BuilderExercise({ spot, brush, onNewQuestion }) {
  const [draft, setDraft] = useState({});
  const [evaluation, setEvaluation] = useState(null);
  const [showSolution, setShowSolution] = useState(false);
  const actions = spot.actions;
  const summary = useMemo(() => summarize(draft, actions), [draft, actions]);

  const paint = hand => {
    setDraft(d => paintHand(d, hand, brush, actions));
    setEvaluation(null);
  };
  const verify = () => { setEvaluation(evaluateRange(spot.hands, draft, actions)); setShowSolution(false); };
  const retry = () => { setDraft({}); setEvaluation(null); setShowSolution(false); };

  return (
    <div style={{ display: 'flex', gap: theme.space.xl, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <div style={{ ...layout.page, gap: theme.space.md, flex: '1 1 480px', minWidth: 0 }}>
        <HandGrid assignments={showSolution ? spot.hands : draft} actions={actions} onPaint={showSolution ? undefined : paint}
          verdicts={evaluation?.verdicts} label={showSolution ? 'Solución' : 'Tu rango'} />
        <div style={layout.mono} data-testid="builder-summary">
          {Object.entries(summary).map(([a, s]) => `${ACTION_LABELS[a] ?? a}: ${s.hands}`).join(' · ')}
        </div>
        <div style={layout.row}>
          <button type="button" style={layout.primary} onClick={verify} data-testid="builder-evaluate">Verificar</button>
          {evaluation && (
            <button type="button" style={layout.secondary} onClick={() => setShowSolution(v => !v)} aria-pressed={showSolution}
              data-testid="builder-toggle-solution">{showSolution ? 'Ver mi rango' : 'Ver solución'}</button>
          )}
          <button type="button" style={layout.secondary} onClick={retry} data-testid="builder-clear">
            {evaluation ? 'Reintentar' : 'Limpiar'}
          </button>
          {onNewQuestion && evaluation && (
            <button type="button" style={layout.secondary} onClick={onNewQuestion} data-testid="builder-next">Nueva pregunta</button>
          )}
        </div>
      </div>
      {evaluation && <EvaluationPanel evaluation={evaluation} actions={actions} />}
    </div>
  );
}

/** Score over the played hands, verdict legend and breakdown by expected action. */
function EvaluationPanel({ evaluation, actions }) {
  const { score, byKind, byAction } = evaluation;
  const implicit = fallbackAction(actions);
  const row = { display: 'grid', gridTemplateColumns: '12px 1fr auto auto', gap: theme.space.sm, alignItems: 'center', fontSize: theme.font.sizeSm };

  return (
    <aside aria-label="Resultado" data-testid="builder-evaluation"
      style={{ display: 'flex', flexDirection: 'column', gap: theme.space.md, flex: '0 1 320px', minWidth: 260, padding: theme.space.md,
        border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.md, background: theme.colors.bgElevated }}>
      <div>
        <div style={{ fontFamily: theme.font.display, letterSpacing: 1, color: theme.colors.textMuted }}>Puntuación</div>
        <div style={{ fontFamily: theme.font.mono, fontSize: theme.font.sizeXl, fontWeight: 700, color: theme.colors.accentStrong }}
          data-testid="builder-score">{score.correct} / {score.total} · {pct(score.accuracy)}</div>
        <small style={{ color: theme.colors.textMuted }} data-testid="builder-accuracy-169">
          Manos jugadas en tu rango o en el correcto. Sobre las 169: {evaluation.correct}/169 ({pct(evaluation.accuracy)}).
        </small>
      </div>
      <VerdictLegend byKind={byKind} />
      <div role="table" aria-label="Desglose por acción" style={{ display: 'flex', flexDirection: 'column', gap: theme.space.xs }}>
        {actions.filter(a => byAction[a]).map(a => (
          <div role="row" key={a} style={{ ...row, opacity: a === implicit ? 0.7 : 1 }} data-testid={`builder-action-${a}`}>
            <span role="cell" aria-hidden="true" style={{ width: 12, height: 12, borderRadius: 3, background: colorFor(a) }} />
            <span role="cell">{ACTION_LABELS[a] ?? a}</span>
            <span role="cell" style={{ fontFamily: theme.font.mono }}>{byAction[a].correct}/{byAction[a].total}</span>
            <strong role="cell" style={{ fontFamily: theme.font.mono }}>{pct(byAction[a].correct / byAction[a].total)}</strong>
          </div>
        ))}
      </div>
    </aside>
  );
}
