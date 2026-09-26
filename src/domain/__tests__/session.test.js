import { describe, expect, it } from 'vitest';
import { emptySession, recordAnswer, reviveSession, sessionAccuracy } from '../session';

const play = answers => answers.reduce(recordAnswer, emptySession());

describe('recordAnswer', () => {
  it('cuenta total, aciertos y racha actual', () => {
    expect(play([true, true, false, true])).toEqual({ total: 4, correct: 3, streak: 1, bestStreak: 2 });
  });

  it('la mejor racha se conserva tras un fallo', () => {
    expect(play([true, true, true, false, true]).bestStreak).toBe(3);
  });

  it('no muta la sesión de entrada', () => {
    const s = emptySession();
    recordAnswer(s, true);
    expect(s).toEqual(emptySession());
  });
});

describe('sessionAccuracy', () => {
  it('es null sin respuestas y la proporción de aciertos con ellas', () => {
    expect(sessionAccuracy(emptySession())).toBeNull();
    expect(sessionAccuracy(play([true, false, true, true]))).toBe(0.75);
  });
});

describe('reviveSession', () => {
  it('acepta una sesión válida y descarta campos extra', () => {
    const s = play([true, false, true]);
    expect(reviveSession({ ...s, hack: 1 })).toEqual(s);
  });

  it.each([
    ['null', null],
    ['string', 'x'],
    ['campos ausentes', { total: 1 }],
    ['negativos', { total: -1, correct: 0, streak: 0, bestStreak: 0 }],
    ['incoherente', { total: 1, correct: 2, streak: 0, bestStreak: 0 }],
    ['racha mayor que la mejor', { total: 2, correct: 2, streak: 2, bestStreak: 1 }]
  ])('descarta datos inválidos (%s)', (_case, value) => {
    expect(reviveSession(value)).toEqual(emptySession());
  });
});
