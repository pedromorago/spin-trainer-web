import { beforeEach, describe, expect, it } from 'vitest';
import { tableSeats } from '../../../../domain/table';
import { fallbackAction, isValidAction } from '../../../../domain/actions';
import { isValidHand } from '../../../../domain/hand';
import { createMockApi, memoryStorage } from '../mockApi';
import { SITUATIONS } from '../situations';

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
const errorsOf = promise => promise.then(() => { throw new Error('se esperaba un ApiError'); }, e => e.problem.errors);
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

// Without the btn_open@20 reference range: the seed brings them all, so the "no range" case is set up separately.
const withoutBtnOpen20 = () => createMockApi({
  storage: memoryStorage(), latency: 0, defaultRanges: { 'btn_open@25': { AA: 'MR_4B_C' } }
});

describe('default ranges', () => {
  it('trae un rango de referencia por cada combinación del catálogo, en su orden', async () => {
    const catalog = SITUATIONS.flatMap(s => s.stacks.map(st => `${s.key}@${st}`));
    expect((await api.listDefaultRanges()).map(r => `${r.situation}@${r.stack}`)).toEqual(catalog);
  });

  // The copy of reference-ranges.json matches the mock's catalog: if the API changes one without the other, it fails here.
  it('los rangos de referencia solo tienen manos canónicas, acciones de su situación y ninguna implícita', async () => {
    for (const range of await api.listDefaultRanges()) {
      const { actions } = SITUATIONS.find(s => s.key === range.situation);
      for (const [hand, action] of Object.entries(range.hands)) {
        const where = `${range.situation}@${range.stack} ${hand}`;
        expect(isValidHand(hand), where).toBe(true);
        expect(isValidAction(action, actions), `${where}: ${action}`).toBe(true);
        expect(action, where).not.toBe(fallbackAction(actions));
      }
    }
  });

  it('sirve el rango de referencia de una combinación con seed', async () => {
    expect(await api.getDefaultRange('btn_open', 25)).toMatchObject({
      situation: 'btn_open', stack: 25, source: 'default', version: 1, hands: expect.objectContaining({ AA: 'MR_4B_C' })
    });
  });

  it.each([['nope', 25], ['btn_open', 99]])('404 para %s@%s (desconocida)', async (s, st) => {
    expect(await problemOf(api.getDefaultRange(s, st))).toEqual(P(404, 'not-found'));
  });

  // The API validates the format before looking the spot up: what does not fit the spec is a 400, not a 404.
  it.each([['BTN_OPEN', 25, 'situation'], ['btn-open', 25, 'situation'], ['btn_open', 12.3, 'stack'], ['btn_open', 0.5, 'stack'],
    ['btn_open', 'abc', 'stack'], ['btn_open', 101, 'stack']])('400 para %s@%s mal formado', async (s, st, field) => {
    expect(await problemOf(api.getDefaultRange(s, st))).toEqual(P(400, 'validation'));
    expect((await errorsOf(api.getUserRange(s, st))).map(e => e.field)).toEqual([field]);
  });

  it('404 para una combinación del catálogo sin seed', async () => {
    expect(await problemOf(withoutBtnOpen20().getDefaultRange('btn_open', 20))).toEqual(P(404, 'not-found'));
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

  it('el 400 detalla cada mano inválida, un error por mano y con los mensajes de la API', async () => {
    const err = await api.putUserRange('btn_open', 25, { hands: { AAs: 'CHECK', KK: 'CHECK' }, version: 0 }).catch(e => e);
    expect(err.problem.detail).toBe('2 entradas no válidas en hands');
    expect(err.problem.errors).toEqual([
      { field: 'hands.AAs', message: 'mano no válida' },
      { field: 'hands.KK', message: 'acción CHECK no permitida en btn_open' }
    ]);
  });

  it.each([
    ['un campo que no es del contrato', { hands: {}, version: 0, source: 'user' }, [{ field: 'source', message: 'campo no permitido' }]],
    ['una acción que no existe', { hands: { AA: 'SHOVE' }, version: 0 }, [{ field: 'hands.AA', message: 'valor no válido' }]],
    ['version como texto', { hands: {}, version: '0' }, [{ field: 'version', message: 'valor no válido' }]],
    ['sin hands ni version', {}, [{ field: 'hands', message: 'obligatorio' }, { field: 'version', message: 'obligatorio' }]]
  ])('PUT con %s da 400 como la API', async (_case, body, errors) => {
    expect(await errorsOf(api.putUserRange('btn_open', 25, body))).toEqual(errors);
  });

  it('la lista sigue el orden de la API: posición en el catálogo y stack de mayor a menor', async () => {
    for (const [s, st] of [['sb_open', 20], ['btn_open', 20], ['btn_open', 25]]) {
      await api.putUserRange(s, st, { hands: {}, version: 0 });
    }
    expect((await api.listUserRanges()).map(r => `${r.situation}@${r.stack}`)).toEqual(['btn_open@25', 'btn_open@20', 'sb_open@20']);
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
    ['combinación desconocida', { stack: 99 }, P(404, 'not-found')]
  ])('POST con %s', async (_case, patch, expected) => {
    expect(await problemOf(api.recordAttempt({ ...answer, ...patch }))).toEqual(expected);
  });

  it.each([
    ['stack como texto', { stack: '25' }, [{ field: 'stack', message: 'valor no válido' }]],
    ['situación como número', { situation: 5 }, [{ field: 'situation', message: 'valor no válido' }]],
    ['acción que no existe', { given: 'SHOVE' }, [{ field: 'given', message: 'valor no válido' }]],
    ['situación mal formada', { situation: 'BTN_OPEN' }, [{ field: 'situation', message: 'formato no válido' }]],
    ['mano fuera del formato', { hand: 'AK' }, [{ field: 'hand', message: 'formato no válido' }]],
    ['mano no canónica', { hand: 'KAs' }, [{ field: 'hand', message: 'mano no válida' }]],
    ['acción de otra situación', { given: 'CHECK' }, [{ field: 'given', message: 'acción CHECK no permitida en btn_open' }]],
    ['sin mano', { hand: undefined }, [{ field: 'hand', message: 'obligatorio' }]]
  ])('POST con %s da 400 como la API', async (_case, patch, errors) => {
    expect(await errorsOf(api.recordAttempt({ ...answer, ...patch }))).toEqual(errors);
  });

  it('POST con combinación sin rango (ni de referencia ni del usuario)', async () => {
    expect(await problemOf(withoutBtnOpen20().recordAttempt({ ...answer, stack: 20 }))).toEqual(P(422, 'no-range'));
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

  it('la paginación es por posición: un intento nuevo entre páginas no repite ninguno', async () => {
    for (const hand of ['AA', 'KK', 'QQ']) {
      await api.recordAttempt({ ...answer, hand });
      now = new Date(now.getTime() + 1000);
    }
    const first = await api.listAttempts({ limit: 2 });
    await api.recordAttempt({ ...answer, hand: 'JJ' });
    expect((await api.listAttempts({ limit: 2, cursor: first.nextCursor })).items.map(a => a.hand)).toEqual(['AA']);
  });

  it('a igual fecha, ordena por id descendente como la API', async () => {
    const ids = [];
    for (const hand of ['AA', 'KK', 'QQ']) ids.push((await api.recordAttempt({ ...answer, hand })).id);
    const listed = [];
    let cursor;
    do {
      const page = await api.listAttempts({ limit: 1, cursor });
      listed.push(...page.items.map(a => a.id));
      cursor = page.nextCursor;
    } while (cursor);
    expect(listed).toEqual([...ids].sort().reverse());
  });

  it.each([[{ limit: 0 }], [{ limit: 201 }], [{ cursor: btoa('-1') }], [{ cursor: '%%%' }], [{ situation: 'BTN' }], [{ stack: 0 }]])('listAttempts(%o) da 400', async params => {
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

  it('getHandStats sigue el orden de la API y valida los filtros', async () => {
    await api.recordAttempt({ situation: 'btn_open', stack: 20, hand: 'KK', given: 'ALLIN' });
    await api.recordAttempt({ situation: 'btn_open', stack: 25, hand: 'A2s', given: 'ALLIN' });
    expect((await api.getHandStats()).map(r => `${r.stack} ${r.hand}`)).toEqual(['25 A2s', '25 AA', '20 KK']);
    expect(await problemOf(api.getHandStats({ stack: 0 }))).toEqual(P(400, 'validation'));
    expect(await problemOf(api.getHandStats({ situation: 'BTN' }))).toEqual(P(400, 'validation'));
  });

  it.each(['+01:00', 'europe/madrid', 'utc', 'EST', 'GMT+1', 'Nope/Zone', ''])('getProgress con tz=%s da 400, como la API', async tz => {
    expect(await errorsOf(api.getProgress({ tz }))).toEqual([{ field: 'tz', message: 'zona IANA desconocida' }]);
  });

  it.each(['UTC', 'Europe/Madrid', 'America/Argentina/Buenos_Aires', 'Etc/GMT+1'])('getProgress acepta tz=%s', async tz => {
    await expect(api.getProgress({ tz })).resolves.toEqual(expect.any(Array));
  });

  it('getProgress cuenta por día y valida parámetros', async () => {
    expect(await api.getProgress({ tz: 'Europe/Madrid' })).toEqual([{ date: '2026-09-26', attempts: 2, correct: 1 }]);
    expect(await problemOf(api.getProgress({ tz: 'Nope/Zone' }))).toEqual(P(400, 'validation'));
    expect(await problemOf(api.getProgress({ days: 0 }))).toEqual(P(400, 'validation'));
  });
});
