# ADR-0022: Public landing page, demo mode and first-visit onboarding

Status: Accepted · Date: 2026-10-03

## Context
Spin Trainer opened to other players (ADR-0019), but a visitor's first sight of it was a sign-in page: nothing showed
what the product was before asking for a Google account. While the owner gathers feedback, sign-in should also be
switchable off for a few days without touching the API or Supabase. And a first-time player meets four tabs, a grid of
169 hands and the PDF's abbreviations (MR, 3b, AI, Iso…) with no explanation.

## Decision
- **Public landing page at `/`.** It shows the product without an account: a live reference chart (BTN Open, 25 BB),
  one Quiz question graded against the chart ("Try a hand"), the four modes and links to the repositories. It is built
  from the app's own components and the reference ranges bundled with the web (`useShowcase`), never from the API: it
  works for anonymous visitors, and while the free API sleeps (ADR-0018). Its figures (situations, ranges) are counted
  from that data. Old links with a selection (`/?s=…&stack=…`) still open the Explorer.
- **Demo mode (`VITE_API_MODE=demo`, `build:demo`).** A third build mode next to `http` and `mock`: the mock's
  in-browser adapter, with no sign-in or sign-out (`/login` goes straight into the app) and a "Demo" badge that says the
  progress stays in this browser. Production switches between `http` and `demo` with one Vercel variable and a
  redeploy (`docs/DEPLOY.md`). ADR-0003 is not reopened: the demo never talks to the API or to Supabase, so the API
  stays the only path to the database; the demo's data never leaves the browser.
- **First-visit tour, per device.** The first visit to the Explorer starts a guided tour (9 steps: the tabs, situation,
  stack, actions, grid, range summary and session scoreboard). It can be skipped on every step (or with Escape) and
  replayed from the header's "Tour" button. Seen or skipped is remembered in `localStorage` (`spin-trainer.tour`):
  per device and browser, with no account involved; blocked storage counts as seen, so it never nags.
- **Tooltips and "?" help.** Each action explains itself on hover and on keyboard focus (WAI-ARIA tooltip pattern,
  WCAG 1.4.13: hoverable, dismissable with Escape) and as its accessible description; small "?" buttons (24 px targets)
  open the same help on touch screens, including a glossary of the PDF's abbreviations.

## Consequences
- The landing is public and makes no API request; sign-in is asked for only when entering the app (outside the demo).
- In demo mode nothing is shared between devices, and clearing the browser's data resets it. Going back to `http`
  restores sign-in; demo data is not migrated to accounts.
- The tour and the tooltips are accessible by design: a modal dialog with a focus trap and focus on each step's title,
  a bottom sheet on phones; tooltips open on keyboard focus but not on a click's focus, so they never cover what the
  click changes.
- E2E (spin-trainer-qa): `landing.spec.ts`, `onboarding.spec.ts` and `tooltips.spec.ts` run against the mock and the
  real API; a third Playwright project builds the demo and runs `demo.spec.ts`. The other specs start as a returning
  visitor (the `onboarded` fixture), so the tour does not cover them.
