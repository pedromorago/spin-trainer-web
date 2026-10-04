// What the landing page shows (ADR-0022): the product without an account and without the API. The catalog and the
// example reference ranges bundled with the web (ADR-0024) are the same seed the API serves (kept in sync by
// `npm run ranges:check`); the JSON is its own chunk, downloaded only when the landing asks for it.
import { loadDefaultRanges } from './mock/defaultRanges';
import { SITUATIONS } from './mock/situations';

/** @returns {Promise<{ situations: object[], ranges: Record<string, Record<string, string>> }>} ranges by 'situation@stack' */
export async function loadShowcase() {
  return { situations: SITUATIONS, ranges: await loadDefaultRanges() };
}
