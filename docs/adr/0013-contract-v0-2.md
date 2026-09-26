# ADR-0013: Contract v0.2: the server grades, aggregates and protects writes

Status: Accepted · Date: 2026-09-26

## Context
Review of contract v0 before generating the API (OpenAPI-first, ADR-0004), with the expanded frontend scope
(ADR-0011, ADR-0012: Quiz table, "Any" mode, hard hands, progress). Problems in v0:
- The client sent `expected` and the mock accepted `correct`: statistics could be forged from the browser.
- `PUT` without `version` on an existing range silently overwrote it (lost update).
- `GET /quiz/attempts` was unpaginated and statistics were computed on the client over all attempts; the API's `stats`
  module had no endpoints.
- The Quiz table and the random mode needed data the contract did not provide (hero position, prior actions,
  which combinations have a range).
- `3BET_C` and `3B_CALL` were the same action ("3-bet / Call") with two codes.
- No 401 responses, no tags (openapi-generator groups the `*Api` interfaces by tag), `Problem` without required fields.

## Decision
1. **The server grades:** `AttemptWrite` only carries `situation, stack, hand, given`. The server computes `expected`,
   against the effective range at that moment (ADR-0012), and `correct`, and stores `rangeSource` and `rangeVersion`.
   422 `no-range` if the combination has no range.
2. **Writes without lost updates:** `RangeWrite.version` is required (`0` = create, `N` = replace
   version N; on mismatch, 409). `PUT` returns 201 on create and 200 on replace; unknown situation/stack → 404.
3. **Statistics aggregated in the API, policy in the client:** `GET /stats/hands` (attempts and correct answers per
   situation, stack and hand) and `GET /stats/progress` (per day, IANA time zone). Hard hands, weights and rankings
   are computed in `domain/stats.js` over those rows. `GET /quiz/attempts` paginates by cursor (newest to oldest).
4. **Richer catalog:** `Situation.hero` and `Situation.priorActions` (position and action of whoever acted before).
   `GET /ranges/default` and `GET /ranges/user` return all ranges at once.
5. **Contract hygiene:** tags per module; 401 on every operation; RFC 9457 `Problem` (replaces RFC 7807)
   with required `type`, `title` and `status`, `correlationId` and per-field `errors`; `Stack` with `multipleOf: 0.5`;
   `Hand` with a pattern that rejects `AAs`/`AK`; `additionalProperties: false` on bodies; `x-enum-varnames` to
   generate valid Java names (`3BET` → `THREE_BET`); `3B_CALL` is merged into `3BET_C`.

## Consequences
More API surface, but also more to test from spin-trainer-qa: server-side grading, 409/422,
cursor pagination and aggregates. The mock implements v0.2 and a test validates its responses against the schemas
in `docs/openapi-draft.yaml`. `priorActions` and the merging of `3B_CALL` are interpretations of the PDF: they will be validated with Pedro
when building the seed.
