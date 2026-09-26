import { ApiError } from './errors';
import { getAccessToken } from '../auth/supabaseClient';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

async function request(method, path, body) {
  const token = await getAccessToken();
  const headers = { Accept: 'application/json', 'X-Correlation-Id': crypto.randomUUID() };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  if (res.status === 204) return null;
  const isJson = res.headers.get('content-type')?.includes('json');
  const data = isJson ? await res.json() : null;
  if (!res.ok) throw new ApiError(data, res.status);
  return data;
}

/** Adaptador HTTP: implementa el mismo contrato que mock/mockApi.js. */
export const httpApi = {
  listSituations: () => request('GET', '/situations'),
  getDefaultRange: (situation, stack) => request('GET', `/ranges/default/${situation}/${stack}`),
  getUserRange: (situation, stack) => request('GET', `/ranges/user/${situation}/${stack}`),
  putUserRange: (situation, stack, payload) => request('PUT', `/ranges/user/${situation}/${stack}`, payload),
  deleteUserRange: (situation, stack) => request('DELETE', `/ranges/user/${situation}/${stack}`),
  recordAttempt: attempt => request('POST', '/quiz/attempts', attempt),
  listAttempts: () => request('GET', '/quiz/attempts')
};
