// table.js — estado de la mesa en el momento de decidir el héroe, a partir de Situation.hero/priorActions (contrato v0.2).

/** Asientos en orden de acción preflop. En HU el botón es la SB. */
export const SEAT_ORDER = { '3max': ['BTN', 'SB', 'BB'], hu: ['SB', 'BB'] };
const DEALER = { '3max': 'BTN', hu: 'SB' };
const BLINDS = { SB: 0.5, BB: 1 };

/**
 * @param {{ format, hero, priorActions }} situation
 * @param {number} stack stack efectivo en BB
 * @returns {{ seats: Array<{position, isHero, isDealer, action, folded, bet}>, pot: number|null }}
 *   seats empieza por el héroe y sigue en sentido horario (orden de acción). `bet` en BB; null si el tamaño
 *   no se conoce (raise o 3-bet: el catálogo no da el tamaño). `pot` es null si alguna apuesta es desconocida.
 */
export function tableSeats(situation, stack) {
  const order = SEAT_ORDER[situation.format];
  if (!order) throw new Error(`Formato desconocido: ${situation.format}`);
  if (!order.includes(situation.hero)) throw new Error(`Héroe ${situation.hero} no juega en ${situation.format}`);

  const seats = order.map(position => ({
    position, isHero: position === situation.hero, isDealer: position === DEALER[situation.format],
    action: null, folded: false, bet: BLINDS[position] ?? 0
  }));
  let toCall = BLINDS.BB;
  for (const { position, action } of situation.priorActions) {
    const seat = seats.find(s => s.position === position);
    if (!seat || seat.isHero) throw new Error(`Acción previa inválida: ${position} ${action}`);
    seat.action = action;
    if (action === 'FOLD') seat.folded = true; // la ciega que ya puso queda en el bote
    else if (action === 'LIMP') seat.bet = BLINDS.BB;
    else if (action === 'CALL') seat.bet = toCall;
    else if (action === 'MIN_RAISE') toCall = seat.bet = 2 * BLINDS.BB;
    else if (action === 'SHOVE') toCall = seat.bet = stack;
    else toCall = seat.bet = null; // RAISE / THREE_BET: tamaño desconocido
  }

  const heroIndex = seats.findIndex(s => s.isHero);
  const clockwise = [...seats.slice(heroIndex), ...seats.slice(0, heroIndex)];
  const pot = seats.some(s => s.bet === null) ? null : seats.reduce((n, s) => n + s.bet, 0);
  return { seats: clockwise, pot };
}
