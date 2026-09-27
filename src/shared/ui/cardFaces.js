// Card faces: 4-color deck (tells suited/offsuit apart at a glance) and accessible names.
export const SUIT_FACES = {
  s: { symbol: '♠', color: '#1b1d22', name: 'spades' },
  h: { symbol: '♥', color: '#d62839', name: 'hearts' },
  d: { symbol: '♦', color: '#1f5fd6', name: 'diamonds' },
  c: { symbol: '♣', color: '#17803d', name: 'clubs' }
};
const RANK_NAMES = { A: 'Ace', K: 'King', Q: 'Queen', J: 'Jack', T: '10' };

export const cardName = ({ rank, suit }) => `${RANK_NAMES[rank] ?? rank} of ${SUIT_FACES[suit].name}`;
