// In-memory adapter (persisted in localStorage) with the same contract as httpApi: docs/openapi.yaml v0.2.
// Allows developing and running E2E without a backend. It validates like the API and owns the server fields
// (id, answeredAt, expected, correct, rangeSource, rangeVersion, version, updatedAt). A test validates its responses
// against the schemas of the spec (mock/__tests__/contract.test.js).
import { ApiError } from '../errors';
import { isValidHand } from '../../../domain/hand';
import { isValidAction } from '../../../domain/actions';
import { actionFor, normalizeRange } from '../../../domain/range';
import { aggregateAttempts, progressByDay } from '../../../domain/stats';
import { SITUATIONS } from './situations';
import { loadDefaultRanges } from './defaultRanges';

// v2: data shape of contract v0.2 (v1 attempts are not compatible).
const LS_KEY = 'spin-trainer.mock.v2';
const SEED_VERSION = 1;
const ATTEMPT_FIELDS = ['situation', 'stack', 'hand', 'given'];
const key = (s, st) => `${s}@${Number(st)}`;
const empty = () => ({ userRanges: {}, attempts: [] });

const problem = (status, kind, title, detail, errors) =>
  new ApiError({ type: `urn:spin-trainer:${kind}`, title, status, detail, ...(errors ? { errors } : {}) }, status);
const notFound = detail => problem(404, 'not-found', 'Not found', detail);
const invalid = (detail, errors = [{ field: 'body', message: detail }]) => problem(400, 'validation', 'Validation failed', detail, errors);
const conflict = detail => problem(409, 'conflict', 'Conflict', detail);
const noRange = detail => problem(422, 'no-range', 'No range', detail);

export function memoryStorage() {
  const data = new Map();
  return { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, String(v)) };
}

/**
 * @param {object} [opts]
 * @param {{getItem, setItem}} [opts.storage] localStorage by default (memory if it does not exist)
 * @param {number} [opts.latency] ms of simulated latency
 * @param {() => Date} [opts.clock] injectable clock (tests)
 * @param {Record<string, Record<string, string>>} [opts.defaultRanges] reference ranges by `situation@stack`;
 *   the seed ones by default, loaded the first time they are requested (tests: to try spots without a range)
 */
