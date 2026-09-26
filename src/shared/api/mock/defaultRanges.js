// Mock reference ranges: those of the API seed (Tablasmentov3.pdf). reference-ranges.json is a copy of
// spin-trainer-api/reference-ranges.json that is not edited by hand (npm run ranges:sync / ranges:check).

/** { 'btn_open@25': { AA: 'MR_4B_C', ... } }: only hands with an explicit action. */
export const bySpot = ranges => Object.freeze(Object.fromEntries(ranges.map(r => [`${r.situation}@${r.stack}`, Object.freeze(r.hands)])));

/**
 * Lazy loading: the JSON goes in its own chunk, which is only downloaded in mock mode when ranges are requested;
 * the http build (without mock) does not include it.
 */
export const loadDefaultRanges = () => import('./reference-ranges.json').then(m => bySpot(m.default.ranges));
