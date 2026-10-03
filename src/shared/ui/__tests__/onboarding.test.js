import { describe, expect, it } from 'vitest';
import { markTourSeen, TOUR_KEY, tourSeen } from '../onboarding';

const memoryStorage = () => {
  const data = new Map();
  return { getItem: k => (data.has(k) ? data.get(k) : null), setItem: (k, v) => data.set(k, String(v)), data };
};

describe('tour seen', () => {
  it('a new browser has not seen it', () => {
    expect(tourSeen(memoryStorage())).toBe(false);
  });

  it.each(['done', 'skipped'])('finishing it as "%s" is remembered', outcome => {
    const storage = memoryStorage();
    markTourSeen(outcome, storage);

    expect(tourSeen(storage)).toBe(true);
    expect(storage.data.get(TOUR_KEY)).toBe(outcome);
  });

  it('with storage blocked it never nags', () => {
    const blocked = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } };

    expect(tourSeen(blocked)).toBe(true);
    expect(() => markTourSeen('done', blocked)).not.toThrow();
  });

  it('without storage (no browser) it has not been seen', () => {
    expect(tourSeen(null)).toBe(false);
    expect(() => markTourSeen('done', null)).not.toThrow();
  });
});
