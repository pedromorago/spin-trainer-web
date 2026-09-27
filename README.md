# spin-trainer-web

Spin Trainer frontend: a preflop range trainer for Spin & Go (3-max and heads-up). A study tool and QA portfolio project.
Live at [spintrainer.pedromorago.com](https://spintrainer.pedromorago.com): anyone can sign in with Google (ADR-0019).
API in [spin-trainer-api](https://github.com/pedromorago/spin-trainer-api); the test strategy, what the tests found and the
black-box suites are in [spin-trainer-qa](https://github.com/pedromorago/spin-trainer-qa). Context, architecture and
ADRs: [`docs/`](docs/).

React 19 · React Router 7 · Vite · TanStack Query · inline CSS-in-JS · Supabase Auth · Vercel. No TypeScript in product code.

Requirements: Node `^22.13` or `>=24`.

## Running without a backend

```bash
npm install
npm run dev:mock                # http://localhost:5173 (mock mode, works on Windows)
```

Mock mode needs no login and no API: data lives in memory/localStorage with the same contract as the real API.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` / `dev:mock` | Development server (real API / mock) |
| `npm run build` / `build:mock` | Production build (real API / mock, for E2E) |
| `npm test` | Vitest: domain, mock adapter, color invariant |
| `npm run test:coverage` | v8 coverage + lcov (90% threshold) |
| `npm run test:mutation` | Stryker on `src/domain` (ADR-0017); HTML report in `reports/mutation` |
| `npm run lint` | ESLint, including the layer rules |
| `npm run spec:check` / `spec:sync` | Checks / pulls the contract copy from `../spin-trainer-api/openapi.yaml` |
| `npm run ranges:check` / `ranges:sync` | Checks / pulls the copy of the reference ranges (`../spin-trainer-api/reference-ranges.json`) used by the mock |

CI (`.github/workflows/ci.yml`): `spec:check` and `ranges:check`, lint, tests with coverage and both builds on every push to `main` and on every
PR. The copy checks compare against the API only if the `SPIN_TRAINER_REPOS_TOKEN` secret exists (private repos); without it they are
skipped. The web E2E tests live in spin-trainer-qa (Playwright, against the mock and against the real API).

## Deployment

Vercel (ADR-0016). `vercel.json` sets the build, the SPA fallback (except `/assets/`), immutable caching for hashed
assets and the security headers, Content-Security-Policy included; the E2E tests in spin-trainer-qa run under those same
headers. Production builds use the real API and preview deployments the mock. Setup steps: `docs/DEPLOY.md`.

## With the real API

`cp .env.example .env.local` and set `VITE_API_MODE=http`, `VITE_API_BASE_URL` (spin-trainer-api) and the Supabase Auth credentials; then `npm run dev`.

## Structure

```
src/domain/    business rules in pure JS, with tests
src/shared/    api (http | mock), auth, ui, theme
src/features/  explorer · quiz · builder · stats · auth
docs/          context, architecture, ADRs, deployment, copy of the v0.2 contract (OpenAPI), prompt
scripts/       contract sync with spin-trainer-api
.github/       CI
```

See `docs/ARCHITECTURE.md`.
