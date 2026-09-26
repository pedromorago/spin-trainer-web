# ADR-0008: Validation against the spec instead of Pact

Status: Accepted · Date: 2026-09-26

## Context
Pact was discarded: a single consumer and a single provider do not justify a broker.

## Decision
The API tests validate every response against `openapi.yaml` with a spec validator; the frontend is also tested E2E against a mock adapter that implements the same contract.

## Consequences
Less infrastructure. Drift detection depends on keeping the spec as the source of truth (ADR-0004).
