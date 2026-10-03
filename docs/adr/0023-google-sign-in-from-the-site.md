# ADR-0023: Sign in with Google straight from the site (OpenID Connect ID token)

Status: Accepted · Date: 2026-10-03 · Supersedes the redirect through Supabase of ADR-0019 (PKCE and `/auth/callback`)

## Context
With ADR-0019 the browser went to Google through Supabase, and Google returned to Supabase's address
(`<ref>.supabase.co/auth/v1/callback`). Google names that address on its screens: a player saw "continue to
uvaqvbljdyienzmvwegf.supabase.co", which looks unrelated to Spin Trainer and is what phishing looks like. Google shows
an app's name and logo only after brand verification, which requires owning every domain the OAuth client uses, and
`supabase.co` cannot be verified.

Options considered:
- **Supabase custom domain** (e.g. `auth.pedromorago.com`): it needs a paid plan plus a paid add-on, against
  ADR-0018 (free hosting only).
- **Google's own button (Google Identity Services)**: tried and rejected. Its script writes inline styles and a
  `<style>` element, which the CSP (`style-src 'self'`) blocks: the button rendered broken. It would have needed
  `'unsafe-inline'` styles for the whole site, a looser `Cross-Origin-Opener-Policy` and Google's script on our pages.
- **OpenID Connect straight from the site**: chosen.

## Decision
- **The browser goes to Google and comes back to this site.** "Continue with Google" sends it to Google's
  authorization endpoint with `response_type=id_token`, `scope=openid email profile`, a random `state` and the SHA-256
  of a random nonce; Google returns to `https://<web domain>/auth/google#id_token=…&state=…`. Google's screens now name
  the site itself, and every domain the OAuth client uses is ours, so brand verification becomes possible.
- **Supabase still issues the session** (ADR-0003): `/auth/google` checks the `state` against the one this tab saved
  in `sessionStorage`, then calls `signInWithIdToken` with the token and the raw nonce. Supabase verifies Google's
  signature, that the token was issued for our client ID, and that the nonce's hash matches the one Google signed in.
  The API does not change: the JWT is the same as before.
- **Replay and mix-up protection.** An answer whose `state` this tab did not start is refused before reaching
  Supabase (login CSRF); a token from another sign-in fails the nonce check. State and nonce are used once.
- **The token does not linger.** The return page clears the fragment from the address bar and the history at once.
  Supabase's client does not read sessions from the URL (`detectSessionInUrl: false`).
- **The strict CSP stays.** No Google script runs on our pages: going to Google is a navigation, not a request.
- **Errors are explained**, with a way back to the sign-in: cancelled, Google failing, an answer this tab did not ask
  for, and a token Supabase rejects. The return route is kept with the state, and only paths of this app are accepted.

## Consequences
- Configuration moves: the OAuth client's authorized redirect URI is `https://<web domain>/auth/google` (plus the
  development one), and the web needs `VITE_GOOGLE_CLIENT_ID` (public: it travels to Google in the URL). Supabase's
  Google provider keeps the client ID, against which it checks the token's audience. The old Supabase callback can be
  removed from the OAuth client once the new sign-in works (`docs/DEPLOY.md`).
- The ID token travels in the URL fragment, which browsers never send to servers; it is short-lived, bound to the
  nonce and removed at once.
- E2E (spin-trainer-qa, `google-sign-in.spec.ts`): Google and Supabase's token endpoint are played by the tests, and
  the web's part runs for real against the QA API. The tests check what Google is asked (client, return address,
  response type, a new state and nonce each time), that Supabase gets the token and the nonce whose hash Google got,
  that the player lands where they were going, that a foreign state never reaches Supabase, and every error. The real
  round trip through Google remains a manual check after each change to the sign-in.
