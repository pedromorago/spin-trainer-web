import { describe, expect, it } from 'vitest';
import { authErrorMessage } from '../authErrors';

describe('authErrorMessage', () => {
  it.each([
    ['Request rate limit reached', 'Too many attempts. Wait a moment and try again.'],
    ['Failed to fetch', 'Could not reach the sign-in server. Please try again.'],
    ['Bad ID token', 'Could not sign in. Please try again.'],
    ['Something unexpected', 'Could not sign in. Please try again.']
  ])('"%s" reads "%s"', (message, expected) => {
    expect(authErrorMessage({ message })).toBe(expected);
  });

  it('no error, no message', () => {
    expect(authErrorMessage(null)).toBeNull();
  });
});
