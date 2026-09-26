import { beforeEach, describe, expect, it } from 'vitest';
import { tableSeats } from '../../../../domain/table';
import { createMockApi, memoryStorage } from '../mockApi';

let api;
let now;
beforeEach(() => {
  now = new Date('2026-09-26T10:00:00Z');
  api = createMockApi({ storage: memoryStorage(), latency: 0, clock: () => now });
});

const problemOf = promise => promise.then(
  () => { throw new Error('se esperaba un ApiError'); },
  e => ({ status: e.status, type: e.type })
);
const P = (status, kind) => ({ status, type: `urn:spin-trainer:${kind}` });

describe('situations', () => {
  it('devuelve el catálogo de 16 situaciones como copia', async () => {
    const first = await api.listSituations();
    expect(first).toHaveLength(16);
    first[0].actions.push('HACK');
    expect((await api.listSituations())[0].actions).not.toContain('HACK');
  });

  it('cada situación tiene héroe y acciones previas coherentes con su formato', async () => {
    for (const s of await api.listSituations()) {
      const seats = s.format === 'hu' ? ['SB', 'BB'] : ['BTN', 'SB', 'BB'];
      expect(seats, s.key).toContain(s.hero);
      const order = s.priorActions.map(a => seats.indexOf(a.position));
      expect(order.every(i => i >= 0 && i < seats.indexOf(s.hero)), s.key).toBe(true);
      expect(order, s.key).toEqual([...order].sort());
    }
  });

  it('cada situación del catálogo genera una mesa válida para todos sus stacks', async () => {
    for (const s of await api.listSituations()) {
      for (const stack of s.stacks) {
        const { seats } = tableSeats(s, stack);
        expect(seats, s.key).toHaveLength(s.format === 'hu' ? 2 : 3);
        expect(seats[0]).toMatchObject({ position: s.hero, isHero: true });
        expect(seats.filter(x => x.isDealer), s.key).toHaveLength(1);
      }
    }
  });
});

describe('default ranges', () => {
  it('lista solo las combinaciones con seed', async () => {
    expect((await api.listDefaultRanges()).map(r => `${r.situation}@${r.stack}`)).toEqual(['btn_open@25']);
  });

  it('sirve el rango de referencia de una combinación con seed', async () => {
    expect(await api.getDefaultRange('btn_open', 25)).toMatchObject({ situation: 'btn_open', stack: 25, source: 'default', version: 1 });
  });

  it.each([['nope', 25], ['btn_open', 99], ['btn_open', 20]])('404 para %s@%s (desconocida o sin seed)', async (s, st) => {
    expect(await problemOf(api.getDefaultRange(s, st))).toEqual(P(404, 'not-found'));
  });
});

describe('user ranges', () => {
  it('404 si no hay rango personalizado o la combinación no existe', async () => {
    expect(await problemOf(api.getUserRange('btn_open', 25))).toEqual(P(404, 'not-found'));
    expect(await problemOf(api.getUserRange('nope', 25))).toEqual(P(404, 'not-found'));
  });

  it('PUT con version 0 crea v1 normalizado; GET y la lista lo devuelven', async () => {
    const created = await api.putUserRange('btn_open', 25, { hands: { AA: 'ALLIN', '72o': 'FOLD' }, version: 0 });
    expect(created).toMatchObject({ source: 'user', version: 1, hands: { AA: 'ALLIN' }, updatedAt: now.toISOString() });
    expect(await api.getUserRange('btn_open', 25)).toEqual(created);
    expect(await api.listUserRanges()).toEqual([created]);
  });

  it('PUT con la versión leída reemplaza e incrementa la versión', async () => {
    await api.putUserRange('btn_open', 25, { hands: { AA: 'ALLIN' }, version: 0 });
    expect((await api.putUserRange('btn_open', 25, { hands: { KK: 'ALLIN' }, version: 1 })).version).toBe(2);
  });

  it('no hay actualizaciones perdidas: crear sobre uno existente o reemplazar una versión obsoleta da 409', async () => {
    await api.putUserRange('btn_open', 25, { hands: {}, version: 0 });
    expect(await problemOf(api.putUserRange('btn_open', 25, { hands: {}, version: 0 }))).toEqual(P(409, 'conflict'));
    await api.putUserRange('btn_open', 25, { hands: {}, version: 1 });
    expect(await problemOf(api.putUserRange('btn_open', 25, { hands: {}, version: 1 }))).toEqual(P(409, 'conflict'));
  });

  it('reemplazar un rango que otra sesión borró da 409', async () => {
    await api.putUserRange('btn_open', 25, { hands: {}, version: 0 });
    await api.deleteUserRange('btn_open', 25);
    expect(await problemOf(api.putUserRange('btn_open', 25, { hands: {}, version: 1 }))).toEqual(P(409, 'conflict'));
  });

  it.each([
    ['mano inválida', { hands: { AAs: 'ALLIN' }, version: 0 }],
    ['acción no permitida en la situación', { hands: { AA: 'CHECK' }, version: 0 }],
    ['sin hands', { version: 0 }],
    ['sin version', { hands: {} }],
    ['version negativa', { hands: {}, version: -1 }]
  ])('PUT con %s da 400', async (_case, body) => {
    expect(await problemOf(api.putUserRange('btn_open', 25, body))).toEqual(P(400, 'validation'));
  });

  it('el 400 detalla cada campo inválido', async () => {
    const err = await api.putUserRange('btn_open', 25, { hands: { AAs: 'ALLIN', KK: 'CHECK' }, version: 0 }).catch(e => e);
    expect(err.problem.errors.map(e => e.field)).toEqual(['hands.AAs', 'hands.KK']);
  });

  it('PUT o DELETE sobre una combinación desconocida da 404', async () => {
    expect(await problemOf(api.putUserRange('nope', 25, { hands: {}, version: 0 }))).toEqual(P(404, 'not-found'));
    expect(await problemOf(api.deleteUserRange('btn_open', 99))).toEqual(P(404, 'not-found'));
  });

  it('DELETE borra el rango personalizado y es idempotente', async () => {
    await api.putUserRange('btn_open', 25, { hands: { AA: 'ALLIN' }, version: 0 });
    await api.deleteUserRange('btn_open', 25);
    await api.deleteUserRange('btn_open', 25);
    expect((await problemOf(api.getUserRange('btn_open', 25))).status).toBe(404);
  });
});

