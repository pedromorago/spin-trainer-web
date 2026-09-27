import { PlayingCard } from './PlayingCard';
import { cardName } from './cardFaces';
import { theme } from '../theme/theme';

// Positions (x, y in %) per seat: the hero at the bottom and the rest clockwise. For each seat, where its
// cards and label (seat), its chips (bet) and the dealer button (dealer) go, without overlapping the hero's cards.
const LAYOUT = {
  3: [
    { seat: [50, 84], bet: [50, 63], dealer: [67, 76] },
    { seat: [16, 24], bet: [31, 41], dealer: [27, 30] },
    { seat: [84, 24], bet: [69, 41], dealer: [73, 30] }
  ],
  2: [
    { seat: [50, 84], bet: [50, 63], dealer: [67, 76] },
    { seat: [50, 14], bet: [50, 31], dealer: [61, 24] }
  ]
};
const ACTION_LABELS = {
  FOLD: 'Fold', LIMP: 'Limp', MIN_RAISE: 'Min-raise', RAISE: 'Raise', THREE_BET: '3-bet', CALL: 'Call', SHOVE: 'All-in'
};
const bb = n => `${Number.isInteger(n) ? n : n.toFixed(1)} BB`;

/**
 * Poker table at the moment the hero decides. Presentation only.
 * Props: seats and pot (domain/table#tableSeats, starting with the hero), heroCards (domain/cards#dealCards), stack, caption
 */
export function PokerTable({ seats, pot, heroCards, stack, caption }) {
  const layout = LAYOUT[seats.length];
  const description = [
    caption,
    ...seats.filter(s => !s.isHero).map(s => `${s.position}: ${s.action ? ACTION_LABELS[s.action] : 'to act'}${s.bet ? ` (${bb(s.bet)})` : ''}`),
    `You in ${seats[0].position} with ${heroCards.map(cardName).join(' and ')}`,
    `Effective stack ${bb(stack)}`
  ].filter(Boolean).join('. ');

  const abs = ([x, y]) => ({ position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' });
  const chip = {
    display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: theme.radius.pill,
    background: 'rgba(0, 0, 0, 0.55)', color: theme.colors.accentStrong, fontFamily: theme.font.mono, fontSize: 12, whiteSpace: 'nowrap'
  };

  return (
    // 16:10 aspect ratio, or 5:4 on narrow screens (.poker-table class in global.css) so that the cards fit.
    <figure role="img" aria-label={description} data-testid="poker-table" className="poker-table"
      style={{ position: 'relative', width: '100%', maxWidth: 640, margin: '0 auto' }}>
      <div aria-hidden="true" style={{
        position: 'absolute', inset: '14% 6% 14% 6%', borderRadius: '50%',
        background: 'radial-gradient(ellipse at 50% 40%, #237552 0%, #15543a 55%, #0d3826 100%)',
        border: '10px solid #3b2a17', boxShadow: `0 0 0 2px ${theme.colors.accent}, inset 0 0 40px rgba(0, 0, 0, 0.55), 0 12px 30px rgba(0, 0, 0, 0.5)`
      }} />
      <div aria-hidden="true" style={{ ...abs([50, 47]), textAlign: 'center', lineHeight: 1.1 }}>
        <div style={{ fontFamily: theme.font.display, fontSize: 'clamp(20px, 5vw, 34px)', letterSpacing: 1, color: theme.colors.text }}
          data-testid="table-stack">{bb(stack)}</div>
        {pot !== null && <div style={{ fontFamily: theme.font.mono, fontSize: 12, color: theme.colors.accentStrong }}>Pot {bb(pot)}</div>}
      </div>

      {seats.map((seat, i) => {
        const at = layout[i];
        return (
          <div key={seat.position} aria-hidden="true">
            <div style={{ ...abs(at.seat), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
              data-seat={seat.position} data-hero={seat.isHero ? 'true' : undefined} data-folded={seat.folded ? 'true' : undefined}>
              {seat.isHero ? (
                <div style={{ display: 'flex', gap: 6 }} data-testid="hero-cards">
                  {heroCards.map(c => <PlayingCard key={`${c.rank}${c.suit}`} card={c} />)}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 2, opacity: seat.folded ? 0.25 : 1 }}>
                  <PlayingCard size="sm" /><PlayingCard size="sm" />
                </div>
              )}
              <div style={{
                padding: '2px 10px', borderRadius: theme.radius.pill, fontSize: 12, whiteSpace: 'nowrap',
                background: seat.isHero ? theme.colors.accent : theme.colors.bgElevated,
                color: seat.isHero ? theme.colors.onAccent : theme.colors.text,
                border: `1px solid ${seat.isHero ? theme.colors.accentStrong : theme.colors.border}`, opacity: seat.folded ? 0.6 : 1
              }}>
                <strong>{seat.position}</strong>{seat.isHero ? ' · You' : seat.action ? ` · ${ACTION_LABELS[seat.action]}` : ''}
              </div>
            </div>
            {(seat.bet !== 0) && (
              <div style={{ ...abs(at.bet) }} data-bet={seat.position}>
                <span style={chip}><span style={{ width: 8, height: 8, borderRadius: '50%', background: theme.colors.accent }} />
                  {seat.bet === null ? ACTION_LABELS[seat.action] : bb(seat.bet)}</span>
              </div>
            )}
            {seat.isDealer && (
              <div style={{ ...abs(at.dealer), width: 22, height: 22, borderRadius: '50%',
                background: '#f7f5ef', color: '#1b1d22', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center',
                justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.5)' }} data-testid="dealer-button">D</div>
            )}
          </div>
        );
      })}
    </figure>
  );
}
