# ADR-0009: Pure JavaScript domain layer in the frontend

Status: Accepted · Date: 2026-09-26

## Context
The prototype's mixed-range bug (`tgtRaise` vs `tgtCall`) came from having the validation inside the view. TypeScript is not used in product code.

## Decision
`src/domain/` holds hands, actions, ranges, the Quiz engine and stats as pure functions with no React or I/O, with Vitest unit tests. Features only compose. Data access goes through `shared/api` with two adapters (http and mock) for the same contract.

## Consequences
Every frontend business rule is testable in milliseconds. The mock enables E2E without a backend. The feature-based structure avoids folders by technical type.
