import { describe, expect, it } from 'vitest';
import { checkAnswer, nextQuestion, playableSpots, quizPool } from '../quiz';

const ACTIONS = ['ALLIN', 'CALL', 'FOLD'];
const spot = (situation, stack, hands) => ({ situation, stack, actions: ACTIONS, hands });
const A = spot('btn_open', 25, { AA: 'ALLIN' });
const B = spot('sb_open', 25, { KK: 'CALL' });
const EMPTY = spot('bb_vs_sb_mr', 25, {});

describe('quizPool', () => {
  it("con scope 'range' incluye las manos del rango y su frontera", () => {
    expect(quizPool({ AA: 'ALLIN' }, ACTIONS)).toEqual(['AA', 'AKs', 'AKo']);
  });

  it("con scope 'all' incluye las 169 manos; un rango vacío no tiene pool de rango", () => {
    expect(quizPool({ AA: 'ALLIN' }, ACTIONS, 'all')).toHaveLength(169);
    expect(quizPool({}, ACTIONS)).toEqual([]);
  });
});

describe('playableSpots', () => {
  it('descarta spots sin manos jugadas', () => {
    expect(playableSpots([A, EMPTY, B])).toEqual([A, B]);
  });
});

describe('nextQuestion (normal)', () => {
  it('elige spot y mano con el rng', () => {
    expect(nextQuestion({ spots: [A, B], rng: () => 0 })).toEqual({ situation: 'btn_open', stack: 25, hand: 'AA' });
    expect(nextQuestion({ spots: [A, B], rng: () => 0.99 })).toMatchObject({ situation: 'sb_open' });
  });

  it('ignora spots sin rango y devuelve null si no hay ninguno jugable', () => {
    expect(nextQuestion({ spots: [EMPTY, A], rng: () => 0 })).toMatchObject({ situation: 'btn_open' });
    expect(nextQuestion({ spots: [EMPTY] })).toBeNull();
  });

  it('nunca repite la pregunta anterior si hay alternativa', () => {
    let q = null;
    for (let i = 0; i < 10; i++) {
      const next = nextQuestion({ spots: [A], previous: q, rng: () => 0 });
      expect(next).not.toEqual(q);
      q = next;
    }
  });

  it("scope 'all' pregunta cualquiera de las 169", () => {
    expect(nextQuestion({ spots: [A], scope: 'all', rng: () => 0.999 }).hand).toBe('22');
  });
});

describe('nextQuestion (manos difíciles)', () => {
  const hard = [
    { situation: 'btn_open', stack: 25, hand: 'AKo', weight: 1 },
    { situation: 'btn_open', stack: 25, hand: 'AKs', weight: 3 },
    { situation: 'hu_sb_open', stack: 10, hand: 'K9s', weight: 9 } // spot outside the selection
  ];

  it('elige con probabilidad ∝ peso, solo en los spots de la selección', () => {
    expect(nextQuestion({ spots: [A], mode: 'hard', hard, rng: () => 0 })).toEqual({ situation: 'btn_open', stack: 25, hand: 'AKo' });
    expect(nextQuestion({ spots: [A], mode: 'hard', hard, rng: () => 0.5 })).toEqual({ situation: 'btn_open', stack: 25, hand: 'AKs' });
  });

  it('no repite la anterior si hay alternativa; sin manos difíciles → null', () => {
    const previous = { situation: 'btn_open', stack: 25, hand: 'AKo' };
    expect(nextQuestion({ spots: [A], mode: 'hard', hard, previous, rng: () => 0 }).hand).toBe('AKs');
    expect(nextQuestion({ spots: [B], mode: 'hard', hard })).toBeNull();
  });
});

describe('checkAnswer', () => {
  it('corrige contra la acción efectiva, incluida la implícita', () => {
    expect(checkAnswer(A, 'AA', 'CALL')).toEqual({ hand: 'AA', given: 'CALL', expected: 'ALLIN', correct: false });
    expect(checkAnswer(A, 'AKo', 'FOLD').correct).toBe(true);
  });
});
