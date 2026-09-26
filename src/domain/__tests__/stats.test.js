import { describe, expect, it } from 'vitest';
import { aggregateAttempts, bySituation, bySituationStack, groupRows, hardHands, mostFailed, progressByDay, totals } from '../stats';

const at = (hand, correct, answeredAt, situation = 'btn_open', stack = 25) => ({ situation, stack, hand, correct, answeredAt });

const ATTEMPTS = [
  at('AA', true, '2026-09-20T10:00:00Z'),
  at('AA', true, '2026-09-21T10:00:00Z'),
  at('K9s', false, '2026-09-21T11:00:00Z', 'btn_open', 20),
  at('K9s', false, '2026-09-22T11:00:00Z', 'btn_open', 20),
  at('K9s', true, '2026-09-22T12:00:00Z', 'btn_open', 20),
  at('K9s', false, '2026-09-23T09:00:00Z', 'hu_sb_open', 10)
];
const ROWS = aggregateAttempts(ATTEMPTS);

describe('aggregateAttempts', () => {
  it('agrupa por situación, stack y mano con intentos, aciertos y último intento', () => {
    expect(ROWS).toEqual([
      { situation: 'btn_open', stack: 25, hand: 'AA', attempts: 2, correct: 2, lastAnsweredAt: '2026-09-21T10:00:00Z' },
      { situation: 'btn_open', stack: 20, hand: 'K9s', attempts: 3, correct: 1, lastAnsweredAt: '2026-09-22T12:00:00Z' },
      { situation: 'hu_sb_open', stack: 10, hand: 'K9s', attempts: 1, correct: 0, lastAnsweredAt: '2026-09-23T09:00:00Z' }
    ]);
  });

  it('sin intentos no hay filas', () => expect(aggregateAttempts([])).toEqual([]));
});

describe('totals y agrupaciones', () => {
  it('totales globales; precisión null sin intentos', () => {
    expect(totals(ROWS)).toEqual({ attempts: 6, correct: 3, accuracy: 0.5 });
    expect(totals([])).toEqual({ attempts: 0, correct: 0, accuracy: null });
  });

  it('por situación y por situación@stack', () => {
    expect(bySituation(ROWS).btn_open).toEqual({ attempts: 5, correct: 3, accuracy: 0.6 });
    expect(Object.keys(bySituationStack(ROWS))).toEqual(['btn_open@25', 'btn_open@20', 'hu_sb_open@10']);
  });

  it('groupRows admite cualquier clave', () => {
    expect(groupRows(ROWS, r => r.hand).K9s).toEqual({ attempts: 4, correct: 1, accuracy: 0.25 });
  });
});

describe('mostFailed', () => {
  it('ordena por fallos y después por peor precisión; excluye manos sin fallos', () => {
    expect(mostFailed(ROWS).map(r => [r.situation, r.hand, r.fails])).toEqual([
      ['btn_open', 'K9s', 2],
      ['hu_sb_open', 'K9s', 1]
    ]);
  });

  it('respeta el límite', () => expect(mostFailed(ROWS, 1)).toHaveLength(1));
});

describe('progressByDay', () => {
  const now = new Date('2026-09-23T12:00:00Z');

  it('cuenta por día (solo días con actividad), en orden cronológico', () => {
    expect(progressByDay(ATTEMPTS, { now, days: 30 })).toEqual([
      { date: '2026-09-20', attempts: 1, correct: 1 },
      { date: '2026-09-21', attempts: 2, correct: 1 },
      { date: '2026-09-22', attempts: 2, correct: 1 },
      { date: '2026-09-23', attempts: 1, correct: 0 }
    ]);
  });

  it('limita a los últimos N días contando hoy', () => {
    expect(progressByDay(ATTEMPTS, { now, days: 2 }).map(d => d.date)).toEqual(['2026-09-22', '2026-09-23']);
  });

  it('corta los días en la zona horaria pedida', () => {
    const late = [at('AA', true, '2026-09-22T23:30:00Z')];
    expect(progressByDay(late, { now, tz: 'UTC' })[0].date).toBe('2026-09-22');
    expect(progressByDay(late, { now, tz: 'Europe/Madrid' })[0].date).toBe('2026-09-23');
  });

  it('zona horaria inválida → RangeError', () => {
    expect(() => progressByDay(ATTEMPTS, { now, tz: 'Nope/Zone' })).toThrow(RangeError);
  });
});

describe('hardHands', () => {
  const row = (hand, attempts, correct) => ({ situation: 'btn_open', stack: 25, hand, attempts, correct });

  it('peso = 2·fallos − 0,5·aciertos; solo manos con ≥ 2 fallos y peso > 0, de más a menos peso', () => {
    const hard = hardHands([row('AA', 2, 0), row('KK', 5, 1), row('QQ', 1, 0), row('JJ', 10, 8), row('TT', 3, 1)]);
    expect(hard.map(h => [h.hand, h.weight])).toEqual([['KK', 7.5], ['AA', 4], ['TT', 3.5]]);
  });

  it('una mano sale del pool cuando se aprende (peso ≤ 0)', () => {
    expect(hardHands([row('AA', 10, 8)])).toEqual([]); // 2 fallos, 8 aciertos: 4 − 4 = 0
    expect(hardHands([row('AA', 9, 7)])).toHaveLength(1); // 2 fallos, 7 aciertos: 0,5
  });
});
