import { useEffect, useMemo, useState } from 'react';
import { createQuizEngine } from '../../domain/quiz';
import { ACTION_LABELS } from '../../domain/actions';
import { useDefaultRange, useRecordAttempt, useSituations } from '../../shared/api/queries';
import { useSituationSelection } from '../../shared/ui/useSituationSelection';
import { ActionPalette } from '../../shared/ui/ActionPalette';
import { SituationSelector, StackSelector } from '../../shared/ui/SituationSelector';
import { Empty, ErrorBox, Loading } from '../../shared/ui/Feedback';
import { layout } from '../../shared/ui/styles';
import { colorFor } from '../../shared/theme/actionColors';
import { theme } from '../../shared/theme/theme';

export function QuizPage() {
  const situations = useSituations();
  const sel = useSituationSelection(situations.data);
  const def = useDefaultRange(sel.situationKey, sel.stack);
  const record = useRecordAttempt();
  const [hand, setHand] = useState(null);
  const [result, setResult] = useState(null);
  const [session, setSession] = useState({ correct: 0, total: 0 });

  const engine = useMemo(() => {
    if (!sel.situation || !def.data) return null;
    const range = def.data.hands;
    return createQuizEngine({ range, actions: sel.situation.actions, onlyListed: Object.keys(range).length > 0 });
  }, [sel.situation, def.data]);

  useEffect(() => {
    setSession({ correct: 0, total: 0 });
    setResult(null);
    setHand(engine ? engine.nextHand() : null);
  }, [engine]);

  const answer = given => {
    if (!engine || result) return;
    const r = engine.check(hand, given);
    setResult(r);
    setSession(s => ({ correct: s.correct + (r.correct ? 1 : 0), total: s.total + 1 }));
    record.mutate({ situation: sel.situationKey, stack: sel.stack, hand, expected: r.expected, given, correct: r.correct });
  };

  const next = () => { setResult(null); setHand(engine.nextHand()); };

  if (situations.isLoading) return <Loading />;
  if (situations.error) return <ErrorBox error={situations.error} />;
  if (!sel.situation) return <Empty>No hay situaciones disponibles.</Empty>;

  const handBox = { fontFamily: theme.font.mono, fontSize: 48, fontWeight: 700, padding: `${theme.space.lg} ${theme.space.xl}`,
    alignSelf: 'flex-start', background: theme.colors.bgElevated, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.md };
  const pct = session.total ? Math.round((session.correct / session.total) * 100) : 0;

  return (
    <div style={layout.page}>
      <h2 style={{ margin: 0 }}>Quiz</h2>
      <div style={layout.row}>
        <SituationSelector situations={situations.data} value={sel.situationKey} onChange={sel.setSituation} />
        <StackSelector stacks={sel.situation.stacks} value={sel.stack} onChange={sel.setStack} />
      </div>
      <ErrorBox error={def.error ?? record.error} />
      {def.isLoading || !hand ? <Loading /> : (
        <>
          <div style={handBox} data-testid="quiz-hand">{hand}</div>
          <ActionPalette actions={sel.situation.actions} selected={result?.given} onSelect={answer} disabled={!!result} />
          {result && (
            <div data-testid="quiz-feedback" style={{ padding: theme.space.md, borderRadius: theme.radius.sm,
              border: `1px solid ${result.correct ? theme.colors.success : theme.colors.danger}`,
              color: result.correct ? theme.colors.success : theme.colors.danger }}>
              {result.correct ? 'Correcto' : 'Incorrecto'}: la acción es{' '}
              <span style={{ color: colorFor(result.expected) }}>{ACTION_LABELS[result.expected] ?? result.expected}</span>
            </div>
          )}
          {result && <button style={{ ...layout.primary, alignSelf: 'flex-start' }} onClick={next} data-testid="quiz-next">Siguiente mano</button>}
          <small style={layout.mono} data-testid="quiz-stats">Sesión: {session.correct} / {session.total} ({pct}%)</small>
        </>
      )}
    </div>
  );
}
