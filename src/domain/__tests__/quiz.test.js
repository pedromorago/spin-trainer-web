import { describe, expect, it } from 'vitest';
import { createQuizEngine, quizPool } from '../quiz';

const ACTIONS = ['ALLIN', 'CALL', 'FOLD'];

describe('quizPool', () => {
  it("con scope 'range' incluye las manos del rango y su frontera", () => {
    expect(quizPool({ AA: 'ALLIN' }, ACTIONS)).toEqual(['AA', 'AKs', 'AKo']);
  });

  it("con scope 'all' incluye las 169 manos", () => {
    expect(quizPool({ AA: 'ALLIN' }, ACTIONS, 'all')).toHaveLength(169);
  });

  it('un rango vacío no tiene pool de rango', () => {
    expect(quizPool({}, ACTIONS)).toEqual([]);
  });
});

describe('createQuizEngine', () => {
  it('es determinista con un rng fijo', () => {
    const q = createQuizEngine({ range: { AA: 'ALLIN' }, actions: ACTIONS, rng: () => 0 });
    expect(q.size).toBe(3);
    expect(q.nextHand()).toBe('AA');
  });

  it('nunca repite la mano anterior si hay alternativa', () => {
    const q = createQuizEngine({ range: { AA: 'ALLIN' }, actions: ACTIONS, rng: () => 0 });
    const seq = Array.from({ length: 10 }, () => q.nextHand());
    for (let i = 1; i < seq.length; i++) expect(seq[i]).not.toBe(seq[i - 1]);
  });

  it('falla con un pool vacío', () => {
    expect(() => createQuizEngine({ range: {}, actions: ACTIONS })).toThrow('Pool de manos vacío');
  });

  it('corrige usando la acción implícita', () => {
    const q = createQuizEngine({ range: { AA: 'ALLIN' }, actions: ACTIONS });
    expect(q.check('AKo', 'FOLD').correct).toBe(true);
    expect(q.check('AA', 'CALL')).toMatchObject({ expected: 'ALLIN', correct: false });
  });
});
