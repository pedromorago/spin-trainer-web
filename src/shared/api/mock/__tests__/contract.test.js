// El mock cumple el contrato: sus respuestas y errores validan contra los schemas de docs/openapi.yaml.
// Es la versión en el frontend de la "validación contra la spec" de ADR-0008: si la spec o el mock divergen, falla.
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { parse } from 'yaml';
import { createMockApi, memoryStorage } from '../mockApi';

const spec = parse(readFileSync(new URL('../../../../../docs/openapi.yaml', import.meta.url), 'utf8'));
// strict: false porque el documento OpenAPI tiene claves que no son JSON Schema (paths, example, x-enum-varnames…).
const ajv = addFormats(new Ajv2020({ strict: false, allErrors: true }));
ajv.addSchema(spec, 'spec');

const schema = name => ({ $ref: `spec#/components/schemas/${name}` });
const arrayOf = name => ({ type: 'array', items: schema(name) });
function expectValid(jsonSchema, data) {
  const valid = ajv.validate(jsonSchema, data);
  expect(valid, ajv.errorsText(ajv.errors, { separator: '\n' })).toBe(true);
}
const problemOf = promise => promise.then(() => { throw new Error('se esperaba un error'); }, e => e.problem);

let api;
beforeAll(async () => {
  api = createMockApi({ storage: memoryStorage(), latency: 0 });
  await api.putUserRange('btn_open', 25, { hands: { AA: 'ALLIN', KK: 'MR_4B_C' }, version: 0 });
  for (const given of ['ALLIN', 'MR_4B_C', 'FOLD']) await api.recordAttempt({ situation: 'btn_open', stack: 25, hand: 'AA', given });
});

describe('respuestas del mock conformes a docs/openapi.yaml', () => {
  it('GET /situations → Situation[]', async () => expectValid(arrayOf('Situation'), await api.listSituations()));
  it('GET /ranges/default → Range[]', async () => expectValid(arrayOf('Range'), await api.listDefaultRanges()));
  it('GET /ranges/default/{s}/{st} → Range', async () => expectValid(schema('Range'), await api.getDefaultRange('btn_open', 25)));
  it('GET /ranges/user → Range[]', async () => expectValid(arrayOf('Range'), await api.listUserRanges()));
  it('GET /ranges/user/{s}/{st} → Range', async () => expectValid(schema('Range'), await api.getUserRange('btn_open', 25)));
  it('POST /quiz/attempts → Attempt', async () => {
    expectValid(schema('Attempt'), await api.recordAttempt({ situation: 'btn_open', stack: 25, hand: 'KK', given: 'MR_4B_C' }));
  });
  it('GET /quiz/attempts → AttemptPage', async () => expectValid(schema('AttemptPage'), await api.listAttempts({ limit: 2 })));
  it('GET /stats/hands → HandStat[]', async () => expectValid(arrayOf('HandStat'), await api.getHandStats()));
  it('GET /stats/progress → ProgressDay[]', async () => expectValid(arrayOf('ProgressDay'), await api.getProgress()));
});

describe('errores del mock conformes a Problem (RFC 9457)', () => {
  it.each([
    ['400', () => api.putUserRange('btn_open', 25, { hands: { AAs: 'ALLIN' }, version: 1 })],
    ['404', () => api.getDefaultRange('nope', 25)],
    ['409', () => api.putUserRange('btn_open', 25, { hands: {}, version: 0 })],
    // El seed trae todas las combinaciones: el 422 necesita un mock sin el rango de btn_open@20.
    ['422', () => createMockApi({ storage: memoryStorage(), latency: 0, defaultRanges: {} })
      .recordAttempt({ situation: 'btn_open', stack: 20, hand: 'AA', given: 'ALLIN' })]
  ])('%s → Problem', async (_status, call) => expectValid(schema('Problem'), await problemOf(call())));
});

describe('la spec rechaza lo que el mock rechaza', () => {
  it('AttemptWrite no admite expected ni correct', () => {
    expect(ajv.validate(schema('AttemptWrite'), { situation: 'btn_open', stack: 25, hand: 'AA', given: 'ALLIN', expected: 'ALLIN' })).toBe(false);
  });

  it('RangeWrite exige version', () => {
    expect(ajv.validate(schema('RangeWrite'), { hands: {} })).toBe(false);
  });

  it.each(['AAs', 'AK', 'A1s'])('Hand rechaza %s', hand => expect(ajv.validate(schema('Hand'), hand)).toBe(false));

  it('Stack admite 12.5 y rechaza 12.3', () => {
    expect(ajv.validate(schema('Stack'), 12.5)).toBe(true);
    expect(ajv.validate(schema('Stack'), 12.3)).toBe(false);
  });
});
