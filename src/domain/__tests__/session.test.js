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

describe('reviveSession: valores límite', () => {
  it('acepta ceros y los máximos coherentes (aciertos = total, mejor racha = aciertos)', () => {
    expect(reviveSession({ total: 2, correct: 0, streak: 0, bestStreak: 0 })).toEqual({ total: 2, correct: 0, streak: 0, bestStreak: 0 });
    expect(reviveSession({ total: 2, correct: 2, streak: 2, bestStreak: 2 })).toEqual({ total: 2, correct: 2, streak: 2, bestStreak: 2 });
  });

  it.each([
    ['un total no entero', { total: 2.5, correct: 1, streak: 0, bestStreak: 1 }],
    ['una racha negativa', { total: 3, correct: 2, streak: -1, bestStreak: 1 }],
    ['una mejor racha mayor que los aciertos', { total: 3, correct: 1, streak: 0, bestStreak: 2 }],
    ['un texto', 'total']
  ])('descarta %s', (_, value) => {
    expect(reviveSession(value)).toEqual(emptySession());
  });
});
