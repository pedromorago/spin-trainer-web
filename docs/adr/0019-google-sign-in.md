# ADR-0019: Open to other players, with Google as the only way to create an account

Status: Accepted · Date: 2026-09-27 · Refines ADR-0003 (Supabase still only issues the JWT) · Password sign-in removed by ADR-0020

## Context
Spin Trainer went live as a personal tool with sign-ups closed. Other players asked to use it. The API was already
multi-user (every query is scoped by the JWT's `sub`, and the QA suite checks that each player only sees their own
data), so opening it is a question of how accounts are created and of the obligations that come with other people's
data.

Email sign-up is the weak option on the free plan: Supabase's built-in mailer only delivers to the project's team, so a
stranger would never receive the confirmation email (a custom SMTP provider would be one more account and secret), and
an open email form invites bots.

## Decision
- **New accounts only through Google** (Supabase's Google provider, scopes `openid email profile`). The first sign-in
  creates the account. The web has no email sign-up; the email and password form stays, only to sign in to accounts
  that already have a password. Supabase's global "Allow new users to sign up" must be on (it also gates OAuth);
  "Confirm email" stays on, so an email sign-up sent straight to Supabase's API produces an account that can never sign
  in (no confirmation email is delivered).
- **PKCE with an explicit callback**: the client uses `flowType: 'pkce'` and does not look for sessions in the URL.
  Google's round trip lands on `/auth/callback?code=…`, and that page exchanges the one-time code (once, even when
  React runs effects twice) and goes on to the route the user was heading to. The route is kept in `sessionStorage`
  across the redirect and only same-app paths are accepted (no open redirect). No tokens ever travel in the URL.
- **Errors in Spanish**: a cancelled consent, a provider failure or a code without its verifier each get a message and
  a way back to the login; Supabase's English messages are translated for the password form too.
- **A public privacy notice** (`/privacidad`, GDPR arts. 13-14), linked from the login: controller and contact, the
  data kept (the account's email; Google also shares name and picture, which are stored but unused; custom ranges and
  quiz answers), purpose, processors and where they run, retention, rights and the Spanish supervisory authority.
- The API does not change: Google users get ordinary Supabase JWTs (ES256, same issuer), and ADR-0003 still holds.

## Consequences
- Anyone with a Google account can use the app; bots have little to gain. Accounts are free up to Supabase's limits
  (50,000 monthly active users), far beyond the expected use.
- An existing email account signs in with Google too when the addresses match: Supabase links the identities.
- The real round trip through Google is not automated (it would need Google test accounts in CI): it is a manual check
  after each change to the login. The E2E suite covers the rest: Google's button in mock mode, every error the callback
  can receive, a code without its verifier against the QA Supabase, and the privacy page (including axe).
- Other people's data brings obligations: the notice must match what is stored, and each request to exercise a right
  (access, erasure) is answered within a month. Until self-service account deletion exists, erasure is by email.
