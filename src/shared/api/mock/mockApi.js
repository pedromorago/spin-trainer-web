// Adaptador en memoria (persistido en localStorage) con el mismo contrato que httpApi (docs/openapi-draft.yaml).
// Permite desarrollar y ejecutar E2E sin backend. Valida como lo haría la API y es dueño de los campos de servidor
// (id, at, correct, version, updatedAt): el cliente no puede fijarlos.
import { ApiError } from '../errors';
import { isValidHand } from '../../../domain/hand';
import { isValidAction } from '../../../domain/actions';
import { normalizeRange } from '../../../domain/range';
import { SITUATIONS } from './situations';
import { DEFAULT_RANGES } from './defaultRanges';

const LS_KEY = 'spin-trainer.mock.v1';
const key = (s, st) => `${s}@${st}`;

const problem = (status, kind, title, detail) =>
  new ApiError({ type: `urn:spin-trainer:${kind}`, title, status, detail }, status);
const notFound = detail => problem(404, 'not-found', 'Not found', detail);
const invalid = detail => problem(400, 'validation', 'Validation failed', detail);
const conflict = detail => problem(409, 'conflict', 'Conflict', detail);

export function memoryStorage() {
  const data = new Map();
  return { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, String(v)) };
}

/**
 * @param {object} [opts]
 * @param {{getItem, setItem}} [opts.storage] por defecto localStorage (memoria si no existe)
 * @param {number} [opts.latency] ms de latencia simulada
 */
export function createMockApi({ storage = globalThis.localStorage ?? memoryStorage(), latency = 50 } = {}) {
  const delay = () => (latency ? new Promise(r => setTimeout(r, latency)) : Promise.resolve());
  const load = () => {
    try { return JSON.parse(storage.getItem(LS_KEY)) ?? { userRanges: {}, attempts: [] }; }
    catch { return { userRanges: {}, attempts: [] }; }
  };
  const save = state => storage.setItem(LS_KEY, JSON.stringify(state));
  const findSituation = (situation, stack) => {
    const s = SITUATIONS.find(x => x.key === situation);
    return s && s.stacks.includes(Number(stack)) ? s : null;
  };

  return {
    async listSituations() { await delay(); return structuredClone(SITUATIONS); },

    async getDefaultRange(situation, stack) {
      await delay();
      if (!findSituation(situation, stack)) throw notFound('Situación/stack desconocido');
      return { situation, stack: Number(stack), hands: { ...DEFAULT_RANGES[key(situation, stack)] }, source: 'default', version: 1 };
    },

    async getUserRange(situation, stack) {
      await delay();
      const r = load().userRanges[key(situation, stack)];
      if (!r) throw notFound('Sin rango custom');
      return r;
    },

    async putUserRange(situation, stack, { hands, version } = {}) {
      await delay();
      const s = findSituation(situation, stack);
      if (!s) throw invalid('Situación/stack desconocido');
      if (!hands || typeof hands !== 'object' || Array.isArray(hands)) throw invalid('hands es obligatorio');
      const badHands = Object.keys(hands).filter(h => !isValidHand(h));
      if (badHands.length) throw invalid(`Manos inválidas: ${badHands.join(', ')}`);
      const badActions = Object.entries(hands).filter(([, a]) => !isValidAction(a, s.actions)).map(([h, a]) => `${h}=${a}`);
      if (badActions.length) throw invalid(`Acciones no permitidas en ${situation}: ${badActions.join(', ')}`);

      const state = load();
      const k = key(situation, stack);
      const current = state.userRanges[k];
      if (current && version !== undefined && version !== current.version) throw conflict('El rango cambió; recarga');
      const next = {
        situation, stack: Number(stack), hands: normalizeRange(hands, s.actions), source: 'user',
        version: (current?.version ?? 0) + 1, updatedAt: new Date().toISOString()
      };
      state.userRanges[k] = next;
      save(state);
      return next;
    },

    async deleteUserRange(situation, stack) {
      await delay();
      const state = load();
      delete state.userRanges[key(situation, stack)];
      save(state);
      return null;
    },

    async recordAttempt({ situation, stack, hand, expected, given } = {}) {
      await delay();
      const s = findSituation(situation, stack);
      if (!s) throw invalid('Situación/stack desconocido');
      if (!isValidHand(hand)) throw invalid(`Mano inválida: ${hand}`);
      for (const a of [expected, given]) if (!isValidAction(a, s.actions)) throw invalid(`Acción no permitida en ${situation}: ${a}`);
      const state = load();
      const stored = {
        situation, stack: Number(stack), hand, expected, given,
        id: crypto.randomUUID(), correct: expected === given, at: new Date().toISOString()
      };
      state.attempts.push(stored);
      save(state);
      return stored;
    },

    async listAttempts() { await delay(); return load().attempts; }
  };
}

// PURE: permite al bundler eliminar el mock de los builds en modo http.
export const mockApi = /* @__PURE__ */ createMockApi();
