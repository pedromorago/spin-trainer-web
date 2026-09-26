import { theme } from '../theme/theme';
import { cardName, SUIT_FACES } from './cardFaces';

const SIZES = {
  lg: { width: 'clamp(36px, 10vw, 72px)', rank: 'clamp(16px, 4.6vw, 32px)', suit: 'clamp(14px, 4vw, 28px)' },
  sm: { width: 'clamp(18px, 4vw, 28px)', rank: 0, suit: 0 }
};

/** Carta. Props: card ({ rank, suit }) o null (tapada), size ('lg' | 'sm') */
export function PlayingCard({ card = null, size = 'lg' }) {
  const s = SIZES[size];
  const base = {
    width: s.width, aspectRatio: '5 / 7', borderRadius: size === 'lg' ? 8 : 3, flexShrink: 0,
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.45)', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', lineHeight: 1, userSelect: 'none'
  };
  if (!card) {
    return (
      <span role="img" aria-label="Carta tapada" data-card="hidden" style={{
        ...base, border: `1px solid ${theme.colors.accent}`,
        background: `repeating-linear-gradient(45deg, #5a1f2a 0 4px, #43161f 4px 8px)`
      }} />
    );
  }
  const suit = SUIT_FACES[card.suit];
  return (
    <span role="img" aria-label={cardName(card)} data-card={`${card.rank}${card.suit}`}
      style={{ ...base, background: '#f7f5ef', color: suit.color, border: '1px solid #d9d4c5' }}>
      <span style={{ fontFamily: theme.font.mono, fontWeight: 800, fontSize: s.rank }}>{card.rank === 'T' ? '10' : card.rank}</span>
      <span aria-hidden="true" style={{ fontSize: s.suit }}>{suit.symbol}</span>
    </span>
  );
}
