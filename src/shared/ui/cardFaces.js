// Card faces: 4-color deck (tells suited/offsuit apart at a glance) and accessible names.
export const SUIT_FACES = {
  s: { symbol: '♠', color: '#1b1d22', name: 'picas' },
  h: { symbol: '♥', color: '#d62839', name: 'corazones' },
  d: { symbol: '♦', color: '#1f5fd6', name: 'diamantes' },
  c: { symbol: '♣', color: '#17803d', name: 'tréboles' }
};
const RANK_NAMES = { A: 'As', K: 'Rey', Q: 'Dama', J: 'Jota', T: '10' };

export const cardName = ({ rank, suit }) => `${RANK_NAMES[rank] ?? rank} de ${SUIT_FACES[suit].name}`;
