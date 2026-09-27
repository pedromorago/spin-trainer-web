/**
 * Pure pieces of the Google sign-in (ADR-0019): where to come back after the round trip through Google, how to read
 * the callback URL and how to word Supabase's errors in Spanish. Tested in __tests__/oauth.test.js.
 */

const RETURN_KEY = 'spin-trainer.returnTo';

/** Only paths of this app ("/quiz?s=x"): anything else ("//evil.example", "https://…", "/\\host") falls back to "/". */
export function safeReturnPath(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return '/';
  return value;
}

/** Keeps the route to come back to across the redirect to Google (sessionStorage: this tab only). */
export function rememberReturnPath(path, storage = globalThis.sessionStorage) {
  try { storage?.setItem(RETURN_KEY, safeReturnPath(path)); } catch { /* storage blocked: back to "/" */ }
}

/** Reads the saved route without side effects (it can run during render, which React may repeat). */
export function readReturnPath(storage = globalThis.sessionStorage) {
  try {
    return safeReturnPath(storage?.getItem(RETURN_KEY));
  } catch {
    return '/';
  }
}

/** Forgets the saved route once the sign-in has finished. */
export function forgetReturnPath(storage = globalThis.sessionStorage) {
  try { storage?.removeItem(RETURN_KEY); } catch { /* storage blocked: nothing saved */ }
}

export const OAUTH_ERRORS = {
  cancelled: 'Has cancelado el acceso con Google.',
  failed: 'Google no ha podido completar el acceso. Vuelve a intentarlo.',
  invalid: 'El enlace de acceso no es válido o ya se ha usado. Vuelve a entrar.'
};

/**
 * The query string Supabase sends back to /auth/callback: `?code=…` (PKCE) on success, `?error=…` when the user
 * cancels or the provider fails. Returns `{ code }` or `{ error }` with a Spanish message.
 */
export function parseOAuthCallback(search) {
  const params = new URLSearchParams(search);
  const error = params.get('error');
  if (error) return { error: error === 'access_denied' ? OAUTH_ERRORS.cancelled : OAUTH_ERRORS.failed };
  const code = params.get('code');
  return code ? { code } : { error: OAUTH_ERRORS.invalid };
}

/** Supabase Auth answers in English: the messages a user can meet, in Spanish; anything else, a generic one. */
export function authErrorMessage(error) {
  if (!error) return null;
  const message = String(error.message ?? '');
  if (/invalid login credentials/i.test(message)) return 'Email o contraseña incorrectos.';
  if (/email not confirmed/i.test(message)) return 'Tienes que confirmar tu email antes de entrar.';
  if (/rate limit|too many requests/i.test(message)) return 'Demasiados intentos. Espera un momento y vuelve a probar.';
  if (/failed to fetch|network/i.test(message)) return 'No hay conexión con el servidor de acceso. Vuelve a intentarlo.';
  return 'No se ha podido entrar. Vuelve a intentarlo.';
}
