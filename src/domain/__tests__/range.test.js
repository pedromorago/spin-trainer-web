import { describe, expect, it } from 'vitest';
import { allHands } from '../hand';
import {
  boundaryHands, ERASE, evaluateRange, explicitHands, exportRange, mergeEffectiveRanges, normalizeRange, paintHand, rangesEqual, rangeStats, summarize
} from '../range';

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

describe('explicitHands', () => {
  it('devuelve las manos con acción distinta de la implícita, en orden de grid', () => {
    expect(explicitHands({ KK: 'CALL', '72o': 'FOLD', AA: 'ALLIN' }, ACTIONS)).toEqual(['AA', 'KK']);
  });
});

describe('boundaryHands', () => {
  it('devuelve las manos implícitas adyacentes en el grid a una explícita', () => {
    expect(boundaryHands({ AA: 'ALLIN' }, ACTIONS)).toEqual(['AKs', 'AKo']);
    expect(boundaryHands({ KK: 'ALLIN' }, ACTIONS)).toEqual(['AKs', 'AKo', 'KQs', 'KQo']);
  });

  it('no incluye manos explícitas', () => {
    expect(boundaryHands({ AA: 'ALLIN', AKs: 'CALL' }, ACTIONS)).toEqual(['AQs', 'AKo', 'KK']);
  });

  it('un rango vacío o completo no tiene frontera', () => {
    expect(boundaryHands({}, ACTIONS)).toEqual([]);
    const full = Object.fromEntries(allHands().map(h => [h, 'CALL']));
    expect(boundaryHands(full, ACTIONS)).toEqual([]);
  });
});

describe('evaluateRange', () => {
  const target = { AA: 'ALLIN', KK: '3BET_C', QQ: 'CALL' };
  const attempt = { AA: 'ALLIN', KK: 'CALL', JJ: 'CALL' };
  const r = evaluateRange(target, attempt, ACTIONS);

  it('evalúa rangos con varias acciones simultáneas mano a mano', () => {
    expect(r.verdicts.AA).toEqual({ expected: 'ALLIN', given: 'ALLIN', correct: true, kind: 'correct', played: true });
    expect(r.correct).toBe(166);
    expect(r.byAction['3BET_C']).toEqual({ total: 1, correct: 0 });
  });

  it('clasifica los fallos: acción equivocada, de más (debía ser la implícita) y faltó (debía jugarse)', () => {
    expect(r.verdicts.KK).toEqual({ expected: '3BET_C', given: 'CALL', correct: false, kind: 'wrong', played: true });
    expect(r.verdicts.JJ).toEqual({ expected: 'FOLD', given: 'CALL', correct: false, kind: 'extra', played: true });
    expect(r.verdicts.QQ).toEqual({ expected: 'CALL', given: 'FOLD', correct: false, kind: 'missing', played: true });
    expect(r.verdicts['72o']).toEqual({ expected: 'FOLD', given: 'FOLD', correct: true, kind: 'correct', played: false });
  });

  it('puntúa solo las manos jugadas; byKind las desglosa y suma el total', () => {
    expect(r.byKind).toEqual({ correct: 1, wrong: 1, extra: 1, missing: 1 });
    expect(r.score).toEqual({ correct: 1, total: 4, accuracy: 0.25 });
    expect(r.accuracy).toBeCloseTo(166 / 169, 10);
  });

  it('con implícita CHECK, pintar CHECK no cuenta como jugada', () => {
    const e = evaluateRange({ AA: 'ALLIN' }, { AA: 'ALLIN', KK: 'CHECK' }, LIMP_ACTIONS);
    expect(e.verdicts.KK).toMatchObject({ kind: 'correct', played: false });
    expect(e.score).toEqual({ correct: 1, total: 1, accuracy: 1 });
  });

  it('un intento vacío contra un rango vacío es 100% correcto', () => {
    const e = evaluateRange({}, {}, ACTIONS);
    expect(e.accuracy).toBe(1);
    expect(e.score).toEqual({ correct: 0, total: 0, accuracy: 1 });
  });

  it('un intento vacío contra un rango cerrado: 0 en la puntuación aunque acierte los folds', () => {
    const e = evaluateRange({ AA: 'ALLIN', KK: 'ALLIN' }, {}, ACTIONS);
    expect(e.score.accuracy).toBe(0);
    expect(e.byKind.missing).toBe(2);
    expect(e.accuracy).toBeCloseTo(167 / 169, 10);
  });
});

