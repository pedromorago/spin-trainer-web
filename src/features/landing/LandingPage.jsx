import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { dealCards } from '../../domain/cards';
import { checkAnswer, nextQuestion } from '../../domain/quiz';
import { tableSeats } from '../../domain/table';
import { ACTION_LABELS } from '../../domain/actions';
import { useShowcase } from '../../shared/api/queries';
import { useAuth } from '../../shared/auth/useAuth';
import { ActionPalette } from '../../shared/ui/ActionPalette';
import { ErrorBox, Loading } from '../../shared/ui/Feedback';
import { HandGrid } from '../../shared/ui/HandGrid';
import { PokerTable } from '../../shared/ui/PokerTable';
import { layout } from '../../shared/ui/styles';
import { theme } from '../../shared/theme/theme';
import { RedirectTo } from '../shell/RedirectTo';

const PREVIEW = { situation: 'btn_open', stack: 25 };
const TRY = { situation: 'bb_vs_sb_os', stack: 10 };
const REPOS = 'https://github.com/pedromorago';

const gutter = `clamp(${theme.space.md}, 4vw, ${theme.space.xl})`;
const container = { maxWidth: 1120, margin: '0 auto', padding: `0 ${gutter}` };
const card = { background: theme.colors.bgElevated, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.lg };
const h2 = { margin: 0, fontFamily: theme.font.display, fontWeight: 400, fontSize: 'clamp(30px, 4vw, 40px)', letterSpacing: 1.5,
  color: theme.colors.text, textWrap: 'balance' };
const lead = { margin: 0, color: theme.colors.textMuted, fontSize: 17, lineHeight: 1.6, maxWidth: '62ch' };
const eyebrow = { fontFamily: theme.font.mono, fontSize: theme.font.sizeXs, letterSpacing: 2, textTransform: 'uppercase',
  color: theme.colors.accent };
const ghost = { ...layout.secondary, textDecoration: 'none', display: 'inline-block' };
const navCta = { ...layout.primary, textDecoration: 'none' };
const cta = { ...layout.primary, textDecoration: 'none', display: 'inline-block', padding: `${theme.space.md} ${theme.space.xl}`, fontSize: 16 };

const MODES = [
  ['/explorer', 'Explorer', 'Every reference range on a 13×13 grid, with its combos, the split by action and the chart\'s tips. '
    + 'Paint your own adjustments and save them.'],
  ['/quiz', 'Quiz', 'A seat, two cards, a decision. Answer hand by hand against your range; the hands you miss feed a Hard only '
    + 'mode until you get them right.'],
  ['/builder', 'Builder', 'Paint a whole range from memory, then check it: every hand comes back correct, wrong, extra or missing.'],
  ['/stats', 'Stats', 'Accuracy over time and by situation, and the hands you miss most, so you know what to study next.']
];

/**
 * Public landing page (ADR-0022): shows the product before any sign-in. Everything on it is live, built from the app's
 * own components and the PDF ranges bundled with the web (useShowcase), so it needs neither an account nor the API.
 * Old links with a selection (/?s=…&stack=…) still go to the Explorer.
 */
export function LandingPage() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  if (params.has('s') || params.has('stack')) return <RedirectTo pathname="/explorer" />;
  return <Landing />;
}

