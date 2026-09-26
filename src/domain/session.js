// session.js — local study session: Quiz answers since the session was opened or reset.
// Persisted attempts (API) are the history; the session is only the running scoreboard.

export const emptySession = () => ({ total: 0, correct: 0, streak: 0, bestStreak: 0 });

export function recordAnswer(session, correct) {
  const streak = correct ? session.streak + 1 : 0;
  return {
    total: session.total + 1,
    correct: session.correct + (correct ? 1 : 0),
    streak,
    bestStreak: Math.max(session.bestStreak, streak)
  };
}

/** Accuracy in [0,1], or null if there are no answers yet. */
export function sessionAccuracy(session) {
  return session.total ? session.correct / session.total : null;
}

/** Validates a deserialized session; returns an empty session if it does not have the expected shape. */
export function reviveSession(value) {
  const keys = Object.keys(emptySession());
  // Anything that is not an object (a string, a number) has no integer fields, so every() rejects it.
  const ok = value
    && keys.every(k => Number.isInteger(value[k]) && value[k] >= 0)
    && value.correct <= value.total && value.streak <= value.bestStreak && value.bestStreak <= value.correct;
  return ok ? Object.fromEntries(keys.map(k => [k, value[k]])) : emptySession();
}
