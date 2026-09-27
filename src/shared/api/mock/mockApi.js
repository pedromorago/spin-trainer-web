// In-memory adapter (persisted in localStorage) with the same contract as httpApi: docs/openapi.yaml v0.2.
// Allows developing and running E2E without a backend. It validates like the API and owns the server fields
// (id, answeredAt, expected, correct, rangeSource, rangeVersion, version, updatedAt). A test validates its responses
// against the schemas of the spec (mock/__tests__/contract.test.js).
import { ApiError } from '../errors';
import { isValidHand } from '../../../domain/hand';
import { ACTIONS, isValidAction } from '../../../domain/actions';
import { actionFor, normalizeRange } from '../../../domain/range';
import { aggregateAttempts, progressByDay } from '../../../domain/stats';
import { SITUATIONS } from './situations';
import { loadDefaultRanges } from './defaultRanges';

// v2: data shape of contract v0.2 (v1 attempts are not compatible).
const LS_KEY = 'spin-trainer.mock.v2';
const SEED_VERSION = 1;
const ATTEMPT_FIELDS = ['situation', 'stack', 'hand', 'given'];
const RANGE_FIELDS = ['hands', 'version'];
const MAX_HANDS = 169;
// Formats of the spec (SituationKey, Hand): what fails them is a 400 before looking anything up.
const SITUATION_KEY = /^[a-z0-9_]{1,64}$/;
const HAND_FORMAT = /^(?:([AKQJT2-9])\1|([AKQJT2-9])(?!\2)[AKQJT2-9][so])$/;
const key = (s, st) => `${s}@${Number(st)}`;
// lastVersions: the highest version each custom range had, which a delete keeps (as the API's V6).
const empty = () => ({ userRanges: {}, lastVersions: {}, attempts: [] });
const position = situation => SITUATIONS.findIndex(s => s.key === situation);
// The API's order: catalog position, stack from highest to lowest (and then hand).
const bySpot = (a, b) => position(a.situation) - position(b.situation) || b.stack - a.stack;

const problem = (status, kind, title, detail, errors) =>
  new ApiError({ type: `urn:spin-trainer:${kind}`, title, status, detail, ...(errors ? { errors } : {}) }, status);
const notFound = detail => problem(404, 'not-found', 'Not found', detail);
const invalid = (detail, errors) => problem(400, 'validation', 'Validation failed', detail, errors);
const conflict = detail => problem(409, 'conflict', 'Conflict', detail);
const noRange = detail => problem(422, 'no-range', 'No range', detail);

// The same 400s as the API, by where it detects them:
// - JSON that does not map (unknown field, wrong type or action): the first one, "<message>: <field>";
const unreadable = (field, message) => invalid(`${message}: ${field}`, [{ field, message }]);
// - rules of the spec (required, pattern, minimum...): all of them, "<field>: <message>" or "N invalid fields: ...";
const specErrors = errors => {
  if (!errors.length) return;
  const detail = errors.length === 1 ? `${errors[0].field}: ${errors[0].message}`
    : `${errors.length} invalid fields: ${[...new Set(errors.map(e => e.field))].join(', ')}`;
  throw invalid(detail, errors);
};
// - business rules (canonical hand, action of the situation...): the rule's message.
const ruleError = (field, message) => invalid(message, [{ field, message }]);

/** A stack of the spec (number, 1..100, multiple of 0.5): the spec's errors, or the rule's for the multiple. */
function stackErrors(stack, field = 'stack') {
  if (typeof stack !== 'number' || !Number.isFinite(stack)) return [{ field, message: 'invalid value' }];
  if (stack < 1) return [{ field, message: 'debe ser ≥ 1' }];
  if (stack > 100) return [{ field, message: 'debe ser ≤ 100' }];
  return [];
}
function checkStackRule(stack) {
  if (!Number.isInteger(stack * 2)) throw ruleError('stack', 'the stack must be a multiple of 0.5 BB');
}
const situationErrors = (situation, field = 'situation') =>
  (typeof situation === 'string' && SITUATION_KEY.test(situation) ? [] : [{ field, message: 'invalid format' }]);

/** Optional filters ?situation=&stack= (path and query values arrive as numbers or strings of the URL). */
function checkFilters({ situation, stack }) {
  const st = stack == null ? null : Number(stack);
  specErrors([...(situation == null ? [] : situationErrors(situation)), ...(st == null ? [] : stackErrors(st))]);
  if (st != null) checkStackRule(st);
  return st;
}

/**
 * IANA zone as the API accepts it (java.time): a Region/City (or UTC) spelled canonically, not an offset or an
 * abbreviation. The browser always sends one of those (Intl resolvedOptions).
 */
