# Architecture — Spin Trainer

## System

```
 ┌──────────────┐  JWT (Supabase Auth)   ┌──────────────────────┐
 │ spin-trainer │ ─────────────────────▶ │   spin-trainer-api    │
 │    -web      │  REST /api/v1 (OpenAPI)│Spring Boot 4.1·Java 21│
 │ React 19     │ ◀───────────────────── │ Gradle · Flyway        │
 └──────┬───────┘                        └──────────┬───────────┘
        │ login (Google, ADR-0019)                   │ JDBC (own role)
        ▼                                            ▼
 ┌──────────────┐                        ┌──────────────────────┐
 │ Supabase Auth│  JWKS ──────────────▶  │ Postgres (Supabase)   │
 └──────────────┘  (API verifies the JWT)│ schema `app`, not     │
                                         │ exposed to PostgREST  │
                                         └──────────────────────┘
 ┌──────────────────────────────────────────────────────────────┐
 │ spin-trainer-qa: REST Assured+Cucumber · Testcontainers ·    │
 │ Newman · Playwright(TS) · validation against spec · Allure   │
 └──────────────────────────────────────────────────────────────┘
```

Rules:
- **Single data path:** the frontend only talks to the API. Supabase issues the JWT and nothing else.
- **The API owns the schema** (Flyway) and the default ranges (versioned seed). Tables in the `app` schema, with no privileges for PostgREST's `anon`/`authenticated` roles.
- **Contract first:** `openapi.yaml` lives in the API repo, is published as an artifact and is consumed by web and QA.

## Frontend (this repo)

```
src/
  domain/      pure JS: hand, actions, range, quiz, stats, selection, session, cards, table, random. No React, no I/O. Vitest tests.
  shared/
    api/       data access contract: httpClient (real) | mock (memory+localStorage); queries (TanStack Query)
    auth/      Supabase Auth (loaded on demand) + AuthProvider + RequireAuth
    session/   study session scoreboard (sessionStorage). Does not access the API.
    ui/        presentation components (HandGrid, ActionPalette, Layout, SituationBar, PokerTable, VerdictLegend…)
    theme/     tokens (gradient background, gold, Bebas Neue / DM Sans / JetBrains Mono) and action→color map
  features/    one folder per module: shell, explorer, quiz, builder, stats, auth. Composition only.
```

Allowed dependencies: `features → shared → domain`. `domain` depends on nothing. `shared/ui` does not import `shared/api`.
`features` never imports `httpClient` or `mockApi`; only `shared/api/index.js` and `queries.js`.
These rules are not just documentation: `eslint.config.js` enforces them (`no-restricted-imports`/`no-restricted-globals` per layer), like ArchUnit in the API.

The only implementation of "which action does this hand have" is `domain/range.js#actionFor`. Explorer, Quiz and Builder share it;
the Builder evaluates by comparing the effective action hand by hand (`evaluateRange`), which removes the prototype's `tgtRaise`/`tgtCall` class of bug.

Effective range (ADR-0012): the custom one if it exists, otherwise the PDF one, resolved in a single hook (`useEffectiveRange`),
derived from the `GET /ranges/default` and `GET /ranges/user` lists already shared by the Quiz and "Any" mode (no
request per combination and no 404 while there is no range yet).
The Explorer is the only one that writes ranges: a brush per action + eraser (`paintHand`: sets, does not toggle, so you can paint
by dragging with a mouse or finger), Guardar (`PUT` with the starting version → 409 if someone else changed it), Reset (`DELETE`) and Copiar
(`exportRange`). The Builder is a non-persistent exercise checked against the effective range:
the question is the current selection or a random combination with a range ("Nueva pregunta"), and "Verificar" uses
`evaluateRange`, which classifies each hand (correct, wrong action, extra, missing) and scores only the hands played
in either of the two ranges; with a tight range, getting the folds of all 169 right would inflate the score.