function Landing() {
  const { user, demo } = useAuth();
  const showcase = useShowcase();
  const start = user && !demo ? 'Open the trainer' : 'Start training';
  const note = demo ? 'Free, no sign-up: your progress stays in this browser.'
    : user ? `Signed in as ${user.email}.` : 'Free. Sign in with Google to keep your progress.';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header style={{ ...container, width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: theme.space.md, flexWrap: 'wrap', paddingTop: theme.space.lg, paddingBottom: theme.space.lg }}>
        <span style={{ fontFamily: theme.font.display, fontSize: 28, letterSpacing: 2, color: theme.colors.accent }}>Spin Trainer</span>
        <nav aria-label="Landing" style={{ display: 'flex', gap: theme.space.lg, alignItems: 'center', flexWrap: 'wrap' }}>
          <a href="#features" style={{ color: theme.colors.textMuted }}>How it works</a>
          <Link to="/privacy" style={{ color: theme.colors.textMuted }}>Privacy</Link>
          <Link to="/explorer" style={navCta} data-testid="landing-start-top">{start}</Link>
        </nav>
      </header>

      <main style={{ flex: 1 }}>
        <section aria-labelledby="landing-title" style={{ ...container, display: 'grid', gap: theme.space.xl, alignItems: 'center',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', paddingTop: theme.space.xl, paddingBottom: 64 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.space.lg }}>
            <span style={eyebrow}>Spin &amp; Go · preflop trainer</span>
            <h1 id="landing-title" style={{ margin: 0, fontFamily: theme.font.display, fontWeight: 400, letterSpacing: 2,
              fontSize: 'clamp(48px, 8vw, 84px)', lineHeight: 0.95, color: theme.colors.text, textWrap: 'balance' }}>
              Know your preflop ranges <span style={{ color: theme.colors.accent }}>cold.</span>
            </h1>
            <p style={lead}>
              Spin Trainer turns the reference charts into practice: explore every range, answer hand by hand, rebuild ranges
              from memory and see exactly which hands you keep missing. 3-max and heads-up, from 4 to 25 big blinds.
            </p>
            <div style={{ display: 'flex', gap: theme.space.md, flexWrap: 'wrap', alignItems: 'center' }}>
              <Link to="/explorer" style={cta} data-testid="landing-start">{start}</Link>
              <a href="#try" style={ghost}>Try a hand</a>
            </div>
            <small style={{ color: theme.colors.textMuted }} data-testid="landing-note">{note}</small>
            {showcase.data && <Facts showcase={showcase.data} />}
          </div>
          <Preview showcase={showcase} />
        </section>

        <section id="try" aria-labelledby="try-title" style={{ background: 'rgba(0, 0, 0, 0.25)', borderTop: `1px solid ${theme.colors.borderSubtle}`,
          borderBottom: `1px solid ${theme.colors.borderSubtle}`, padding: '64px 0', scrollMarginTop: theme.space.lg }}>
          <div style={{ ...container, display: 'flex', flexDirection: 'column', gap: theme.space.lg }}>
            <span style={eyebrow}>No sign-up needed</span>
            <h2 id="try-title" style={h2}>Try a hand</h2>
            <p style={lead}>
              BB vs SB open-shove at 10 BB: the button folds and the small blind goes all-in. Call or fold? The answer comes
              from the chart, as in the Quiz.
            </p>
            {showcase.isLoading ? <Loading /> : showcase.error ? <ErrorBox error={showcase.error} onRetry={showcase.refetch} />
              : <TryAHand showcase={showcase.data} />}
          </div>
        </section>

        <section id="features" aria-labelledby="features-title" style={{ ...container, padding: `64px ${gutter}`, scrollMarginTop: theme.space.lg,
          display: 'flex', flexDirection: 'column', gap: theme.space.xl }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.space.md }}>
            <span style={eyebrow}>How it works</span>
            <h2 id="features-title" style={h2}>Four ways to train</h2>
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: theme.space.lg,
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))' }}>
            {MODES.map(([path, name, text], i) => (
              <li key={path} style={{ ...card, padding: theme.space.lg, display: 'flex', flexDirection: 'column', gap: theme.space.sm }}>
                <span style={{ fontFamily: theme.font.mono, color: theme.colors.accent }}>0{i + 1}</span>
                <h3 style={{ margin: 0, fontFamily: theme.font.display, fontWeight: 400, fontSize: 28, letterSpacing: 1 }}>{name}</h3>
                <p style={{ margin: 0, color: theme.colors.textMuted, lineHeight: 1.55, flex: 1 }}>{text}</p>
                <Link to={path} style={{ color: theme.colors.accent }}>Open {name} →</Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="open-title" style={{ ...container, paddingBottom: 64 }}>
          <div style={{ ...card, padding: `${theme.space.xl} ${gutter}`, display: 'grid', gap: theme.space.lg, alignItems: 'center',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.space.md }}>
              <h2 id="open-title" style={h2}>Built and tested in the open</h2>
              <p style={{ ...lead, fontSize: 15 }}>
                A personal project and a QA portfolio. The charts reach the app through versioned database migrations, the
                API is designed contract-first, and every change is tested end to end: the API contract, the business rules in
                Gherkin, the browser and accessibility.
              </p>
            </div>
            <div style={{ display: 'flex', gap: theme.space.md, flexWrap: 'wrap' }}>
              {[['spin-trainer-qa', 'Test suite'], ['spin-trainer-api', 'API'], ['spin-trainer-web', 'Web app']].map(([repo, label]) => (
                <a key={repo} href={`${REPOS}/${repo}`} target="_blank" rel="noopener noreferrer" style={ghost}>{label} on GitHub</a>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer style={{ ...container, width: '100%', display: 'flex', justifyContent: 'space-between', gap: theme.space.md, flexWrap: 'wrap',
        paddingTop: theme.space.lg, paddingBottom: theme.space.lg, borderTop: `1px solid ${theme.colors.borderSubtle}`,
        color: theme.colors.textMuted, fontSize: theme.font.sizeSm }}>
        <span>Spin Trainer · a personal project by Pedro Morago</span>
        <span style={{ display: 'flex', gap: theme.space.lg }}>
          <Link to="/privacy" style={{ color: theme.colors.textMuted }}>Privacy</Link>
          <a href={REPOS} target="_blank" rel="noopener noreferrer" style={{ color: theme.colors.textMuted }}>GitHub</a>
        </span>
      </footer>
    </div>
  );
}

/** The catalog's size, counted from the data (never a hard-coded claim). */
function Facts({ showcase }) {
  const facts = [[showcase.situations.length, 'situations'], [Object.keys(showcase.ranges).length, 'reference ranges'], [169, 'hands each']];
  return (
    <dl style={{ display: 'flex', gap: theme.space.xl, margin: 0, flexWrap: 'wrap' }} data-testid="landing-facts">
      {facts.map(([value, label]) => (
        // dt before dd in the markup, the value on top on screen.
        <div key={label} style={{ display: 'flex', flexDirection: 'column-reverse' }}>
          <dt style={{ color: theme.colors.textMuted, fontSize: theme.font.sizeSm }}>{label}</dt>
          <dd style={{ margin: 0, fontFamily: theme.font.mono, fontSize: theme.font.sizeXl, fontWeight: 700, color: theme.colors.accentStrong }}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The reference chart of one spot, as the Explorer shows it (read-only). */
function Preview({ showcase }) {
  const situation = showcase.data?.situations.find(s => s.key === PREVIEW.situation);
  const hands = showcase.data?.ranges[`${PREVIEW.situation}@${PREVIEW.stack}`];
  return (
    <figure style={{ ...card, margin: 0, padding: theme.space.lg, display: 'flex', flexDirection: 'column', gap: theme.space.md,
      boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45)', minWidth: 0 }} data-testid="landing-preview">
      <figcaption style={{ display: 'flex', justifyContent: 'space-between', gap: theme.space.sm, flexWrap: 'wrap' }}>
        <strong style={{ fontFamily: theme.font.display, fontSize: 24, fontWeight: 400, letterSpacing: 1 }}>
          {situation ? `${situation.label} · ${PREVIEW.stack} BB` : 'Reference chart'}
        </strong>
        <small style={{ color: theme.colors.textMuted }}>Live, from the reference chart</small>
      </figcaption>
      {showcase.isLoading ? <Loading /> : showcase.error ? <ErrorBox error={showcase.error} onRetry={showcase.refetch} /> : (
        <>
          <HandGrid assignments={hands} actions={situation.actions} label={`Range ${situation.label} · ${PREVIEW.stack} BB`} />
          <ActionPalette actions={situation.actions} />
        </>
      )}
    </figure>
  );
}

const newQuestion = (spot, previous) => {
  const question = nextQuestion({ spots: [spot], previous });
  return { ...question, cards: dealCards(question.hand) };
};

/** One Quiz question against the chart, answered on the page: the Quiz's own table, buttons and grading. */
function TryAHand({ showcase }) {
  const situation = showcase.situations.find(s => s.key === TRY.situation);
  const spot = { situation: TRY.situation, stack: TRY.stack, actions: situation.actions, hands: showcase.ranges[`${TRY.situation}@${TRY.stack}`] };
  const [question, setQuestion] = useState(() => newQuestion(spot, null));
  const [result, setResult] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const { seats, pot } = tableSeats(situation, TRY.stack);

  const answer = given => {
    if (result) return;
    const graded = checkAnswer(spot, question.hand, given);
    setResult(graded);
    setScore(s => ({ correct: s.correct + (graded.correct ? 1 : 0), total: s.total + 1 }));
  };
  const next = () => { setQuestion(q => newQuestion(spot, q)); setResult(null); };
  const verb = action => (action === 'CALL' ? 'calls' : 'folds');

  return (
    <div style={{ display: 'grid', gap: theme.space.xl, alignItems: 'center', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))' }}
      data-testid="landing-try">
      <PokerTable seats={seats} pot={pot} heroCards={question.cards} stack={TRY.stack} caption={`${situation.label}, ${TRY.stack} BB`} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.space.md }}>
        <span style={{ fontFamily: theme.font.mono, color: theme.colors.textMuted }}>
          Your hand: <strong style={{ color: theme.colors.text }} data-testid="landing-hand">{question.hand}</strong>
        </span>
        <ActionPalette actions={situation.actions} selected={result?.given} onSelect={answer} disabled={Boolean(result)} />
        <div role="status" aria-live="polite" data-testid="landing-feedback" style={{ minHeight: 48 }}>
          {result && (
            <span style={{ color: result.correct ? theme.colors.success : theme.colors.danger, fontWeight: 600 }}>
              {result.correct ? 'Correct' : 'Wrong'}: the chart {verb(result.expected)} {question.hand} here
              {result.correct ? '.' : `; you chose ${ACTION_LABELS[result.given]}.`}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: theme.space.md, alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" style={layout.primary} onClick={next} disabled={!result} data-testid="landing-next">Next hand</button>
          <small style={{ fontFamily: theme.font.mono, color: theme.colors.textMuted }} data-testid="landing-score">
            {score.correct} / {score.total}
          </small>
          <Link to={{ pathname: '/quiz', search: `?s=${TRY.situation}&stack=${TRY.stack}` }} style={{ color: theme.colors.accent }}>
            Keep going in the Quiz →
          </Link>
        </div>
      </div>
    </div>
  );
}
