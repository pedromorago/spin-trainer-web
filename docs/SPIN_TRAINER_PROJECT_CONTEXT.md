# Spin Trainer — Project context (v2, September 2026)

## What it is
Web app for training preflop ranges for Spin & Go (3-max and heads-up). Two goals of equal weight:
1. A real tool for my poker study.
2. A professional-grade QA portfolio. **Portfolio quality takes precedence over speed.**

## Owner
Pedro, QA Automation Engineer (~5 years). ISTQB CTFL v4.0, BSc in Mathematics.
Professional stack: Java + REST Assured + JUnit 5 (backend), Playwright + TypeScript (E2E), Gradle, CI/CD.

## Domain
- 16 situations from the reference PDF (Tablasmentov3.pdf): 12 for 3-max and 4 for HU. Catalog in `src/shared/api/mock/situations.js` (served by the API in production).
- Concrete stacks in BB (including 12.5). Compound actions: MR_4B_C, MR_C_C, MR_C_F, MR_F_F, L_C_C, L_C_F, L_PUSH, L_F, ALLIN, 3BET, 3BET_C, CALL, CALL_VS_X2, ISO_C, ISO_F, LIMP, CHECK, FOLD.
- One action per hand and (situation, stack). Unlisted hand = implicit action: FOLD, or CHECK if FOLD is not among the actions.
- 13×13 grid: pairs on the diagonal, suited in the upper triangle, offsuit in the lower one. 169 hands, 1326 combos.
- Modules: Explorer, Quiz, Builder, Stats. Descoped: equity calculator.

## Architecture (see docs/ARCHITECTURE.md and docs/adr/)
- **spin-trainer-web** (this repo): React 19, React Router 7, Vite, TanStack Query, inline CSS-in-JS, no TypeScript. Pure `domain/` + `shared/` + `features/`. `mock` adapter to develop and run E2E without a backend. Vercel (ADR-0016).
- **spin-trainer-api**: Spring Boot 4.1 (ADR-0014), Java 21, Gradle. Hexagonal modular monolith (situation, range, quiz, stats) verified with ArchUnit. OpenAPI-first with openapi-generator (owner of `openapi.yaml`). Explicit JDBC with `JdbcClient` and least-privilege DB roles (ADR-0015). Flyway (schema + range seed). Supabase JWT validated as a resource server. RFC 9457 (Problem Details). Fly.io (ADR-0016).
- **spin-trainer-qa**: REST Assured + JUnit 5 + Cucumber, Testcontainers, Newman, Playwright + TS, validation against the spec, Allure, SonarCloud, GitHub Actions.
- Supabase = Auth (JWT) + Postgres. **Single data path: the API.** Tables in the `app` schema, not exposed to PostgREST.

## Closed decisions
Gradle, not Maven · no TS in product code · Supabase for Auth only · default ranges in the DB (seed) · Quiz attempts as events · validation against the spec instead of Pact · Spin & Go only; from the MTT prototype only UI and flows (ADR-0011) · effective range = custom if it exists; only the Explorer writes it (ADR-0012) · Spring Boot 4.1 (ADR-0014) · JdbcClient without JPA, attempts made immutable by DB privileges (ADR-0015) · web on Vercel and API on Fly.io, with the production headers (CSP) tested in E2E (ADR-0016) · mutation testing of the domain: PIT in the API's `check`, Stryker in the web's CI (ADR-0017).
**Rejected:** OWASP ZAP, load testing tools, Pact, pgTAP, TypeScript in product code.

## QA patterns to replicate (from my professional framework)
ServiceBase · TestBase + TestWatcherBase · body builder DTOs · ErrorType enum with templates · JSON Schema validation (now: against the spec) · Qase via annotations · token chain · Page Objects with region comments · data factories with Faker.
Improvements to document: split god-objects · Lombok @Builder · ThreadLocalRandom · Awaitility · @ConfigurationProperties · ThreadLocal for parallel runs · registry pattern for login.

## Lessons
- Prototype bug: mixed ranges misclassified because `tgtRaise`/`tgtCall` were confused. Fixed back then with a `hasColors` flag; in v2 it goes away because `evaluateRange` compares the effective action hand by hand.
- Action consistency across views is guaranteed by having a single function (`domain/range.js#actionFor`).

## Status
- Vanilla prototype (single file, localStorage): working, for personal use.
- Web v2: common shell (single selector with "Any", session scoreboard) and the prototype's four features adapted to Spin & Go: editable Explorer (brush, Guardar/Reset/Copiar, panel), Quiz on a table (shortcuts, hard hands), Builder with verdicts by type and Stats with daily progress; a route error screen instead of React Router's default. 247 Vitest tests (domain, mock + spec conformance, http adapter, color, contrast and verdict invariants), coverage ≥90%, 100 % mutation score in the domain (Stryker, ADR-0017), ESLint with layer rules. Not deployed.
- API: the 11 operations of contract v0.2 (ADR-0013) implemented (situation, range, quiz, stats) with JWT security, Problem Details, least-privilege DB roles and ArchUnit. 142 unit tests (100 % mutation score in domain, use cases and kernel: PIT, ADR-0017) and 97 integration tests (Testcontainers, real JWTs, responses validated against the spec, formats included); ~97% line coverage. Tested end to end with the web app in http mode. Not deployed. The seed contains the 16 situations and the PDF's 73 tables (V5, source in `reference-ranges.json`, extracted by cell color and overlaid on the original); pending validation with Pedro situation by situation. The PDF corrected the catalog: `sb_open` uses L/F (not L/C/C) and `hu_sb_open` has an open-shove.
- The contract lives in `spin-trainer-api/openapi.yaml`; the web keeps a copy (`docs/openapi.yaml`, `npm run spec:check`) that the mock implements.
- QA suite (spin-trainer-qa): black-box against the system in Docker (API built from its repo, Postgres with the production roles and WireMock as the JWT issuer). 133 API tests in JUnit (security headers included) and 23 Cucumber scenarios in Spanish, validated against the spec; Newman collection; 27 Playwright E2E tests against the mock (26 also against the real API), with axe and fault injection (a page chunk that cannot be downloaded). Combined Allure report and GitHub Actions workflow (needs the `SPIN_TRAINER_REPOS_TOKEN` secret while the repos are private). The E2E tests found a 406 on the range DELETE from the web (fixed in both API and web) and the lack of a route error screen (fixed in the web).

## Roadmap
0. Windows 10/11 environment from scratch (Node LTS, Java 21, Git, Docker Desktop, IDE, gh CLI).
1. ~~Validated contract v0.2 (ADR-0013) → create spin-trainer-api (Gradle, openapi-generator, Flyway, ArchUnit, Testcontainers).~~ Done.
2. ~~Range seed from the PDF (Flyway)~~ Done (V5); still to be validated with me situation by situation. To be decided: the PDF's "3H OS call" table (call vs open-shove thresholds in 3-max) is not in the catalog.
3. Connect the web app to the real API (`VITE_API_MODE=http`), Supabase Auth in production.
4. ~~spin-trainer-qa: API tests + contract + E2E (against the mock and the real API) + Allure + CI.~~ Done (CI secret still missing).
5. Deploy (Vercel + Fly.io, ADR-0016) and a portfolio README with links to ADRs and reports. Prepared without accounts: `vercel.json`, `fly.toml`, the deploy workflow and `docs/DEPLOY.md`; the accounts, secrets and domains are pending.

## How to work with me
Concise, technical, no marketing. Iterative: you propose, I validate, you continue. I number my requests. I review and correct.
