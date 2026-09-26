import { beforeEach, describe, expect, it } from 'vitest';
import { createMockApi, memoryStorage } from '../mockApi';

let api;
beforeEach(() => { api = createMockApi({ storage: memoryStorage(), latency: 0 }); });

const problemOf = promise => promise.then(
  () => { throw new Error('se esperaba un ApiError'); },
  e => ({ status: e.status, type: e.type })
);

describe('situations', () => {
  it('devuelve el catálogo de 16 situaciones como copia', async () => {
    const first = await api.listSituations();
    expect(first).toHaveLength(16);
    first[0].actions.push('HACK');
    expect((await api.listSituations())[0].actions).not.toContain('HACK');
  });
});

describe('default ranges', () => {
  it('sirve el rango default de una situación/stack del catálogo', async () => {
    expect(await api.getDefaultRange('btn_open', 25)).toMatchObject({ situation: 'btn_open', stack: 25, source: 'default', version: 1 });
  });

  it.each([['nope', 25], ['btn_open', 99]])('404 para %s@%s', async (s, st) => {
    expect(await problemOf(api.getDefaultRange(s, st))).toEqual({ status: 404, type: 'urn:spin-trainer:not-found' });
  });
});

describe('user ranges', () => {
  it('404 si no hay rango custom', async () => {
    expect((await problemOf(api.getUserRange('btn_open', 25))).status).toBe(404);
  });

  it('PUT crea v1 normalizado (sin la acción implícita) y GET lo devuelve', async () => {
    const created = await api.putUserRange('btn_open', 25, { hands: { AA: 'ALLIN', '72o': 'FOLD' } });
    expect(created).toMatchObject({ source: 'user', version: 1, hands: { AA: 'ALLIN' } });
    expect(await api.getUserRange('btn_open', 25)).toEqual(created);
  });

  it('PUT con la versión leída incrementa la versión', async () => {
    await api.putUserRange('btn_open', 25, { hands: { AA: 'ALLIN' } });
    expect((await api.putUserRange('btn_open', 25, { hands: { KK: 'ALLIN' }, version: 1 })).version).toBe(2);
  });

  it('PUT con una versión obsoleta da 409', async () => {
    await api.putUserRange('btn_open', 25, { hands: {} });
    await api.putUserRange('btn_open', 25, { hands: {}, version: 1 });
    expect(await problemOf(api.putUserRange('btn_open', 25, { hands: {}, version: 1 })))
      .toEqual({ status: 409, type: 'urn:spin-trainer:conflict' });
  });

  it.each([
    ['mano inválida', 'btn_open', 25, { hands: { AAs: 'ALLIN' } }],
    ['acción no permitida en la situación', 'btn_open', 25, { hands: { AA: 'CHECK' } }],
    ['sin hands', 'btn_open', 25, {}],
    ['situación desconocida', 'nope', 25, { hands: {} }]
  ])('PUT con %s da 400', async (_case, s, st, body) => {
    expect(await problemOf(api.putUserRange(s, st, body))).toEqual({ status: 400, type: 'urn:spin-trainer:validation' });
  });

  it('DELETE borra el rango custom', async () => {
    await api.putUserRange('btn_open', 25, { hands: { AA: 'ALLIN' } });
    await api.deleteUserRange('btn_open', 25);
    expect((await problemOf(api.getUserRange('btn_open', 25))).status).toBe(404);
  });
});

describe('quiz attempts', () => {
  const attempt = { situation: 'btn_open', stack: 25, hand: 'AA', expected: 'MR_4B_C', given: 'ALLIN' };

  it('el servidor calcula correct y fija id/at: el cliente no puede imponerlos', async () => {
    const stored = await api.recordAttempt({ ...attempt, correct: true, id: 'x', at: '2000-01-01T00:00:00Z' });
    expect(stored.correct).toBe(false);
    expect(stored.id).not.toBe('x');
    expect(stored.at).not.toBe('2000-01-01T00:00:00Z');
    expect(await api.listAttempts()).toEqual([stored]);
  });

  it.each([
    ['mano inválida', { hand: 'KAs' }],
    ['acción dada no permitida', { given: 'CHECK' }],
    ['stack fuera del catálogo', { stack: 99 }]
  ])('POST con %s da 400', async (_case, patch) => {
    expect((await problemOf(api.recordAttempt({ ...attempt, ...patch }))).status).toBe(400);
  });
});
