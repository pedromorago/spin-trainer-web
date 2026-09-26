import { ApiError } from './errors';
import { getAccessToken } from '../auth/supabaseClient';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';
const UNREACHABLE = { title: 'Sin conexión', detail: 'No se ha podido conectar con el servidor.' };
// Not "it retries by itself": the queries give up after a while (retry.js) and the message stays on screen.
const NOT_THE_API = { title: 'Servidor no disponible', detail: 'El servidor todavía no responde.' };

async function request(method, path, body) {
  const token = await getAccessToken();
  // Errors arrive as Problem Details (RFC 9457): they must be accepted, or a DELETE (no body on success) gets a 406.
  const headers = { Accept: 'application/json, application/problem+json', 'X-Correlation-Id': crypto.randomUUID() };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${BASE}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError(UNREACHABLE, 0);
  }
  if (res.status === 204) return null;
  const isJson = res.headers.get('content-type')?.includes('json');
  // The API always answers JSON: anything else comes from in between (e.g. a host's page while the server wakes up).
  if (!isJson) throw new ApiError(res.ok ? NOT_THE_API : null, res.ok ? 502 : res.status);
  const data = await res.json();
  if (!res.ok) throw new ApiError(data, res.status);
  return data;
}

const spot = (situation, stack) => `${encodeURIComponent(situation)}/${encodeURIComponent(stack)}`;
const query = params => {
  const entries = Object.entries(params ?? {}).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]);
  return entries.length ? `?${new URLSearchParams(entries)}` : '';
};

/** HTTP adapter for contract v0.2 (docs/openapi.yaml). Same contract as mock/mockApi.js. */
export const httpApi = {
  listSituations: () => request('GET', '/situations'),
  listDefaultRanges: () => request('GET', '/ranges/default'),
  getDefaultRange: (situation, stack) => request('GET', `/ranges/default/${spot(situation, stack)}`),
  listUserRanges: () => request('GET', '/ranges/user'),
  getUserRange: (situation, stack) => request('GET', `/ranges/user/${spot(situation, stack)}`),
  putUserRange: (situation, stack, payload) => request('PUT', `/ranges/user/${spot(situation, stack)}`, payload),
  deleteUserRange: (situation, stack) => request('DELETE', `/ranges/user/${spot(situation, stack)}`),
  recordAttempt: attempt => request('POST', '/quiz/attempts', attempt),
  listAttempts: params => request('GET', `/quiz/attempts${query(params)}`),
  getHandStats: params => request('GET', `/stats/hands${query(params)}`),
  getProgress: params => request('GET', `/stats/progress${query(params)}`)
};