describe('quiz attempts', () => {
  const answer = { situation: 'btn_open', stack: 25, hand: 'AA', given: 'ALLIN' };

  it('el servidor calcula expected y correct contra el rango de referencia', async () => {
    const stored = await api.recordAttempt(answer);
    expect(stored).toMatchObject({ ...answer, expected: 'MR_4B_C', correct: false, rangeSource: 'default', rangeVersion: 1, answeredAt: now.toISOString() });
    expect(stored.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('corrige contra el rango personalizado si existe (ADR-0012)', async () => {
    await api.putUserRange('btn_open', 25, { hands: { AA: 'ALLIN' }, version: 0 });
    expect(await api.recordAttempt(answer)).toMatchObject({ expected: 'ALLIN', correct: true, rangeSource: 'user', rangeVersion: 1 });
  });

  it('el cliente no puede imponer expected, correct, id ni fecha: 400', async () => {
    expect(await problemOf(api.recordAttempt({ ...answer, expected: 'ALLIN', correct: true }))).toEqual(P(400, 'validation'));
    expect(await problemOf(api.recordAttempt({ ...answer, id: 'x', answeredAt: '2000-01-01T00:00:00Z' }))).toEqual(P(400, 'validation'));
  });

  it.each([
    ['mano inválida', { hand: 'AAs' }, P(400, 'validation')],
    ['acción no permitida', { given: 'CHECK' }, P(400, 'validation')],
    ['combinación desconocida', { stack: 99 }, P(404, 'not-found')],
    ['combinación sin rango', { stack: 20 }, P(422, 'no-range')]
  ])('POST con %s', async (_case, patch, expected) => {
    expect(await problemOf(api.recordAttempt({ ...answer, ...patch }))).toEqual(expected);
  });

  it('lista del más reciente al más antiguo con paginación por cursor y filtros', async () => {
    for (const hand of ['AA', 'KK', 'QQ']) {
      await api.recordAttempt({ ...answer, hand });
      now = new Date(now.getTime() + 1000);
    }
    const first = await api.listAttempts({ limit: 2 });
    expect(first.items.map(a => a.hand)).toEqual(['QQ', 'KK']);
    const second = await api.listAttempts({ limit: 2, cursor: first.nextCursor });
    expect(second).toMatchObject({ items: [{ hand: 'AA' }], nextCursor: null });
    expect((await api.listAttempts({ situation: 'hu_sb_open' })).items).toEqual([]);
  });

  it.each([[{ limit: 0 }], [{ limit: 201 }], [{ cursor: btoa('-1') }]])('listAttempts(%o) da 400', async params => {
    expect(await problemOf(api.listAttempts(params))).toEqual(P(400, 'validation'));
  });
});

describe('stats', () => {
  beforeEach(async () => {
    await api.recordAttempt({ situation: 'btn_open', stack: 25, hand: 'AA', given: 'MR_4B_C' });
    await api.recordAttempt({ situation: 'btn_open', stack: 25, hand: 'AA', given: 'ALLIN' });
  });

  it('getHandStats agrega por situación, stack y mano', async () => {
    expect(await api.getHandStats()).toEqual([
      { situation: 'btn_open', stack: 25, hand: 'AA', attempts: 2, correct: 1, lastAnsweredAt: now.toISOString() }
    ]);
    expect(await api.getHandStats({ situation: 'hu_sb_open' })).toEqual([]);
  });

  it('getProgress cuenta por día y valida parámetros', async () => {
    expect(await api.getProgress({ tz: 'Europe/Madrid' })).toEqual([{ date: '2026-09-26', attempts: 2, correct: 1 }]);
    expect(await problemOf(api.getProgress({ tz: 'Nope/Zone' }))).toEqual(P(400, 'validation'));
    expect(await problemOf(api.getProgress({ days: 0 }))).toEqual(P(400, 'validation'));
  });
});