Quiz: each question is decided by `domain/quiz.js#nextQuestion` over the selection's *spots* (combinations with an effective
range; several with "Any", so the combination changes with every question). In hard-hands mode ("solo difíciles") it picks with probability
proportional to the weight from `domain/stats.js#hardHands` (≥ 2 misses; weight = 2·misses − 0.5·correct answers; the hand leaves the pool
when it reaches 0), computed from `GET /stats/hands`. The table (`shared/ui/PokerTable`) is drawn from `domain/table.js`
(seats per format, hero, dealer, prior bets from `Situation.priorActions`) and the cards from `domain/cards.js`
(suits consistent with pair/suited/offsuit). Shortcuts 1..9 and 0 (HU SB Open has ten actions; `shared/ui/shortcuts.js`) and
Enter/→ with `useEffectEvent`; Enter is left to a focused link or button. Local grading gives immediate feedback; the API
grades again when the attempt is recorded. A screen reader hears a short announcement (a visually hidden status region),
not the feedback box with its grid, and the focus returns to the answers after each hand.

Stats separates the **session** (local, resettable: accuracy, best streak, hands) from the **history** (API): totals, hard
hands, accuracy per situation (chips with a meter), top 10 misses by situation/stack/hand and daily progress
(`GET /stats/progress` in the browser's time zone, filled in day by day with `domain/stats.js#dailySeries`).
The progress chart follows the project's visualization method: two charts aligned by day (accuracy as a
line = the story, hands played as gray columns = the context) instead of a dual axis; colors validated with
the palette validator against the actual surface (`theme.colors.chart*`); crosshair and tooltip with mouse and keyboard;
a table view as the accessible equivalent; when the period changes, the previous render stays on screen, dimmed.

`VITE_API_MODE=mock` (`npm run dev:mock`, `npm run build:mock`) makes it possible to develop and run E2E without a backend, with the same contract.
The mock validates like the API (400/404/409) and owns the server-side fields (`id`, `at`, `correct`, `version`); http builds do not include it.
`VITE_API_MODE=demo` (`dev:demo`, `build:demo`, ADR-0022) is the public demo: the mock's adapter with no sign-in or
sign-out, its data in the visitor's browser. `shared/mode.js` is the one place that reads the mode.

