// stats.js — study statistics over rows aggregated by (situation, stack, hand), like those of GET /stats/hands:
//   { situation, stack, hand, attempts, correct, lastAnsweredAt }
// The API aggregates (GROUP BY); the study policy (rankings, hard hands) lives here. ADR-0013.

const handKey = r => `${r.situation}@${r.stack}@${r.hand}`;

/** Aggregates individual attempts into rows by (situation, stack, hand). The mock uses it to emulate /stats/hands. */
export function aggregateAttempts(attempts) {
  const rows = new Map();
  for (const a of attempts) {
    const k = handKey(a);
    const row = rows.get(k) ?? { situation: a.situation, stack: a.stack, hand: a.hand, attempts: 0, correct: 0, lastAnsweredAt: a.answeredAt };
    row.attempts += 1;
    if (a.correct) row.correct += 1;
    // Stryker disable next-line EqualityOperator: on equal times, keeping or replacing leaves the same value.
    if (a.answeredAt > row.lastAnsweredAt) row.lastAnsweredAt = a.answeredAt;
    rows.set(k, row);
  }
  return [...rows.values()];
}

/** Totals of a set of rows: { attempts, correct, accuracy } (accuracy null without attempts). */
export function totals(rows) {
  const attempts = rows.reduce((n, r) => n + r.attempts, 0);
  const correct = rows.reduce((n, r) => n + r.correct, 0);
  return { attempts, correct, accuracy: attempts ? correct / attempts : null };
}

/** Groups rows by a key and returns { [key]: totals }, keeping the order of appearance. */
export function groupRows(rows, keyFn) {
  const groups = {};
  for (const r of rows) (groups[keyFn(r)] ??= []).push(r);
  return Object.fromEntries(Object.entries(groups).map(([k, g]) => [k, totals(g)]));
}

export const bySituation = rows => groupRows(rows, r => r.situation);
export const bySituationStack = rows => groupRows(rows, r => `${r.situation}@${r.stack}`);

/** Most missed hands (by situation, stack and hand): most misses first; on a tie, worse accuracy. */
export function mostFailed(rows, limit = 10) {
  return rows
    .map(r => ({ ...r, fails: r.attempts - r.correct, accuracy: r.correct / r.attempts }))
    .filter(r => r.fails > 0)
    .sort((a, b) => b.fails - a.fails || a.accuracy - b.accuracy || handKey(a).localeCompare(handKey(b)))
    .slice(0, limit);
}

/** Adds n days to a 'YYYY-MM-DD' date (UTC arithmetic: no jumps from daylight saving time changes). */
function addDays(date, n) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Attempts and correct answers per day in an IANA time zone (emulates GET /stats/progress). Only days with activity,
 * from oldest to most recent, within the last `days` days counting today.
 * @throws {RangeError} if the time zone is not valid
 */
export function progressByDay(attempts, { days = 30, tz = 'UTC', now = new Date() } = {}) {
  const dayOf = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
  const today = dayOf.format(now);
  // Calendar days, not 24 h steps: around a daylight saving change a day lasts 23 or 25 hours.
  const first = addDays(today, 1 - days);
  const byDay = new Map();
  for (const a of attempts) {
    const date = dayOf.format(new Date(a.answeredAt));
    if (date < first || date > today) continue;
    const d = byDay.get(date) ?? { date, attempts: 0, correct: 0 };
    d.attempts += 1;
    if (a.correct) d.correct += 1;
    byDay.set(date, d);
  }
  return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** Study weights: each miss adds 2 and each correct answer subtracts 0.5. */
export const HARD_FAIL_WEIGHT = 2;
export const HARD_HIT_WEIGHT = 0.5;
export const HARD_MIN_FAILS = 2;

/**
 * Hard hands: missed at least 2 times in their (situation, stack) and with weight > 0, where
 * weight = 2·misses − 0.5·correct. Getting them right lowers the weight until they leave the pool: the hand "is learned".
 * Sorted from highest to lowest weight.
 */
export function hardHands(rows) {
  return rows
    .map(r => {
      const fails = r.attempts - r.correct;
      return { situation: r.situation, stack: r.stack, hand: r.hand, fails, hits: r.correct,
        weight: HARD_FAIL_WEIGHT * fails - HARD_HIT_WEIGHT * r.correct };
    })
    .filter(h => h.fails >= HARD_MIN_FAILS && h.weight > 0)
    .sort((a, b) => b.weight - a.weight || handKey(a).localeCompare(handKey(b)));
}

/**
 * Complete daily series for the progress chart: the `days` days up to `today` (inclusive), in order,
 * filling the days without activity with 0 (GET /stats/progress only returns days with attempts).
 * accuracy is null on days without attempts (it is not 0 %: there is no data).
 */
export function dailySeries(progress, { days, today }) {
  const byDate = new Map(progress.map(d => [d.date, d]));
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(today, i - days + 1);
    const d = byDate.get(date);
    return { date, attempts: d?.attempts ?? 0, correct: d?.correct ?? 0, accuracy: d ? d.correct / d.attempts : null };
  });
}
