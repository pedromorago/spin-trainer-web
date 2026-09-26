// stats.js — agregación de intentos de Quiz. Un intento: { situation, stack, hand, expected, given, correct, at }.

export function accuracy(attempts) {
  if (!attempts.length) return 0;
  return attempts.filter(a => a.correct).length / attempts.length;
}

export function groupBy(attempts, keyFn) {
  const out = {};
  for (const a of attempts) {
    const k = keyFn(a);
    out[k] ??= { total: 0, correct: 0 };
    out[k].total += 1;
    if (a.correct) out[k].correct += 1;
  }
  for (const v of Object.values(out)) v.accuracy = v.correct / v.total;
  return out;
}

export const bySituation = attempts => groupBy(attempts, a => a.situation);
export const bySituationStack = attempts => groupBy(attempts, a => `${a.situation}@${a.stack}`);
export const byHand = attempts => groupBy(attempts, a => a.hand);

/** Manos con más fallos (mínimo n intentos), ordenadas por peor accuracy. */
export function weakestHands(attempts, { min = 2, limit = 10 } = {}) {
  return Object.entries(byHand(attempts))
    .filter(([, v]) => v.total >= min)
    .sort((a, b) => a[1].accuracy - b[1].accuracy)
    .slice(0, limit)
    .map(([hand, v]) => ({ hand, ...v }));
}
