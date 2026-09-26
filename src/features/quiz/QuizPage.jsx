import { useState } from 'react';
import { useOutletContext } from 'react-router';
import { createQuizEngine, quizPool } from '../../domain/quiz';
import { ACTION_LABELS } from '../../domain/actions';
import { comboKey } from '../../domain/selection';
import { useDefaultRange, useRecordAttempt } from '../../shared/api/queries';
import { useSession } from '../../shared/session/useSession';
import { ActionPalette } from '../../shared/ui/ActionPalette';
import { ComboPicker } from '../../shared/ui/ComboPicker';
import { Empty, ErrorBox, Loading } from '../../shared/ui/Feedback';
import { layout } from '../../shared/ui/styles';
import { colorFor } from '../../shared/theme/actionColors';
import { theme } from '../../shared/theme/theme';

const SCOPES = { range: 'Rango + frontera', all: 'Las 169 manos' };

export function QuizPage() {
  const { situations, selection } = useOutletContext();
  const [scope, setScope] = useState('range');
  const select = {
    padding: `${theme.space.sm} ${theme.space.md}`, background: theme.colors.bgSunken, color: theme.colors.text,
    border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.sm, fontSize: theme.font.sizeSm
  };

  return (
    <div style={layout.page}>
      <div style={{ ...layout.row, justifyContent: 'space-between' }}>
        <h2 style={layout.title}>Quiz</h2>
        <select style={select} value={scope} onChange={e => setScope(e.target.value)} aria-label="Manos a preguntar" data-testid="quiz-scope">
          {Object.entries(SCOPES).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>
      </div>
      {/* La key reinicia la elección de combinación al cambiar la selección. */}
      <ComboPicker key={`${selection.situationKey}@${selection.stack}`}
        situations={situations} combos={selection.combos} random={selection.isAny}>
        {(combo, situation) => <QuizCombo key={comboKey(combo)} situation={situation} stack={combo.stack} scope={scope} />}
      </ComboPicker>
    </div>
  );
}

function QuizCombo({ situation, stack, scope }) {
  const def = useDefaultRange(situation.key, stack);
  if (def.isLoading) return <Loading />;
  if (def.error) return <ErrorBox error={def.error} />;
  const range = def.data?.hands ?? {};
  if (quizPool(range, situation.actions).length === 0) {
    return <Empty>Rango sin cargar para esta situación / stack: no hay nada que preguntar.</Empty>;
  }
  // La key reinicia la ronda al cambiar el alcance (sin setState en efectos).
  return <QuizSession key={scope} situation={situation} stack={stack} range={range} scope={scope} />;
}

function QuizSession({ situation, stack, range, scope }) {
  const record = useRecordAttempt();
  const { record: recordInSession } = useSession();
  const [engine] = useState(() => createQuizEngine({ range, actions: situation.actions, scope }));
  const [hand, setHand] = useState(() => engine.nextHand());
  const [result, setResult] = useState(null);
  const [round, setRound] = useState({ correct: 0, total: 0 });

  const answer = given => {
    if (result) return;
    const r = engine.check(hand, given);
    setResult(r);
    setRound(s => ({ correct: s.correct + (r.correct ? 1 : 0), total: s.total + 1 }));
    recordInSession(r.correct);
    record.mutate({ situation: situation.key, stack, hand, expected: r.expected, given });
  };

  const next = () => { setResult(null); setHand(engine.nextHand()); };

  const handBox = { fontFamily: theme.font.mono, fontSize: 48, fontWeight: 700, padding: `${theme.space.lg} ${theme.space.xl}`,
    alignSelf: 'flex-start', background: theme.colors.bgElevated, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.md };
  const pct = round.total ? Math.round((round.correct / round.total) * 100) : 0;

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
        Ronda: {round.correct} / {round.total} ({pct}%) · {engine.size} manos en juego
      </small>
    </>
  );
}
