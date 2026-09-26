// session.js — sesión de estudio local: respuestas del Quiz desde que se abrió o reinició la sesión.
// Los intentos persistidos (API) son el histórico; la sesión es solo el marcador en curso.

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

/** Precisión en [0,1], o null si aún no hay respuestas. */
export function sessionAccuracy(session) {
  return session.total ? session.correct / session.total : null;
}

/** Valida una sesión deserializada; devuelve una sesión vacía si no tiene la forma esperada. */
export function reviveSession(value) {
  const keys = Object.keys(emptySession());
  const ok = value && typeof value === 'object'
    && keys.every(k => Number.isInteger(value[k]) && value[k] >= 0)
    && value.correct <= value.total && value.streak <= value.bestStreak && value.bestStreak <= value.correct;
  return ok ? Object.fromEntries(keys.map(k => [k, value[k]])) : emptySession();
}
