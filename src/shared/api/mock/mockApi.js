// Adaptador en memoria (persistido en localStorage) con el mismo contrato que httpApi.
// Permite desarrollar y ejecutar E2E sin backend.
import { ApiError } from '../errors';
import { SITUATIONS } from './situations';
import { DEFAULT_RANGES } from './defaultRanges';

const LS_KEY = 'spin-trainer.mock.v1';
const delay = ms => new Promise(r => setTimeout(r, ms));
const key = (s, st) => `${s}@${st}`;

function load() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) ?? { userRanges: {}, attempts: [] }; }
  catch { return { userRanges: {}, attempts: [] }; }
}
function save(state) { localStorage.setItem(LS_KEY, JSON.stringify(state)); }

const notFound = detail => new ApiError({ type: 'urn:spin-trainer:not-found', title: 'Not found', detail }, 404);

export const mockApi = {
  async listSituations() { await delay(50); return SITUATIONS; },

  async getDefaultRange(situation, stack) {
    await delay(50);
    if (!SITUATIONS.find(s => s.key === situation && s.stacks.includes(Number(stack)))) throw notFound('Situación/stack desconocido');
    return { situation, stack: Number(stack), hands: DEFAULT_RANGES[key(situation, stack)] ?? {}, source: 'default', version: 1 };
  },

  async getUserRange(situation, stack) {
    await delay(50);
    const r = load().userRanges[key(situation, stack)];
    if (!r) throw notFound('Sin rango custom');
    return r;
  },

  async putUserRange(situation, stack, { hands, version }) {
    await delay(80);
    const state = load();
    const k = key(situation, stack);
    const current = state.userRanges[k];
    if (current && version !== undefined && version !== current.version) {
      throw new ApiError({ type: 'urn:spin-trainer:conflict', title: 'Conflict', detail: 'El rango cambió; recarga' }, 409);
    }
    const next = { situation, stack: Number(stack), hands, source: 'user', version: (current?.version ?? 0) + 1, updatedAt: new Date().toISOString() };
    state.userRanges[k] = next;
    save(state);
    return next;
  },

  async deleteUserRange(situation, stack) {
    const state = load();
    delete state.userRanges[key(situation, stack)];
    save(state);
    return null;
  },

  async recordAttempt(attempt) {
    await delay(30);
    const state = load();
    const stored = { id: crypto.randomUUID(), at: new Date().toISOString(), ...attempt };
    state.attempts.push(stored);
    save(state);
    return stored;
  },

  async listAttempts() { await delay(50); return load().attempts; }
};
