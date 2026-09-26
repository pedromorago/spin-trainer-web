# ADR-0017: Mutation testing of the domain

Status: Accepted · Date: 2026-09-26

## Context
The domain holds the rules whose silent change costs the most: the effective action of a hand, grading, verdicts,
study windows and rankings. Coverage (90 % in the domain, in both repos) only says that a line ran, not that a test
would fail if the line were wrong. Mutation testing measures that: it introduces small changes (a `<` for a `<=`, a
`+` for a `-`, a removed condition) and checks that some test fails. PIT is the reference on the JVM and Stryker in
JavaScript; neither is among the discarded tools (ADR-0010).

## Decision
- **API: PIT** (`gradle-pitest-plugin`) on `*.domain`, `*.application` and `shared.kernel` (the scope of the 90 %
  coverage bar), with the unit tests only (no Spring or Docker). It is part of `./gradlew check` with a 95 % mutation
  threshold, which leaves room for equivalent mutants; the HTML report is in `build/reports/pitest`.
- **Web: Stryker** on `src/domain`, with the *command* runner (`vitest run src/domain` per mutant). Stryker's Vitest
  runner (10.0, released before Vitest 5) does not activate runtime mutants with Vitest 5 and reported them as
  survivors: 25 % for code that really scored 90 %. It runs in its own workflow (`mutation.yml`: when the domain
  changes on `main`, weekly and by hand) because it takes about 13 minutes; `npm run test:mutation` locally, with the
  threshold in `stryker.config.mjs`.
- A surviving mutant is resolved in this order: a missing test (usually a boundary value), code that is dead and can
  be simplified, or an equivalent mutant marked with `// Stryker disable next-line <mutator>: <reason>`. Lowering the
  threshold is not one of the options.

## Consequences
- The first run found what coverage did not show. In the API: the valid boundaries of `limit` (1 and 200), `days`
  (365) and the counts (one attempt, none or all correct), a hand order asserted only across groups, and a test
  named "exactly full last page" that never filled a page; PIT went from 88 % to 100 %. In the web: the hand regex
  without anchors being untested (`AKsx`), the hard-hands ranking and the daily series order, the URL values (`any`,
  `btn_open`) and the validation of the stored session; two defensive branches that could never change the result
  were removed. Stryker went from 90.6 % to 100 %, with the equivalent mutants marked and explained in the code; its
  threshold is also 95 %.
- `check` in the API takes about 30 more seconds. The web job is separate so as not to slow down each push.
- When Stryker's Vitest runner supports Vitest 5, switching back to it brings per-test coverage and a much faster run;
  the command runner stays valid meanwhile.
