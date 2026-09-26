import { describe, expect, it } from 'vitest';
import { accuracy, bySituation, weakestHands } from '../stats';

const A = [
  { situation: 'btn_open', stack: 25, hand: 'AA', correct: true },
  { situation: 'btn_open', stack: 25, hand: 'AA', correct: true },
  { situation: 'btn_open', stack: 20, hand: 'K9s', correct: false },
  { situation: 'hu_sb_open', stack: 10, hand: 'K9s', correct: false }
];

describe('stats', () => {
  it('accuracy global', () => expect(accuracy(A)).toBe(0.5));
  it('agrupa por situación', () => {
    expect(bySituation(A).btn_open).toEqual({ total: 3, correct: 2, accuracy: 2 / 3 });
  });
  it('detecta manos débiles', () => {
    expect(weakestHands(A)[0]).toMatchObject({ hand: 'K9s', accuracy: 0 });
  });
});
