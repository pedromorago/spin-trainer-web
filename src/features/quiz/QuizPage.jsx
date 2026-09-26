import { useState } from 'react';
import { createQuizEngine, quizPool } from '../../domain/quiz';
import { ACTION_LABELS } from '../../domain/actions';
import { useDefaultRange, useRecordAttempt, useSituations } from '../../shared/api/queries';
import { useSituationSelection } from '../../shared/ui/useSituationSelection';
import { ActionPalette } from '../../shared/ui/ActionPalette';
import { SituationSelector, StackSelector } from '../../shared/ui/SituationSelector';
import { Empty, ErrorBox, Loading } from '../../shared/ui/Feedback';
import { layout } from '../../shared/ui/styles';
import { colorFor } from '../../shared/theme/actionColors';
import { theme } from '../../shared/theme/theme';

const SCOPES = { range: 'Rango + frontera', all: 'Las 169 manos' };

export function QuizPage() {
  const situations = useSituations();
  const sel = useSituationSelection(situations.data);
  const def = useDefaultRange(sel.situationKey, sel.stack);
  const [scope, setScope] = useState('range');

  if (situations.isLoading) return <Loading />;
  if (situations.error) return <ErrorBox error={situations.error} />;
  if (!sel.situation) return <Empty>No hay situaciones disponibles.</Empty>;

  const range = def.data?.hands ?? {};
  const rangeLoaded = quizPool(range, sel.situation.actions).length > 0;
  const select = {
    padding: `${theme.space.sm} ${theme.space.md}`, background: theme.colors.bgElevated, color: theme.colors.text,
    border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.sm, fontSize: theme.font.sizeSm
  };

  return (
    <div style={layout.page}>
      <h2 style={{ margin: 0 }}>Quiz</h2>
      <div style={layout.row}>
        <SituationSelector situations={situations.data} value={sel.situationKey} onChange={sel.setSituation} />
        <StackSelector stacks={sel.situation.stacks} value={sel.stack} onChange={sel.setStack} />
        <select style={select} value={scope} onChange={e => setScope(e.target.value)} aria-label="Manos a preguntar" data-testid="quiz-scope">
          {Object.entries(SCOPES).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>
      </div>
      <ErrorBox error={def.error} />
      {def.isLoading ? <Loading /> : !rangeLoaded ? (
        <Empty>Rango sin cargar para esta situación / stack: no hay nada que preguntar.</Empty>
      ) : (
        // La key reinicia la sesión al cambiar de situación, stack o alcance (sin setState en efectos).
        <QuizSession key={`${sel.situationKey}@${sel.stack}@${scope}`}
          situation={sel.situation} stack={sel.stack} range={range} scope={scope} />
      )}
    </div>
  );
}

function QuizSession({ situation, stack, range, scope }) {
  const record = useRecordAttempt();
  const [engine] = useState(() => createQuizEngine({ range, actions: situation.actions, scope }));
  const [hand, setHand] = useState(() => engine.nextHand());
  const [result, setResult] = useState(null);
  const [session, setSession] = useState({ correct: 0, total: 0 });

  const answer = given => {
    if (result) return;
    const r = engine.check(hand, given);
    setResult(r);
    setSession(s => ({ correct: s.correct + (r.correct ? 1 : 0), total: s.total + 1 }));
    record.mutate({ situation: situation.key, stack, hand, expected: r.expected, given });
  };

  const next = () => { setResult(null); setHand(engine.nextHand()); };

  const handBox = { fontFamily: theme.font.mono, fontSize: 48, fontWeight: 700, padding: `${theme.space.lg} ${theme.space.xl}`,
    alignSelf: 'flex-start', background: theme.colors.bgElevated, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.md };
  const pct = session.total ? Math.round((session.correct / session.total) * 100) : 0;

  return (
    <>
      <ErrorBox error={record.error} />
      <div style={handBox} data-testid="quiz-hand" aria-label={`Mano: ${hand}`}>{hand}</div>
      <ActionPalette actions={situation.actions} selected={result?.given} onSelect={answer} disabled={!!result} />
      <div role="status" aria-live="polite">
        {result && (
          <div data-testid="quiz-feedback" style={{ padding: theme.space.md, borderRadius: theme.radius.sm,
            border: `1px solid ${result.correct ? theme.colors.success : theme.colors.danger}`,
            color: result.correct ? theme.colors.success : theme.colors.danger }}>
            {result.correct ? 'Correcto' : 'Incorrecto'}: la acción es{' '}
            <span style={{ color: colorFor(result.expected) }}>{ACTION_LABELS[result.expected] ?? result.expected}</span>
          </div>
        )}
      </div>
      {result && <button style={{ ...layout.primary, alignSelf: 'flex-start' }} onClick={next} data-testid="quiz-next">Siguiente mano</button>}
      <small style={layout.mono} data-testid="quiz-stats">
        Sesión: {session.correct} / {session.total} ({pct}%) · {engine.size} manos en juego
      </small>
    </>
  );
}
