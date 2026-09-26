# spin-trainer-web

Spin Trainer frontend. Rules shared by the three repos, summarized here so this repo is self-contained.

## Global rules (summary)
- Portfolio quality > speed. Source of truth: `docs/SPIN_TRAINER_PROJECT_CONTEXT.md`, `docs/ARCHITECTURE.md`, `docs/adr/*`, `docs/openapi.yaml` (copy of the API contract).
- ADRs are closed (0001..0015); they are reopened only for a concrete, justified flaw.
- Spin & Go only (3-max and HU, 16 situations). From the 6-max MTT prototype we take UI and flows, not code or ranges (ADR-0011).
- Effective range = the custom one if it exists, otherwise the PDF one (`useEffectiveRange`). Only the Explorer writes ranges; the Builder does not persist (ADR-0012).
- Supabase only issues the JWT; all data goes through the API. Default ranges in the DB (Flyway). Quiz attempts = immutable events.
- No TypeScript in this repo. Discarded: OWASP ZAP, load testing, Pact, pgTAP.
- Code comments and documentation in English (README, ADRs, CONTRIBUTING.md, docs/, OpenAPI descriptions). In Spanish: app UI text, API error messages, test titles and Gherkin features.
- Commits **always in Pedro's name** (author and committer: `Pedro Morago López-Vázquez <pedromoragolv@gmail.com>`; check `git config user.name/user.email` before committing). Conventional Commits, no co-author or attribution trailer.
- Be concise, propose before generating a lot of code, iterate in blocks with confirmation.

## Stack and commands
React 19 · React Router 7 · Vite · TanStack Query · Supabase Auth · inline CSS-in-JS (tokens in `shared/theme`) · Vitest.

```
npm install
npm run dev:mock      # no backend (vite --mode mock)
npm run dev           # VITE_API_MODE from .env.local
npm test              # Vitest
npm run test:coverage # 90% threshold on domain/ and mock
npm run lint          # ESLint, includes layer rules
npm run build         # also build:mock
npm run spec:check    # docs/openapi.yaml == ../spin-trainer-api/openapi.yaml
npm run ranges:check  # mock/reference-ranges.json == ../spin-trainer-api/reference-ranges.json
```
Before committing: `npm run lint && npm test && npm run build` green.

## Layers (allowed dependencies: features → shared → domain)
- `src/domain/`: pure JS. **Does not import React or do I/O** (no fetch, localStorage or Supabase). Imports only from `domain/`.
  **Every change in `domain/` comes with a Vitest test** in `src/domain/__tests__/`.
- `src/shared/api/`: data access. `index.js` picks the adapter (`httpClient` | `mock/mockApi`) based on `VITE_API_MODE`; `queries.js` exposes TanStack Query hooks.
  Both adapters implement the same contract (the spec's).
- `src/shared/ui/`: presentation. Does not import `shared/api` (receives data through props/arguments).
- `src/features/`: composition only. For data it uses **only** `shared/api/index.js` and `shared/api/queries.js`; never `httpClient` or `mockApi`.
- A hand's effective action is computed only with `domain/range.js#actionFor`.
- Action colors only in `shared/theme/actionColors.js`; the domain knows nothing about colors. They never repeat within a situation (tested).
- Layer rules are enforced by `eslint.config.js`; if they change, change them there and in `docs/ARCHITECTURE.md`.
- The mock (`shared/api/mock`) validates like the API and owns the server-side fields. Contract v0.2 (ADR-0013): the server grades attempts,
  `PUT` requires `version`, stats are aggregated by the API and the policy lives in `domain/stats.js`. Changing the contract = change `spin-trainer-api/openapi.yaml` first
  and pull it with `npm run spec:sync` (`spec:check` detects drift); `mock/__tests__/contract.test.js` validates the mock against the copy.
- Mock reference ranges: `mock/reference-ranges.json`, a copy of the API seed (`npm run ranges:sync`; not edited by hand),
  loaded with a dynamic `import()` so it stays out of the http build. Tests that need a spot without a range pass `defaultRanges`.

## Conventions
- Router in *data mode* (`createBrowserRouter`, lazy routes in `src/App.jsx`).
- `features/shell/AppShell` gives pages `{ situations, selection }` via `useOutletContext()`; pages have no selector of their own.
  The selection lives in the URL (`?s=<key|any>&stack=<bb|any>`) and is normalized with `domain/selection.js`. With "Any", Quiz and Builder work on the selection's *spots* that have a range
  (`useEffectiveRanges` + `domain/quiz.js#playableSpots`).
- Study session (`shared/session`): local scoreboard of Quiz answers. Historical progress is the API's attempts.
- State that depends on (situation, stack): reset it with `key` on a child component, not with `setState` inside effects.
- Accessibility: controls with a role and an accessible name (Playwright `getByRole`/`getByLabel` first).
  Grid cells: `"<hand>: <action>"`. Inline confirmations with `ConfirmBar`, not `window.confirm`.
- Editable grid: `HandGrid onPaint` + `domain/range.js#paintHand` (sets, does not toggle; `ERASE` = eraser). Unsaved changes: `useUnsavedChanges` + `UnsavedChangesBar`.
- Text on action colors: `shared/theme/contrast.js#readableText` (WCAG AA ≥ 4.5:1 test for every action).
- Quiz: questions from `domain/quiz.js#nextQuestion` (the selection's spots, normal/hard mode); table with `domain/table.js` + `PokerTable`.
  Keyboard shortcuts with `useEffectEvent` + a listener on `window`; visible `<kbd>` elements are `aria-hidden` and the shortcut goes in `aria-keyshortcuts`.
- Test selectors: `data-testid` in kebab-case `<feature>-<element>`; attributes `data-hand`, `data-action` (effective action),
  `data-implicit`, `data-verdict` (`correct|wrong|extra|missing`), `data-played`, `data-stack`.
- Builder verdicts: `domain/range.js#evaluateRange` (types and scoring) + `shared/theme/verdictStyles.js` (outline and glyph, not just color).
- Charts: never a dual axis (two measures → two aligned charts); one series → no legend, the title names it; selective direct labeling;
  crosshair/tooltip also by keyboard, plus a table view. Colors `theme.colors.chart*`, validated with the dataviz palette validator
  against the dark surface (L 0.48–0.67, ≥ 3:1); text never takes the series color.
- The contract lives in `spin-trainer-api/openapi.yaml`; `docs/openapi.yaml` is a copy that is not edited by hand.