Everything cached belongs to one user (`src/UserScope.jsx`): the TanStack Query cache and the session scoreboard are
created again when the user changes, so another account signing in on the same tab sees none of the previous one's data
(the scoreboard's `sessionStorage` key carries the user id). Reading the stored session at start-up is not a change of
user (`shared/auth/userScope.js`): the landing does not start again under a signed-in visitor. "Sign out" navigates to
`/logout`, which goes through the unsaved-changes guard and signs out this browser only (Supabase's local scope).

Routing in *data mode* (`createBrowserRouter`): lazy routes per feature and `useBlocker` for unsaved changes.
`/` is the public landing page (`features/landing`, ADR-0022): a live reference chart and one Quiz question, built from
the reference ranges bundled with the web (`shared/api/showcase.js`), never from the API. `/login`, `/auth/callback` and
`/privacy` are public too; the tabs (`/explorer`, `/quiz`, `/builder`, `/stats`) are behind `RequireAuth`; unknown
paths go to `/`.
Route errors (a page that throws while rendering, or a chunk that cannot be downloaded after a deploy) show
`features/shell/RouteErrorPage` as `errorElement`: inside the shell, so the header still works, with *Reload* and
*Go to start*; the technical detail goes to the console.

Onboarding (ADR-0022): the first visit to the Explorer starts a guided tour (`shared/ui/Tour.jsx`, steps in
`features/explorer/explorerTour.js`), a modal dialog with a focus trap next to a spotlighted element, or a bottom sheet
on phones; skipping or finishing it is remembered per device (`shared/ui/onboarding.js`, `localStorage`), and the
header's "Tour" button replays it. Actions and figures explain themselves with `shared/ui/Tooltip.jsx` (hover and
keyboard focus, Escape, hoverable) and "?" buttons (`InfoTip`) for touch screens. Where boxes go is a pure function of
rectangles (`shared/ui/placement.js`), unit-tested without a browser.

Deployment (ADR-0016, `docs/DEPLOY.md`): the web on Vercel (`vercel.json`: SPA fallback except `/assets/`, immutable
assets, CSP and security headers) and the API on Render's free plan as a native image (ADR-0018, `render.yaml`, the same image QA tests), with Supabase in the same
region. The E2E tests serve the build with the headers of `vercel.json`.

`features/shell/AppShell` is the frame for every tab: it loads the catalog, renders the header with the session scoreboard
and a single situation/stack selector, and passes `{ situations, selection }` to the pages via `useOutletContext()`.
The selection lives in the URL (`?s=<key|any>&stack=<bb|any>`, normalized by `domain/selection.js`): a single piece of state
shared across tabs, and direct links to any situation. With "Any", the Quiz picks a combination for each question, the Builder
one per question, and the Explorer shows random mode.

Study session vs. progress: the session (`shared/session`, rules in `domain/session.js`) is the running scoreboard
of Quiz answers (accuracy, streak, hands); it lives in `sessionStorage` and can be reset.
Long-term progress is the attempts persisted in the API (ADR-0007).

## API (spin-trainer-api repo)

Spring Boot 4.1 on Java 21 (ADR-0014). Modular monolith, hexagonal per module, verified with ArchUnit:

```
com.pedromorago.spintrainer
  situation/   catalog (seed); in memory after the first read
  range/       reference ranges (read-only) and user ranges (optimistic versioning); effective range
  quiz/        attempts graded on the server, immutable events, cursor pagination
  stats/       read side of quiz: GROUP BY hand and by day (each day's bounds computed in java.time
               for the requested IANA zone; Postgres does not interpret zone names)
    └─ each module: domain · application (port.in, port.out, service) · adapter.in.rest · adapter.out.persistence
  shared/      kernel (Hand, Stack, Action, SituationKey, UserId, DomainException) · security (Supabase JWT)
               · web (Problem Details, correlation id, CORS, ETag) · config (Clock)
  api/         generated from openapi.yaml (*Api interfaces and DTOs); not committed
```

Rules checked by ArchUnit (`ArchitectureTest`): domain and kernel free of Spring, Jakarta, Jackson and JDBC; `application`
free of adapters and transport; only `adapter.in.rest` uses the generated code and every `@RestController` implements a
generated interface; only `adapter.out.persistence` uses JDBC; across modules only `application.port.in` and the
published domain are used; `shared` depends on no module; no cycles.

- **Contract:** `openapi-generator` generates the interfaces without default implementations: an unimplemented operation
  does not compile. What the generator cannot express (multiples of 0.5, keys of the `hands` map, rank order in the hand, the
  situation's actions) is validated by the domain. Strict JSON (`JsonConfig`): unknown fields (`additionalProperties: false`),
  coercions (`"25"` as 25, `0.9` as 0, indices as enum) and documents over 64 KB are a 400.
- **Validation order:** request shape (400) → combination exists (404) → business rules
  (400 per hand, 409, 422). The mock checks existence first; the difference only shows with requests that fail
  both checks at once.
- **Consistent reads:** a range (version + hands) is read in a single statement (`range LEFT JOIN hands`), so
  two writes are never mixed and the version check cannot accept a half-read range.
- **A single action rule per hand:** `range/domain/RangeRules#actionFor` is the counterpart of `domain/range.js#actionFor`;
  the server grades the Quiz with it and stores `expected`, `rangeSource` and `rangeVersion` on every attempt.
- **Persistence (ADR-0015):** `JdbcClient` with explicit SQL, no JPA. `app` schema migrated by Flyway with
  sequential numbering (schema and seed in application order). The database rejects impossible data (foreign
  keys to the 169-hand table and to each situation's actions, `CHECK (correct = (given = expected))`).
  Two roles: `spin_migrator` (owner, Flyway) and `spin_app` (the API): reads the catalog and the reference
  ranges, writes the user's ranges and has only `INSERT` + `SELECT` on `quiz_attempt`. The roles are created by
  `db/bootstrap/bootstrap.sql` once per environment.
- **Concurrency:** a range `PUT` is `INSERT … ON CONFLICT DO NOTHING` (version 0) or `UPDATE … WHERE version = ?`;
  0 rows → 409 with the current version. A test with 8 simultaneous writes checks that exactly one wins.
- **Security (ADR-0003):** stateless resource server; ES256 signature against Supabase's JWKS, issuer, mandatory
  `exp`, `aud` and `role = authenticated` (`anon`/`service_role` tokens are rejected) and a UUID `sub`. CORS via
  configuration.
- **Errors:** RFC 9457 in a single `@RestControllerAdvice` (401s included): `urn:spin-trainer:validation`,
  `unauthorized`, `not-found`, `conflict`, `no-range`, `unsupported` (405/406/413/415), `unavailable` (503: Supabase's
  JWKS is not responding; not to be confused with a signed-out session) and `internal`, with `correlationId` and per-field
  `errors` on 400s.
- **Caching:** catalog and reference ranges with `ETag` and `Cache-Control: no-cache, private` (304 with `If-None-Match`).
- **Observability:** `X-Correlation-Id` accepted or generated → MDC → response and Problem; JSON logs (ECS) in `prod`;
  Actuator exposes only `health` (liveness/readiness).
- **Local development:** `gradlew bootTestRun` starts the API with a Testcontainers Postgres set up like
  production and a local JWT issuer (it prints a token); with `SUPABASE_URL` it validates the web app's real tokens.

## Contract v0.2 (ADR-0013; `spin-trainer-api/openapi.yaml`, copy in `docs/openapi.yaml`)

| Method | Path | Description |
|---|---|---|
| GET | /situations | Catalog of the 17 situations: stacks, actions, hero, prior actions, notes |
| GET | /ranges/default | All seeded reference ranges |
| GET | /ranges/default/{situation}/{stack} | Reference range (404 if not seeded) |
| GET | /ranges/user | All of the user's custom ranges |
| GET | /ranges/user/{situation}/{stack} | Custom range (404 if it does not exist) |
| PUT | /ranges/user/{situation}/{stack} | Creates (201) or replaces (200) with mandatory `version` → 409 |
| DELETE | /ranges/user/{situation}/{stack} | Deletes the custom range (204, idempotent) |
| POST | /quiz/attempts | Records `{situation, stack, hand, given}`; the server grades it (422 if there is no range) |
| GET | /quiz/attempts | Attempts, newest first, cursor-paginated |
| GET | /stats/hands | Attempts/correct answers by situation, stack and hand |
| GET | /stats/progress | Attempts/correct answers per day (IANA time zone) |

The mock (`shared/api/mock`) implements this contract and `mock/__tests__/contract.test.js` validates its responses and errors
against the YAML's schemas (Ajv, JSON Schema 2020-12): if mock and spec diverge, a test fails.

## Testing

| Level | Web | API | QA repo |
|---|---|---|---|
| Unit | Vitest on `domain/`, mock and http adapters (coverage ≥90%) | JUnit 6 + AssertJ on domain and use cases, without Spring (JaCoCo: ≥90% domain/use cases/kernel) | — |
| Mutation (ADR-0017) | Stryker on `domain/` (`mutation.yml` workflow) | PIT on domain, use cases and kernel, ≥ 95 % in `check` | — |
| Architecture | ESLint: layer rules in `eslint.config.js` | ArchUnit | — |
| Integration | — | Full app with MockMvc, Testcontainers Postgres 17 with the production roles and real JWTs against a local JWKS | — |
| Contract | Mock validated against the `docs/openapi.yaml` copy (Ajv) | Every integration test response validated against `openapi.yaml` (declared status + schema) | Every REST Assured and Cucumber response validated against a pinned copy of the spec (status, Content-Type, schema and formats) |
| Functional API | — | — | Black-box against the API's Docker image: REST Assured + JUnit (partitions, boundary values, decision table, states), Cucumber in Spanish and Newman |
| E2E | — | — | Playwright (TS): the same specs against the mock and against the real API, under the production headers of `vercel.json`; axe (WCAG 2.2 AA) |
| Reporting | — | — | Combined Allure (API, Newman, E2E) in GitHub Actions; SonarCloud in all three repos (pending) |
