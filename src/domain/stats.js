// stats.js — estadísticas de estudio sobre filas agregadas por (situación, stack, mano), como las de GET /stats/hands:
//   { situation, stack, hand, attempts, correct, lastAnsweredAt }
// La API agrega (GROUP BY); aquí vive la política de estudio (rankings, manos difíciles). ADR-0013.

const handKey = r => `${r.situation}@${r.stack}@${r.hand}`;

/** Agrega intentos individuales en filas por (situación, stack, mano). Lo usa el mock para emular /stats/hands. */
export function aggregateAttempts(attempts) {
  const rows = new Map();
  for (const a of attempts) {
    const k = handKey(a);
    const row = rows.get(k) ?? { situation: a.situation, stack: a.stack, hand: a.hand, attempts: 0, correct: 0, lastAnsweredAt: a.answeredAt };
    row.attempts += 1;
    if (a.correct) row.correct += 1;
    if (a.answeredAt > row.lastAnsweredAt) row.lastAnsweredAt = a.answeredAt;
    rows.set(k, row);
  }
  return [...rows.values()];
}

/** Totales de un conjunto de filas: { attempts, correct, accuracy } (accuracy null sin intentos). */
export function totals(rows) {
  const attempts = rows.reduce((n, r) => n + r.attempts, 0);
  const correct = rows.reduce((n, r) => n + r.correct, 0);
  return { attempts, correct, accuracy: attempts ? correct / attempts : null };
}

/** Agrupa filas por una clave y devuelve { [clave]: totales }, conservando el orden de aparición. */
export function groupRows(rows, keyFn) {
  const groups = {};
  for (const r of rows) (groups[keyFn(r)] ??= []).push(r);
  return Object.fromEntries(Object.entries(groups).map(([k, g]) => [k, totals(g)]));
}

export const bySituation = rows => groupRows(rows, r => r.situation);
export const bySituationStack = rows => groupRows(rows, r => `${r.situation}@${r.stack}`);

/** Manos más falladas (por situación, stack y mano): más fallos primero; a igualdad, peor precisión. */
export function mostFailed(rows, limit = 10) {
  return rows
    .map(r => ({ ...r, fails: r.attempts - r.correct, accuracy: r.correct / r.attempts }))
    .filter(r => r.fails > 0)
    .sort((a, b) => b.fails - a.fails || a.accuracy - b.accuracy || handKey(a).localeCompare(handKey(b)))
    .slice(0, limit);
}

/**
 * Intentos y aciertos por día en una zona horaria IANA (emula GET /stats/progress). Solo días con actividad,
 * del más antiguo al más reciente, dentro de los últimos `days` días contando hoy.
 * @throws {RangeError} si la zona horaria no es válida
 */
export function progressByDay(attempts, { days = 30, tz = 'UTC', now = new Date() } = {}) {
  const dayOf = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
  const today = dayOf.format(now);
  const first = dayOf.format(new Date(now.getTime() - (days - 1) * 86_400_000));
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
