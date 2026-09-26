// hand.js — 13x13 matrix of preflop hands. No dependencies.
//
//   - Rows and columns: A, K, Q, J, T, 9, 8, 7, 6, 5, 4, 3, 2
//   - Diagonal -> pair (AA), upper triangle -> suited (AKs), lower -> offsuit (AKo)

export const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
export const HAND_RE = /^([AKQJT2-9])([AKQJT2-9])([so])?$/;

export function getHand(rowIdx, colIdx) {
  if (rowIdx === colIdx) return RANKS[rowIdx] + RANKS[colIdx];
  const high = RANKS[Math.min(rowIdx, colIdx)];
  const low = RANKS[Math.max(rowIdx, colIdx)];
  return high + low + (colIdx > rowIdx ? 's' : 'o');
}

export function getCell(hand) {
  if (!isValidHand(hand)) throw new Error(`Invalid hand: ${hand}`);
  const a = RANKS.indexOf(hand[0]);
  const b = RANKS.indexOf(hand[1]);
  const hi = Math.min(a, b), lo = Math.max(a, b);
  // Suited above the diagonal, offsuit below it; a pair (hi === lo) lands on it either way.
  return hand[2] === 's' ? [hi, lo] : [lo, hi];
}

export function isValidHand(hand) {
  const m = typeof hand === 'string' && hand.match(HAND_RE);
  if (!m) return false;
  const pair = m[1] === m[2];
  if (pair) return m[3] === undefined;
  // Stryker disable next-line EqualityOperator: pairs returned above, so the two ranks always differ here.
  return m[3] !== undefined && RANKS.indexOf(m[1]) < RANKS.indexOf(m[2]);
}

/** The 169 hands in grid order (row by row). */
export function allHands() {
  const out = [];
  for (let r = 0; r < 13; r++) for (let c = 0; c < 13; c++) out.push(getHand(r, c));
  return out;
}

/** Usual reading order: pairs, then suited, then offsuit; within each group, from highest to lowest. */
export function compareHands(a, b) {
  const key = h => {
    const group = h.length === 2 ? 0 : h[2] === 's' ? 1 : 2;
    return group * 1000 + RANKS.indexOf(h[0]) * 13 + RANKS.indexOf(h[1]);
  };
  return key(a) - key(b);
}

/** Number of combos: 6 for a pair, 4 suited, 12 offsuit. */
export function combos(hand) {
  if (hand.length === 2) return 6;
  return hand[2] === 's' ? 4 : 12;
}

export const TOTAL_COMBOS = 1326;
