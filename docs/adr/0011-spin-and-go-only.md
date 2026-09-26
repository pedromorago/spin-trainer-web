# ADR-0011: Spin & Go only; UI and flows taken from the MTT prototype

Status: Accepted · Date: 2026-09-26

## Context
There was a vanilla prototype (a single file, localStorage) aimed at 6-max MTT. Its study flows are good:
editable Explorer, Quiz on a table, Builder with verification and session Stats. However, its ranges and positions do not apply
to Spin & Go, and its code mixed view and logic, which is where the `tgtRaise`/`tgtCall` bug originated (ADR-0009).

## Decision
The product trains Spin & Go only: 3-max and heads-up, with the 16 situations in the catalog.
From the prototype we take the UI and the flows, not its code or its ranges.
`situation.format` is limited to `3max` and `hu`: there is no 6-max and no MTT.

## Consequences
The prototype's features are reimplemented on the current architecture (pure domain + `shared/api`, ADR-0009),
adapted to the catalog: a 3- or 2-seat table, per-situation actions and PDF ranges served by the API (ADR-0006).
Adding another format would require a new ADR and extending the contract's `format` enum.
