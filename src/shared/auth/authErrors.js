/** Supabase Auth's raw messages, worded for the user when signing in fails. Tested in __tests__/authErrors.test.js. */
export function authErrorMessage(error) {
  if (!error) return null;
  const message = String(error.message ?? '');
  if (/rate limit|too many requests/i.test(message)) return 'Too many attempts. Wait a moment and try again.';
  if (/failed to fetch|network/i.test(message)) return 'Could not reach the sign-in server. Please try again.';
  return 'Could not sign in. Please try again.';
}
