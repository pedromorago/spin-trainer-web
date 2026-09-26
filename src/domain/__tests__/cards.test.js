import { describe, expect, it } from 'vitest';
import { dealCards, SUITS } from '../cards';
import { allHands } from '../hand';

// RNG reproducible (mulberry32) para comprobar propiedades con muchas tiradas.
function seeded(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('dealCards', () => {
  it('carta alta primero y palos coherentes para las 169 manos con 50 semillas', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const rng = seeded(seed);
      for (const hand of allHands()) {
        const [a, b] = dealCards(hand, rng);
        expect([a.rank, b.rank]).toEqual([hand[0], hand[1]]);
        expect(SUITS).toContain(a.suit);
        expect(SUITS).toContain(b.suit);
        if (hand[2] === 's') expect(a.suit, hand).toBe(b.suit);
        else expect(a.suit, hand).not.toBe(b.suit);
      }
    }
  });

  it('usa los cuatro palos', () => {
    const rng = seeded(7);
    const seen = new Set(Array.from({ length: 200 }, () => dealCards('AKo', rng)[0].suit));
    expect([...seen].sort()).toEqual([...SUITS].sort());
  });

  it('rechaza manos inválidas', () => {
    expect(() => dealCards('AAs')).toThrow('Mano inválida');
  });
});
