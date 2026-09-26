// Rangos de referencia del mock: los del seed de la API (Tablasmentov3.pdf). reference-ranges.json es una copia de
// spin-trainer-api/reference-ranges.json que no se edita a mano (npm run ranges:sync / ranges:check).

/** { 'btn_open@25': { AA: 'MR_4B_C', ... } }: solo las manos con acción explícita. */
export const bySpot = ranges => Object.freeze(Object.fromEntries(ranges.map(r => [`${r.situation}@${r.stack}`, Object.freeze(r.hands)])));

/**
 * Carga perezosa: el JSON va en su propio chunk, que solo se descarga en modo mock al pedir rangos; el build http
 * (sin mock) no lo incluye.
 */
export const loadDefaultRanges = () => import('./reference-ranges.json').then(m => bySpot(m.default.ranges));
