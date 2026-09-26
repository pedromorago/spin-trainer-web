import { describe, expect, it } from 'vitest';
import { createQuizEngine } from '../quiz';

const ACTIONS = ['ALLIN', 'CALL', 'FOLD'];

describe('createQuizEngine', () => {
  it('es determinista con un rng fijo', () => {
    const q = createQuizEngine({ range: { AA: 'ALLIN' }, actions: ACTIONS, rng: () => 0 });
    expect(q.nextHand()).toBe('AA');
  });

  it('con onlyListed solo usa manos con acción explícita', () => {
    const q = createQuizEngine({ range: { KK: 'ALLIN' }, actions: ACTIONS, rng: () => 0.99, onlyListed: true });
    expect(q.nextHand()).toBe('KK');
  });

  it('corrige usando la acción implícita', () => {
    const q = createQuizEngine({ range: { AA: 'ALLIN' }, actions: ACTIONS });
    expect(q.check('72o', 'FOLD').correct).toBe(true);
    expect(q.check('AA', 'CALL')).toMatchObject({ expected: 'ALLIN', correct: false });
  });
});
