import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router';
import { checkAnswer, nextQuestion, playableSpots } from '../../domain/quiz';
import { ACTION_LABELS } from '../../domain/actions';
import { dealCards } from '../../domain/cards';
import { comboKey } from '../../domain/selection';
import { hardHands } from '../../domain/stats';
import { tableSeats } from '../../domain/table';
import { useEffectiveRanges, useHandStats, useRecordAttempt } from '../../shared/api/queries';
import { useSession } from '../../shared/session/useSession';
import { ActionPalette } from '../../shared/ui/ActionPalette';
import { HandGrid } from '../../shared/ui/HandGrid';
import { PokerTable } from '../../shared/ui/PokerTable';
import { actionIndexForKey, isInteractive, isTextField } from '../../shared/ui/shortcuts';
import { Empty, ErrorBox, Loading } from '../../shared/ui/Feedback';
import { layout } from '../../shared/ui/styles';
import { colorFor } from '../../shared/theme/actionColors';
import { readableText } from '../../shared/theme/contrast';
import { theme } from '../../shared/theme/theme';
import { InfoTip } from '../../shared/ui/Tooltip';

const MODES = { normal: 'All hands', hard: 'Hard only' };
const SCOPES = { range: 'Range + boundary', all: 'All 169 hands' };
const EMPTY_ROWS = [];

/**
 * Quiz: table with the situation, answer with buttons or keys (1..9, 0), feedback with the correct range.
 * Each question comes from domain/quiz#nextQuestion over the spots of the selection (several with "Any").
 * The server grades again when recording the attempt (contract v0.2).
 */