export function createMockApi({ storage = globalThis.localStorage ?? memoryStorage(), latency = 50, clock = () => new Date(),
  defaultRanges } = {}) {
  let reference = defaultRanges ? Promise.resolve(defaultRanges) : null;
  const referenceRanges = () => (reference ??= loadDefaultRanges());
  const defaultRange = (ranges, situation, stack) => {
    const hands = ranges[key(situation, stack)];
    return hands ? { situation, stack: Number(stack), hands: { ...hands }, source: 'default', version: SEED_VERSION } : null;
  };
  const delay = () => (latency ? new Promise(r => setTimeout(r, latency)) : Promise.resolve());
  const load = () => {
    try { return JSON.parse(storage.getItem(LS_KEY)) ?? empty(); }
    catch { return empty(); }
  };
  const save = state => storage.setItem(LS_KEY, JSON.stringify(state));
  const spot = (situation, stack) => {
    const s = SITUATIONS.find(x => x.key === situation);
    if (!s || !s.stacks.includes(Number(stack))) throw notFound(`Situación/stack desconocido: ${situation}@${stack}`);
    return s;
  };
  const validateHands = (hands, s) => {
    if (!hands || typeof hands !== 'object' || Array.isArray(hands)) throw invalid('hands es obligatorio', [{ field: 'hands', message: 'obligatorio' }]);
    const errors = Object.entries(hands).flatMap(([h, a]) => [
      ...(isValidHand(h) ? [] : [{ field: `hands.${h}`, message: 'mano inválida' }]),
      ...(isValidAction(a, s.actions) ? [] : [{ field: `hands.${h}`, message: `acción ${a} no permitida en ${s.key}` }])
    ]);
    if (errors.length) throw invalid(`${errors.length} entradas inválidas en hands`, errors);
  };

  return {
    async listSituations() { await delay(); return structuredClone(SITUATIONS); },

    async listDefaultRanges() {
      await delay();
      const ranges = await referenceRanges();
      return SITUATIONS.flatMap(s => s.stacks.map(st => defaultRange(ranges, s.key, st))).filter(Boolean);
    },

    async getDefaultRange(situation, stack) {
      await delay();
      spot(situation, stack);
      const range = defaultRange(await referenceRanges(), situation, stack);
      if (!range) throw notFound(`Sin rango de referencia para ${situation}@${stack}`);
      return range;
    },

    async listUserRanges() { await delay(); return Object.values(load().userRanges); },

    async getUserRange(situation, stack) {
      await delay();
      spot(situation, stack);
      const range = load().userRanges[key(situation, stack)];
      if (!range) throw notFound('Sin rango personalizado');
      return range;
    },

    /** v0.2: version is required. 0 = create (409 if it exists); N = replace version N (409 if it changed or was deleted). */
    async putUserRange(situation, stack, { hands, version } = {}) {
      await delay();
      const s = spot(situation, stack);
      if (!Number.isInteger(version) || version < 0) throw invalid('version es obligatoria (entero ≥ 0)', [{ field: 'version', message: 'entero ≥ 0' }]);
      validateHands(hands, s);

      const state = load();
      const k = key(situation, stack);
      const current = state.userRanges[k];
      if ((current?.version ?? 0) !== version) {
        throw conflict(current ? `El rango está en la versión ${current.version}; recarga` : 'El rango personalizado ya no existe; recarga');
      }
      const next = {
        situation, stack: Number(stack), hands: normalizeRange(hands, s.actions), source: 'user',
        version: version + 1, updatedAt: clock().toISOString()
      };
      state.userRanges[k] = next;
      save(state);
      return next;
    },

    async deleteUserRange(situation, stack) {
      await delay();
      spot(situation, stack);
      const state = load();
      delete state.userRanges[key(situation, stack)];
      save(state);
      return null;
    },

    /** v0.2: the server computes expected (effective range, ADR-0012) and correct; the client only sends what it did. */
    async recordAttempt(body = {}) {
      await delay();
      const extra = Object.keys(body).filter(f => !ATTEMPT_FIELDS.includes(f));
      if (extra.length) throw invalid(`Campos no permitidos: ${extra.join(', ')}`, extra.map(field => ({ field, message: 'no permitido' })));
      const { situation, stack, hand, given } = body;
      const s = spot(situation, stack);
      if (!isValidHand(hand)) throw invalid(`Mano inválida: ${hand}`, [{ field: 'hand', message: 'mano inválida' }]);
      if (!isValidAction(given, s.actions)) throw invalid(`Acción no permitida en ${situation}: ${given}`, [{ field: 'given', message: 'acción no permitida' }]);

      const ranges = await referenceRanges();
      const state = load();
      const range = state.userRanges[key(situation, stack)] ?? defaultRange(ranges, situation, stack);
      if (!range) throw noRange(`Sin rango para ${situation}@${stack}: no se puede corregir`);
      const expected = actionFor(range.hands, hand, s.actions);
      const stored = {
        id: crypto.randomUUID(), situation, stack: Number(stack), hand, given, expected, correct: expected === given,
        rangeSource: range.source, rangeVersion: range.version, answeredAt: clock().toISOString()
      };
      state.attempts.push(stored);
      save(state);
      return stored;
    },

    /** From most recent to oldest; opaque cursor (encoded offset). */
    async listAttempts({ limit = 50, cursor, situation, stack } = {}) {
      await delay();
      if (!Number.isInteger(limit) || limit < 1 || limit > 200) throw invalid('limit debe estar entre 1 y 200', [{ field: 'limit', message: '1..200' }]);
      let offset = 0;
      if (cursor != null) {
        offset = Number.parseInt(atob(cursor), 10);
        if (!Number.isInteger(offset) || offset < 0) throw invalid('cursor inválido', [{ field: 'cursor', message: 'inválido' }]);
      }
      const items = load().attempts
        .filter(a => (situation == null || a.situation === situation) && (stack == null || a.stack === Number(stack)))
        .reverse();
      const page = items.slice(offset, offset + limit);
      const end = offset + page.length;
      return { items: page, nextCursor: end < items.length ? btoa(String(end)) : null };
    },

    async getHandStats({ situation, stack } = {}) {
      await delay();
      const attempts = load().attempts
        .filter(a => (situation == null || a.situation === situation) && (stack == null || a.stack === Number(stack)));
      return aggregateAttempts(attempts);
    },

    async getProgress({ days = 30, tz = 'UTC' } = {}) {
      await delay();
      if (!Number.isInteger(days) || days < 1 || days > 365) throw invalid('days debe estar entre 1 y 365', [{ field: 'days', message: '1..365' }]);
      try { return progressByDay(load().attempts, { days, tz, now: clock() }); }
      catch (e) {
        if (e instanceof RangeError) throw invalid(`Zona horaria desconocida: ${tz}`, [{ field: 'tz', message: 'zona IANA desconocida' }]);
        throw e;
      }
    }
  };
}

// PURE: lets the bundler drop the mock from http-mode builds.
export const mockApi = /* @__PURE__ */ createMockApi();
