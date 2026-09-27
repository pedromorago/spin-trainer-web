import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../auth/supabaseClient', () => ({ getAccessToken: async () => 'jwt-token' }));
const { httpApi } = await import('../httpClient');
const { ApiError } = await import('../errors');

let fetchMock;
const json = (status, body, type = 'application/json') =>
  new Response(body === undefined ? null : JSON.stringify(body), { status, headers: body === undefined ? {} : { 'content-type': type } });

beforeEach(() => {
  fetchMock = vi.fn(async () => json(200, {}));
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

const lastCall = () => {
  const [url, init] = fetchMock.mock.calls.at(-1);
  return { url, ...init };
};

describe('httpApi (contrato v0.2)', () => {
  it.each([
    ['listSituations', [], 'GET', '/api/v1/situations'],
    ['listDefaultRanges', [], 'GET', '/api/v1/ranges/default'],
    ['getDefaultRange', ['bb_vs_btn_mr_sb_3bet', 12.5], 'GET', '/api/v1/ranges/default/bb_vs_btn_mr_sb_3bet/12.5'],
    ['listUserRanges', [], 'GET', '/api/v1/ranges/user'],
    ['getUserRange', ['btn_open', 25], 'GET', '/api/v1/ranges/user/btn_open/25'],
    ['deleteUserRange', ['btn_open', 25], 'DELETE', '/api/v1/ranges/user/btn_open/25'],
    ['listAttempts', [{ limit: 20, cursor: 'abc=', situation: undefined }], 'GET', '/api/v1/quiz/attempts?limit=20&cursor=abc%3D'],
    ['listAttempts', [], 'GET', '/api/v1/quiz/attempts'],
    ['getHandStats', [{ situation: 'btn_open', stack: 25 }], 'GET', '/api/v1/stats/hands?situation=btn_open&stack=25'],
    ['getProgress', [{ days: 7, tz: 'Europe/Madrid' }], 'GET', '/api/v1/stats/progress?days=7&tz=Europe%2FMadrid']
  ])('%s → %s %s', async (op, args, method, url) => {
    await httpApi[op](...args);
    expect(lastCall()).toMatchObject({ method, url });
  });

  it('PUT y POST envían JSON con el JWT y un correlation id', async () => {
    await httpApi.putUserRange('btn_open', 25, { hands: { AA: 'ALLIN' }, version: 0 });
    const put = lastCall();
    expect(put).toMatchObject({ method: 'PUT', url: '/api/v1/ranges/user/btn_open/25', body: '{"hands":{"AA":"ALLIN"},"version":0}' });
    expect(put.headers).toMatchObject({ Authorization: 'Bearer jwt-token', 'Content-Type': 'application/json' });
    expect(put.headers['X-Correlation-Id']).toMatch(/^[0-9a-f-]{36}$/);

    await httpApi.recordAttempt({ situation: 'btn_open', stack: 25, hand: 'AA', given: 'ALLIN' });
    expect(lastCall()).toMatchObject({ method: 'POST', url: '/api/v1/quiz/attempts' });
  });

  it('204 → null', async () => {
    fetchMock.mockResolvedValueOnce(json(204));
    expect(await httpApi.deleteUserRange('btn_open', 25)).toBeNull();
  });

  it('acepta JSON y Problem Details en todas las operaciones (el DELETE solo produce Problems)', async () => {
    fetchMock.mockResolvedValueOnce(json(204));
    await httpApi.deleteUserRange('btn_open', 25);
    expect(lastCall().headers.Accept).toBe('application/json, application/problem+json');
  });

  it('un Problem (application/problem+json) se convierte en ApiError con su tipo y estado', async () => {
    fetchMock.mockResolvedValueOnce(json(409, { type: 'urn:spin-trainer:conflict', title: 'Conflict', status: 409, detail: 'recarga' }, 'application/problem+json'));
    const err = await httpApi.putUserRange('btn_open', 25, { hands: {}, version: 1 }).catch(e => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 409, type: 'urn:spin-trainer:conflict', message: 'recarga', isConflict: true });
  });

  it('sin conexión → ApiError transitorio (estado 0) con un mensaje para el jugador', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const err = await httpApi.listSituations().catch(e => e);
    expect(err).toMatchObject({ status: 0, isTransient: true, message: 'Could not reach the server.' });
  });

  it('un 200 que no es JSON no viene de la API (p. ej. la página de espera del host): 502 transitorio', async () => {
    fetchMock.mockResolvedValueOnce(new Response('<html>waking up</html>', { status: 200, headers: { 'content-type': 'text/html' } }));
    const err = await httpApi.listSituations().catch(e => e);
    expect(err).toMatchObject({ status: 502, isTransient: true });
  });

  it('un error sin cuerpo JSON conserva su estado, y solo 502/503/504 son transitorios', async () => {
    fetchMock.mockResolvedValueOnce(new Response('bad gateway', { status: 503 }));
    expect(await httpApi.listSituations().catch(e => e)).toMatchObject({ status: 503, isTransient: true });
    fetchMock.mockResolvedValueOnce(json(400, { title: 'Bad Request', status: 400 }, 'application/problem+json'));
    expect(await httpApi.listSituations().catch(e => e)).toMatchObject({ status: 400, isTransient: false });
  });

  it('codifica los parámetros de ruta', async () => {
    await httpApi.getUserRange('a/b', 25);
    expect(lastCall().url).toBe('/api/v1/ranges/user/a%2Fb/25');
  });
});
