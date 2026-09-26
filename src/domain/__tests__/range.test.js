import { describe, expect, it } from 'vitest';
import { evaluateRange, normalizeRange, summarize } from '../range';

const ACTIONS = ['ALLIN', '3BET_C', 'CALL', 'FOLD'];
const LIMP_ACTIONS = ['ALLIN', 'ISO_C', 'CHECK'];

describe('normalizeRange', () => {
  it('descarta manos inválidas, acciones no permitidas y la acción implícita', () => {
    const out = normalizeRange({ AA: 'ALLIN', XX: 'CALL', KK: 'LIMP', '72o': 'FOLD' }, ACTIONS);
    expect(out).toEqual({ AA: 'ALLIN' });
  });
});

describe('summarize', () => {
  it('cuenta manos y combos incluyendo la acción implícita', () => {
    const s = summarize({ AA: 'ALLIN', AKs: 'CALL' }, ACTIONS);
    expect(s.ALLIN).toEqual({ hands: 1, combos: 6 });
    expect(s.CALL).toEqual({ hands: 1, combos: 4 });
    expect(s.FOLD.hands).toBe(167);
  });

  it('usa la acción efectiva: una implícita listada no crea otra categoría', () => {
    const s = summarize({ '72o': 'FOLD' }, ACTIONS);
    expect(s).toEqual({ FOLD: { hands: 169, combos: 1326 } });
  });

  it('con implícita CHECK cuenta las manos no listadas como CHECK', () => {
    expect(summarize({ AA: 'ALLIN' }, LIMP_ACTIONS).CHECK.hands).toBe(168);
  });
});

describe('evaluateRange', () => {
  it('evalúa rangos con varias acciones simultáneas mano a mano', () => {
    const target = { AA: 'ALLIN', KK: '3BET_C', QQ: 'CALL' };
    const attempt = { AA: 'ALLIN', KK: 'CALL', JJ: 'CALL' };
    const r = evaluateRange(target, attempt, ACTIONS);
    expect(r.verdicts.AA.correct).toBe(true);
    expect(r.verdicts.KK).toEqual({ expected: '3BET_C', given: 'CALL', correct: false });
    expect(r.verdicts.QQ).toEqual({ expected: 'CALL', given: 'FOLD', correct: false });
    expect(r.verdicts.JJ).toEqual({ expected: 'FOLD', given: 'CALL', correct: false });
    expect(r.correct).toBe(166);
    expect(r.byAction['3BET_C']).toEqual({ total: 1, correct: 0 });
  });

  it('un intento vacío contra un rango vacío es 100% correcto', () => {
    expect(evaluateRange({}, {}, ACTIONS).accuracy).toBe(1);
  });
});