function isIanaZone(tz) {
  if (typeof tz !== 'string' || (tz !== 'UTC' && !tz.includes('/'))) return false;
  try {
    const resolved = new Intl.DateTimeFormat('en', { timeZone: tz }).resolvedOptions().timeZone;
    // Intl also accepts other spellings (europe/madrid): if it only differs in case, it is not the canonical name.
    return resolved === tz || resolved.toLowerCase() !== tz.toLowerCase();
  } catch {
    return false;
  }
}

// Keyset cursor, like the API's: the position (answeredAt|id) of the page's last attempt, in URL-safe Base64.
const encodeCursor = a => btoa(`${a.answeredAt}|${a.id}`).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
function decodeCursor(cursor) {
  try {
    const [answeredAt, id, ...rest] = atob(cursor.replaceAll('-', '+').replaceAll('_', '/')).split('|');
    if (rest.length || !id || Number.isNaN(Date.parse(answeredAt))) throw new Error('format');
    return { answeredAt, id };
  } catch {
    throw ruleError('cursor', 'invalid cursor');
  }
}
const newestFirst = (a, b) => b.answeredAt.localeCompare(a.answeredAt) || b.id.localeCompare(a.id);

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
    try { return { ...empty(), ...JSON.parse(storage.getItem(LS_KEY)) }; }
    catch { return empty(); }
  };
  const save = state => storage.setItem(LS_KEY, JSON.stringify(state));
  // A situation and stack of the path: malformed → 400; well formed but not in the catalog → 404.
  const spot = (situation, stack) => {
    const st = typeof stack === 'string' && stack.trim() !== '' ? Number(stack) : stack;
    specErrors([...situationErrors(situation), ...stackErrors(st)]);
    checkStackRule(st);
    const s = SITUATIONS.find(x => x.key === situation);
    if (!s || !s.stacks.includes(st)) throw notFound(`Unknown situation/stack: ${situation}@${st}`);
    return s;
  };
  // One error per hand, as the API: a hand that is not canonical, or an action the situation does not have.
  const validateHands = (hands, s) => {
    const errors = Object.entries(hands).flatMap(([h, a]) => {
      if (!isValidHand(h)) return [{ field: `hands.${h}`, message: 'invalid hand' }];
      return isValidAction(a, s.actions) ? [] : [{ field: `hands.${h}`, message: `${a == null ? 'empty action' : `action ${a}`} not allowed in ${s.key}` }];
    });
    if (errors.length) throw invalid(`${errors.length} invalid entries in hands`, errors);
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
      if (!range) throw notFound(`No reference range for ${situation}@${stack}`);
      return range;
    },

    async listUserRanges() { await delay(); return Object.values(load().userRanges).sort(bySpot); },

    async getUserRange(situation, stack) {
      await delay();
      spot(situation, stack);
      const range = load().userRanges[key(situation, stack)];
      if (!range) throw notFound(`No custom range for ${situation}@${stack}`);
      return range;
    },

    /**
     * v0.2: version is required. 0 = create (409 if it exists); N = replace version N (409 if it changed or was deleted).
     * A range created again continues after the last version it had: a stale version never matches a different range.
     */
    async putUserRange(situation, stack, body = {}) {
      await delay();
      const s = spot(situation, stack);
      const unknown = Object.keys(body).find(f => !RANGE_FIELDS.includes(f));
      if (unknown) throw unreadable(unknown, 'field not allowed');
      const { hands, version } = body;
      if (hands != null && (typeof hands !== 'object' || Array.isArray(hands))) throw unreadable('hands', 'invalid value');
      const unknownAction = Object.entries(hands ?? {}).find(([, a]) => a != null && !ACTIONS.includes(a));
      if (unknownAction) throw unreadable(`hands.${unknownAction[0]}`, 'invalid value');
      if (version != null && !Number.isInteger(version)) throw unreadable('version', 'invalid value');
      specErrors([
        ...(hands == null ? [{ field: 'hands', message: 'obligatorio' }]
          : Object.keys(hands).length > MAX_HANDS ? [{ field: 'hands', message: `size must be at most ${MAX_HANDS}` }] : []),
        ...(version == null ? [{ field: 'version', message: 'obligatorio' }] : version < 0 ? [{ field: 'version', message: 'debe ser ≥ 0' }] : [])
      ]);
      validateHands(hands, s);

      const state = load();
      const k = key(situation, stack);
      const current = state.userRanges[k];
      if ((current?.version ?? 0) !== version) {
        throw conflict(current ? `The range is at version ${current.version}; reload` : 'The custom range no longer exists; reload');
      }
      const next = {
        situation, stack: Number(stack), hands: normalizeRange(hands, s.actions), source: 'user',
        version: version === 0 ? (state.lastVersions[k] ?? 0) + 1 : version + 1, updatedAt: clock().toISOString()
      };
      state.userRanges[k] = next;
      state.lastVersions[k] = next.version;
      save(state);
      return next;
    },

    async deleteUserRange(situation, stack) {
      await delay();
      spot(situation, stack);
      const state = load();
      const k = key(situation, stack);
      const current = state.userRanges[k];
      if (current) state.lastVersions[k] = Math.max(state.lastVersions[k] ?? 0, current.version);
      delete state.userRanges[k];
      save(state);
      return null;
    },

    /** v0.2: the server computes expected (effective range, ADR-0012) and correct; the client only sends what it did. */
    async recordAttempt(body = {}) {
      await delay();
      const unknown = Object.keys(body).find(f => !ATTEMPT_FIELDS.includes(f));
      if (unknown) throw unreadable(unknown, 'field not allowed');
      const { situation, stack, hand, given } = body;
      // Strict JSON, as the API: no number where a text goes, or a text where a number goes.
      const wrongType = [['situation', situation, 'string'], ['stack', stack, 'number'], ['hand', hand, 'string']]
        .find(([, value, type]) => value != null && typeof value !== type);
      if (wrongType) throw unreadable(wrongType[0], 'invalid value');
      if (given != null && !ACTIONS.includes(given)) throw unreadable('given', 'invalid value');
      const required = (field, value, errors) => (value == null ? [{ field, message: 'obligatorio' }] : errors());
      specErrors([
        ...required('situation', situation, () => situationErrors(situation)),
        ...required('stack', stack, () => stackErrors(stack)),
        ...required('hand', hand, () => (HAND_FORMAT.test(hand) ? [] : [{ field: 'hand', message: 'invalid format' }])),
        ...required('given', given, () => [])
      ]);
      const s = spot(situation, stack);
      if (!isValidHand(hand)) throw ruleError('hand', 'invalid hand');
      if (!isValidAction(given, s.actions)) throw ruleError('given', `action ${given} not allowed in ${situation}`);

      const ranges = await referenceRanges();
      const state = load();
      const range = state.userRanges[key(situation, stack)] ?? defaultRange(ranges, situation, stack);
      if (!range) throw noRange(`No range for ${situation}@${stack}: the answer cannot be graded`);
      const expected = actionFor(range.hands, hand, s.actions);
      const stored = {
        id: crypto.randomUUID(), situation, stack: Number(stack), hand, given, expected, correct: expected === given,
        rangeSource: range.source, rangeVersion: range.version, answeredAt: clock().toISOString()
      };
      state.attempts.push(stored);
      save(state);
      return stored;
    },

    /**
     * From most recent to oldest (answeredAt, then id), with a keyset cursor like the API's: an attempt recorded
     * between two pages neither repeats nor skips one.
     */
    async listAttempts({ limit = 50, cursor, situation, stack } = {}) {
      await delay();
      const st = checkFilters({ situation, stack });
      specErrors(!Number.isInteger(limit) ? [{ field: 'limit', message: 'invalid value' }]
        : limit < 1 ? [{ field: 'limit', message: 'debe ser ≥ 1' }] : limit > 200 ? [{ field: 'limit', message: 'debe ser ≤ 200' }] : []);
      const after = cursor == null ? null : decodeCursor(cursor);
      const items = load().attempts
        .filter(a => (situation == null || a.situation === situation) && (st == null || a.stack === st))
        .filter(a => !after || newestFirst(after, a) < 0)
        .sort(newestFirst);
      const page = items.slice(0, limit);
      return { items: page, nextCursor: items.length > limit ? encodeCursor(page.at(-1)) : null };
    },

    async getHandStats({ situation, stack } = {}) {
      await delay();
      const st = checkFilters({ situation, stack });
      const attempts = load().attempts
        .filter(a => (situation == null || a.situation === situation) && (st == null || a.stack === st));
      return aggregateAttempts(attempts).sort((a, b) => bySpot(a, b) || (a.hand < b.hand ? -1 : a.hand > b.hand ? 1 : 0));
    },

    async getProgress({ days = 30, tz = 'UTC' } = {}) {
      await delay();
      specErrors(!Number.isInteger(days) ? [{ field: 'days', message: 'invalid value' }]
        : days < 1 ? [{ field: 'days', message: 'debe ser ≥ 1' }] : days > 365 ? [{ field: 'days', message: 'debe ser ≤ 365' }] : []);
      if (!isIanaZone(tz)) throw ruleError('tz', 'unknown IANA time zone');
      return progressByDay(load().attempts, { days, tz, now: clock() });
    }
  };
}

// PURE: lets the bundler drop the mock from http-mode builds.
export const mockApi = /* @__PURE__ */ createMockApi();