export function QuizPage() {
  const { situations, selection } = useOutletContext();
  const effective = useEffectiveRanges();
  const handStats = useHandStats();
  const [mode, setMode] = useState('normal');
  const [scope, setScope] = useState('range');
  const hard = useMemo(() => hardHands(handStats.data ?? EMPTY_ROWS), [handStats.data]);

  if (effective.isLoading || (mode === 'hard' && handStats.isLoading)) return <Loading />;
  if (effective.error) return <ErrorBox error={effective.error} onRetry={effective.refetch} />;

  // Spots of the selection with an effective range (custom if it exists; ADR-0012).
  const spots = selection.combos.flatMap(c => {
    const range = effective.ranges.get(comboKey(c));
    const situation = situations.find(s => s.key === c.situation);
    return range ? [{ situation: c.situation, stack: c.stack, actions: situation.actions, hands: range.hands, source: range.source }] : [];
  });
  const spotKeys = new Set(playableSpots(spots).map(comboKey));
  const hardHere = hard.filter(h => spotKeys.has(comboKey(h)));

  const control = active => ({
    ...layout.secondary, padding: `${theme.space.xs} ${theme.space.md}`,
    background: active ? theme.colors.accentSoft : 'transparent', borderColor: active ? theme.colors.accent : theme.colors.border
  });
  const select = { ...control(false), background: theme.colors.bgSunken, color: theme.colors.text };

  return (
    <div style={layout.page}>
      <div style={{ ...layout.row, justifyContent: 'space-between' }}>
        <h2 style={layout.title}>Quiz</h2>
        <div style={{ ...layout.row, gap: theme.space.sm }}>
          <div role="group" aria-label="Mode" style={{ display: 'flex', gap: theme.space.xs }}>
            {Object.entries(MODES).map(([k, label]) => (
              <button key={k} type="button" style={control(mode === k)} aria-pressed={mode === k} onClick={() => setMode(k)}
                data-testid={`quiz-mode-${k}`}>
                {label}{k === 'hard' ? ` (${hardHere.length})` : ''}
              </button>
            ))}
          </div>
          <select style={select} value={scope} onChange={e => setScope(e.target.value)} disabled={mode === 'hard'}
            aria-label="Hands to ask" data-testid="quiz-scope">
            {Object.entries(SCOPES).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
          <InfoTip label="About the Quiz modes" testId="quiz-info">
            <strong>All hands</strong> asks any hand of the selection. <strong>Hard only</strong> asks the hands you have
            missed twice, until you get them right. <strong>Range + boundary</strong> asks the hands the range plays plus
            their neighbors that it folds (where mistakes happen); <strong>All 169 hands</strong> asks any of them.
          </InfoTip>
        </div>
      </div>
      {/* Without the stats there is no pool of hard hands: an error, not "no hard hands left". */}
      {mode === 'hard' && handStats.isLoadingError ? <ErrorBox error={handStats.error} onRetry={handStats.refetch} /> : (
        // The key resets the round when the selection, mode or scope changes (no setState in effects).
        <QuizRound key={`${selection.situationKey}@${selection.stack}@${mode}@${scope}`}
          situations={situations} spots={spots} hard={hardHere} mode={mode} scope={scope} />
      )}
    </div>
  );
}

function QuizRound({ situations, spots, hard, mode, scope }) {
  const record = useRecordAttempt();
  const { record: recordInSession } = useSession();
  const deal = q => q && { ...q, cards: dealCards(q.hand) };
  const [question, setQuestion] = useState(() => deal(nextQuestion({ spots, mode, scope, hard })));
  const [result, setResult] = useState(null);
  const [round, setRound] = useState({ correct: 0, total: 0 });
  const answers = useRef(null);
  const focusAnswers = useRef(false);

  const spot = question && spots.find(s => comboKey(s) === comboKey(question));
  const situation = spot && situations.find(s => s.key === spot.situation);

  const answer = given => {
    if (result || !spot) return;
    const r = checkAnswer(spot, question.hand, given);
    setResult(r);
    setRound(s => ({ correct: s.correct + (r.correct ? 1 : 0), total: s.total + 1 }));
    recordInSession(r.correct);
    // The server grades against the effective range (contract v0.2); the local feedback is immediate.
    record.mutate({ situation: spot.situation, stack: spot.stack, hand: question.hand, given });
  };
  const next = () => {
    if (!result) return;
    setResult(null);
    setQuestion(deal(nextQuestion({ spots, mode, scope, hard, previous: question })));
    focusAnswers.current = true;
  };
  // "Next hand" disappears with the feedback: the focus goes back to the answers instead of the page body.
  useEffect(() => {
    if (!focusAnswers.current) return;
    focusAnswers.current = false;
    answers.current?.querySelector('button:enabled')?.focus();
  }, [question]);

  // Shortcuts: 1..9 and 0 answer; Enter or → moves to the next one. Ignored with focus on fields or with modifiers,
  // and Enter is left to the focused link or button (the "Next hand" button handles it itself).
  const onKey = useEffectEvent(e => {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || isTextField(e.target)) return;
    const index = spot ? actionIndexForKey(e.key, spot.actions.length) : -1;
    if (!result && index >= 0) {
      e.preventDefault();
      answer(spot.actions[index]);
    } else if (result && (e.key === 'ArrowRight' || (e.key === 'Enter' && !isInteractive(e.target)))) {
      e.preventDefault();
      next();
    }
  });
  useEffect(() => {
    const handler = e => onKey(e);
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!question || !spot) {
    return (
      <Empty>
        {mode === 'hard'
          ? 'No hard hands left in this selection: miss a hand twice and it shows up here; get it right and it leaves the pool.'
          : 'No range loaded for this selection: there is nothing to ask.'}
      </Empty>
    );
  }

  const { seats, pot } = tableSeats(situation, spot.stack);
  const pct = round.total ? Math.round((round.correct / round.total) * 100) : 0;
  const poolInfo = mode === 'hard' ? `${hard.length} hard hands` : `${playableSpots(spots).length} spots`;
  const label = action => ACTION_LABELS[action] ?? action;
  // Short announcement for screen readers; the feedback box (with a 169-cell grid) is not a live region.
  const announcement = !result ? ''
    : `${result.correct ? 'Correct' : 'Wrong'}. ${question.hand}: ${label(result.expected)}${result.correct ? '' : `; you answered ${label(result.given)}`}.`;

  return (
    <>
      <div style={{ ...layout.row, gap: theme.space.md }}>
        <strong style={{ fontFamily: theme.font.display, fontSize: 22, letterSpacing: 1 }} data-testid="quiz-spot">
          {situation.label} · {spot.stack} BB
        </strong>
        <span style={{ fontFamily: theme.font.mono, color: theme.colors.textMuted }}>
          Your hand: <strong style={{ color: theme.colors.text }} data-testid="quiz-hand">{question.hand}</strong>
        </span>
        {spot.source === 'user' && (
          <small style={{ color: theme.colors.accent }} data-testid="quiz-custom-range">Custom range</small>
        )}
      </div>
      <PokerTable seats={seats} pot={pot} heroCards={question.cards} stack={spot.stack} caption={situation.label} />
      <ErrorBox error={record.error} />
      <div ref={answers}>
        <ActionPalette actions={spot.actions} selected={result?.given} onSelect={answer} disabled={!!result} shortcuts />
      </div>
      <div role="status" style={layout.visuallyHidden} data-testid="quiz-announcement">{announcement}</div>
      {result && (
        <div data-testid="quiz-feedback" style={{ display: 'flex', gap: theme.space.lg, flexWrap: 'wrap', alignItems: 'flex-start',
          padding: theme.space.md, borderRadius: theme.radius.md,
          border: `1px solid ${result.correct ? theme.colors.success : theme.colors.danger}` }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.space.sm, flex: '1 1 220px' }}>
            <strong style={{ color: result.correct ? theme.colors.success : theme.colors.danger, fontSize: theme.font.sizeLg }}>
              {result.correct ? 'Correct' : 'Wrong'}
            </strong>
            <span>
              {question.hand}:{' '}
              <span data-testid="quiz-expected" style={{ padding: '1px 8px', borderRadius: theme.radius.sm, fontWeight: 700,
                background: colorFor(result.expected), color: readableText(colorFor(result.expected)) }}>
                {label(result.expected)}
              </span>
              {!result.correct && <> (you answered {label(result.given)})</>}
            </span>
            <button type="button" style={{ ...layout.primary, alignSelf: 'flex-start' }} onClick={next} autoFocus
              aria-keyshortcuts="Enter ArrowRight" data-testid="quiz-next">
              Next hand <kbd aria-hidden="true" style={{ fontFamily: theme.font.mono, opacity: 0.7 }}>↵</kbd>
            </button>
          </div>
          <HandGrid assignments={spot.hands} actions={spot.actions} cellSize={16} showLabels={false} highlight={question.hand}
            label={`Correct range for ${situation.label} · ${spot.stack} BB`} />
        </div>
      )}
      <small style={layout.mono} data-testid="quiz-stats">
        Round: {round.correct} / {round.total} ({pct}%) · {poolInfo}
      </small>
    </>
  );
}
