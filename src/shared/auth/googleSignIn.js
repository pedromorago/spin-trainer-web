/**
 * Sign-in with Google by OpenID Connect, straight from this site (ADR-0023): the browser goes to Google and comes back
 * to this site's /auth/google with an ID token, which Supabase exchanges for its session (signInWithIdToken). Google's
 * screens name the address it returns to, so they name this site, not the Supabase project; and no Google script runs
 * on these pages. Pure pieces, tested in __tests__/googleSignIn.test.js.
 */

const AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const PENDING_KEY = 'spin-trainer.google-sign-in';

/** Where Google sends the browser back. Registered in the Google OAuth client's authorized redirect URIs. */
export const GOOGLE_RETURN_PATH = '/auth/google';

export const GOOGLE_ERRORS = {
  cancelled: 'You cancelled the sign-in with Google.',
  failed: 'Google could not complete the sign-in. Please try again.',
  invalid: 'This sign-in link is not valid or has already been used. Please sign in again.'
};

const hex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
const base64url = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const random = crypto => base64url(crypto.getRandomValues(new Uint8Array(32)));

/** Only paths of this app ("/quiz?s=x"): anything else ("//evil.example", "https://…", "/\\host") falls back to "/". */
export function safeReturnPath(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return '/';
  return value;
}

/**
 * A new sign-in: what this tab keeps until Google answers, and where to send the browser. The `state` ties Google's
 * answer to this tab (an answer started elsewhere is refused); the nonce's SHA-256 goes to Google, which signs it into
 * the ID token, and the raw nonce stays here for Supabase, which hashes it again and compares: a token taken from
 * another sign-in does not match.
 * @returns {Promise<{ pending: { state, nonce, returnPath }, url: string }>}
 */
export async function startGoogleSignIn({ clientId, origin, returnPath, crypto = globalThis.crypto }) {
  const state = random(crypto);
  const nonce = random(crypto);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(nonce));
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${origin}${GOOGLE_RETURN_PATH}`,
    response_type: 'id_token',
    scope: 'openid email profile',
    state,
    nonce: hex(new Uint8Array(digest)),
    prompt: 'select_account'
  });
  return { pending: { state, nonce, returnPath: safeReturnPath(returnPath) }, url: `${AUTHORIZE_URL}?${params}` };
}

/** Keeps the sign-in this tab started (sessionStorage: this tab only). False if storage is blocked. */
export function savePending(pending, storage = globalThis.sessionStorage) {
  try {
    storage.setItem(PENDING_KEY, JSON.stringify(pending));
    return true;
  } catch {
    return false;
  }
}

/** Reads it without side effects (it can run during render, which React may repeat). */
export function readPending(storage = globalThis.sessionStorage) {
  try {
    const pending = JSON.parse(storage?.getItem(PENDING_KEY) ?? 'null');
    return pending && typeof pending.state === 'string' && typeof pending.nonce === 'string' ? pending : null;
  } catch {
    return null;
  }
}

/** Forgets it once Google has answered: a state and a nonce are used once. */
export function forgetPending(storage = globalThis.sessionStorage) {
  try { storage?.removeItem(PENDING_KEY); } catch { /* storage blocked: nothing saved */ }
}

/**
 * Google's answer, from the return URL's fragment (`#id_token=…&state=…`, or `#error=…`), checked against the sign-in
 * this tab started. Returns `{ token, nonce, returnPath }`, or `{ error }` with a message for the user.
 */
export function readGoogleAnswer(hash, pending) {
  const params = new URLSearchParams(String(hash ?? '').replace(/^#/, ''));
  const error = params.get('error');
  if (error) return { error: error === 'access_denied' ? GOOGLE_ERRORS.cancelled : GOOGLE_ERRORS.failed };
  const token = params.get('id_token');
  if (!pending || !token || params.get('state') !== pending.state) return { error: GOOGLE_ERRORS.invalid };
  return { token, nonce: pending.nonce, returnPath: safeReturnPath(pending.returnPath) };
}