describe('paintHand', () => {
  it('fija la acción del pincel (idempotente, no alterna)', () => {
    const once = paintHand({}, 'AA', 'ALLIN', ACTIONS);
    expect(once).toEqual({ AA: 'ALLIN' });
    expect(paintHand(once, 'AA', 'ALLIN', ACTIONS)).toBe(once);
    expect(paintHand(once, 'AA', 'CALL', ACTIONS)).toEqual({ AA: 'CALL' });
  });

  it('ERASE y la acción implícita devuelven la mano a la implícita', () => {
    expect(paintHand({ AA: 'ALLIN', KK: 'CALL' }, 'AA', ERASE, ACTIONS)).toEqual({ KK: 'CALL' });
    expect(paintHand({ AA: 'ALLIN' }, 'AA', 'FOLD', ACTIONS)).toEqual({});
    expect(paintHand({ '72o': 'FOLD' }, '72o', ERASE, ACTIONS)).toEqual({});
  });

  it('no cambia nada con mano o pincel inválidos, ni al borrar una mano ya implícita', () => {
    const hands = { AA: 'ALLIN' };
    expect(paintHand(hands, 'XX', 'ALLIN', ACTIONS)).toBe(hands);
    expect(paintHand(hands, 'KK', 'LIMP', ACTIONS)).toBe(hands);
    expect(paintHand(hands, 'KK', ERASE, ACTIONS)).toBe(hands);
  });

  it('no muta el rango de entrada', () => {
    const hands = { AA: 'ALLIN' };
    paintHand(hands, 'KK', 'CALL', ACTIONS);
    expect(hands).toEqual({ AA: 'ALLIN' });
  });
});

describe('rangesEqual', () => {
  it('compara acciones efectivas, no la representación', () => {
    expect(rangesEqual({ AA: 'ALLIN', '72o': 'FOLD' }, { AA: 'ALLIN' }, ACTIONS)).toBe(true);
    expect(rangesEqual({ AA: 'ALLIN' }, { AA: 'CALL' }, ACTIONS)).toBe(false);
    expect(rangesEqual({}, {}, ACTIONS)).toBe(true);
  });
});

describe('rangeStats', () => {
  it('cuenta manos, combos y % jugados y el desglose por acción en el orden de la situación', () => {
    const s = rangeStats({ AA: 'ALLIN', KK: 'ALLIN', AKs: 'CALL', AKo: 'CALL' }, ACTIONS);
    expect(s).toMatchObject({ hands: 4, combos: 28, pct: 28 / 1326 });
    expect(s.byAction.map(a => a.action)).toEqual(ACTIONS);
    expect(s.byAction[0]).toEqual({ action: 'ALLIN', hands: 2, combos: 12, pct: 12 / 1326, implicit: false });
    expect(s.byAction[1]).toEqual({ action: '3BET_C', hands: 0, combos: 0, pct: 0, implicit: false });
    expect(s.byAction[3]).toMatchObject({ action: 'FOLD', hands: 165, combos: 1298, implicit: true });
  });

  it('los % de todas las acciones suman 1', () => {
    const s = rangeStats({ AA: 'ALLIN', '72o': 'CALL' }, ACTIONS);
    expect(s.byAction.reduce((n, a) => n + a.pct, 0)).toBeCloseTo(1, 10);
  });

  it('un rango vacío no juega nada', () => {
    expect(rangeStats({}, LIMP_ACTIONS)).toMatchObject({ hands: 0, combos: 0, pct: 0 });
  });
});

describe('exportRange', () => {
  it('una línea por acción jugada, manos ordenadas, y la implícita al final', () => {
    const text = exportRange({ AKo: 'ALLIN', KK: 'ALLIN', AA: 'ALLIN', AKs: 'CALL' }, ACTIONS, { title: 'BTN Open · 25 BB' });
    expect(text).toBe([
      'BTN Open · 25 BB',
      'All-in (24 combos): AA, KK, AKo',
      'Call (4 combos): AKs',
      'Resto: Fold'
    ].join('\n'));
  });

  it('sin título ni manos jugadas solo indica la implícita', () => {
    expect(exportRange({}, LIMP_ACTIONS)).toBe('Resto: Check');
  });
});

describe('mergeEffectiveRanges', () => {
  it('el rango personalizado prevalece sobre el de referencia (ADR-0012)', () => {
    const def = { situation: 'btn_open', stack: 25, hands: { AA: 'ALLIN' }, source: 'default' };
    const other = { situation: 'sb_open', stack: 25, hands: { KK: 'ALLIN' }, source: 'default' };
    const user = { situation: 'btn_open', stack: 25, hands: { AA: 'CALL' }, source: 'user' };
    const merged = mergeEffectiveRanges([def, other], [user]);
    expect(merged.get('btn_open@25')).toBe(user);
    expect(merged.get('sb_open@25')).toBe(other);
    expect(mergeEffectiveRanges().size).toBe(0);
  });
});
