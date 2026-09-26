// table.js — table state at the moment the hero decides, from Situation.hero/priorActions (contract v0.2).

/** Seats in preflop action order. In HU the button is the SB. */
export const SEAT_ORDER = { '3max': ['BTN', 'SB', 'BB'], hu: ['SB', 'BB'] };
const DEALER = { '3max': 'BTN', hu: 'SB' };
const BLINDS = { SB: 0.5, BB: 1 };
// Stryker disable next-line ArithmeticOperator: with the big blind as the unit (1), 2 * BB and 2 / BB are equal.
const MIN_RAISE_BET = 2 * BLINDS.BB;

/**
 * @param {{ format, hero, priorActions }} situation
 * @param {number} stack effective stack in BB
 * @returns {{ seats: Array<{position, isHero, isDealer, action, folded, bet}>, pot: number|null }}
 *   seats starts with the hero and continues clockwise (action order). `bet` in BB; null if the size
 *   is unknown (raise or 3-bet: the catalog does not give the size). `pot` is null if any bet is unknown.
 */
export function tableSeats(situation, stack) {
  const order = SEAT_ORDER[situation.format];
  if (!order) throw new Error(`Unknown format: ${situation.format}`);
  if (!order.includes(situation.hero)) throw new Error(`Hero ${situation.hero} does not play in ${situation.format}`);

  const seats = order.map(position => ({
    position, isHero: position === situation.hero, isDealer: position === DEALER[situation.format],
    action: null, folded: false, bet: BLINDS[position] ?? 0
  }));
  let toCall = BLINDS.BB;
  for (const { position, action } of situation.priorActions) {
    const seat = seats.find(s => s.position === position);
    if (!seat || seat.isHero) throw new Error(`Invalid prior action: ${position} ${action}`);
    seat.action = action;
    if (action === 'FOLD') seat.folded = true; // the blind already posted stays in the pot
    else if (action === 'LIMP') seat.bet = BLINDS.BB;
    else if (action === 'CALL') seat.bet = toCall;
    else if (action === 'MIN_RAISE') toCall = seat.bet = MIN_RAISE_BET;
    else if (action === 'SHOVE') toCall = seat.bet = stack;
    else toCall = seat.bet = null; // RAISE / THREE_BET: unknown size
  }

  const heroIndex = seats.findIndex(s => s.isHero);
  const clockwise = [...seats.slice(heroIndex), ...seats.slice(0, heroIndex)];
  const pot = seats.some(s => s.bet === null) ? null : seats.reduce((n, s) => n + s.bet, 0);
  return { seats: clockwise, pot };
}
