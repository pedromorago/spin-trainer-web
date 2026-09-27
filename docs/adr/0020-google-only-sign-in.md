# ADR-0020: Google is the only way to sign in

Status: Accepted · Date: 2026-09-27 · Supersedes the password sign-in kept by ADR-0019

## Context
ADR-0019 kept an email and password form next to Google, only to sign in to accounts that already had a password. The
only such account was the owner's, created by hand in Supabase before Google existed, and Supabase has since linked
it to the owner's Google identity (same verified email). The form was a second way in that nobody needed: one more
credential to leak or guess, and a login page that looked as if it offered email accounts it would not create.

## Decision
- **Google is the only way in.** The web shows only "Continuar con Google", and Supabase's Email provider is off, so
  its API accepts neither email sign-ups nor password sign-ins.
- **The mock keeps a test-player field** (clearly labelled as the mock's): in mock mode there is no Supabase, and the
  E2E suite uses it to play as several players on the same tab. Outside the mock `signIn` does not exist.

## Consequences
- One way in, one identity provider: accounts are Google accounts, and Supabase stores no passwords.
- Losing access to the Google account means losing access to Spin Trainer; recovery is Google's.
- The E2E suite checks that no password field is shown (`auth.spec.ts`); the rest of ADR-0019 is unchanged.
