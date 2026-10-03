import { describe, expect, it } from 'vitest';
import { initialScope, nextScope } from '../userScope';

describe('nextScope', () => {
  const loading = initialScope({ userId: null, loading: true });

  it('the stored session read at start-up joins the current scope: nothing on screen starts again', () => {
    expect(nextScope(loading, { userId: 'u1', loading: false })).toEqual({ generation: 0, userId: 'u1', settled: true });
    expect(nextScope(loading, { userId: null, loading: false })).toEqual({ generation: 0, userId: null, settled: true });
  });

  it('nothing changes while the session is still being read', () => {
    expect(nextScope(loading, { userId: null, loading: true })).toBe(loading);
  });

  it('a later change of user is a new generation of caches', () => {
    const signedIn = initialScope({ userId: 'u1', loading: false });
    const signedOut = nextScope(signedIn, { userId: null, loading: false });
    expect(signedOut).toEqual({ generation: 1, userId: null, settled: true });
    expect(nextScope(signedOut, { userId: 'u2', loading: false })).toEqual({ generation: 2, userId: 'u2', settled: true });
  });

  it('the same user keeps the same scope', () => {
    const signedIn = initialScope({ userId: 'u1', loading: false });
    expect(nextScope(signedIn, { userId: 'u1', loading: false })).toBe(signedIn);
  });
});
