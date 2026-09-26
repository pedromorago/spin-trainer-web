# ADR-0005: Hexagonal modular monolith verified with ArchUnit

Status: Accepted · Date: 2026-09-26

## Context
The central architectural concern is keeping range logic consistent across views and use cases. Without explicit rules, logic ends up in controllers and repositories.

## Decision
Package by business module (situation, range, quiz, stats) with domain / application / adapter layers. The domain does not depend on Spring or JPA. ArchUnit enforces the dependencies between layers and between modules.

## Consequences
More classes and mappings. In return, a domain that is testable in isolation and an architecture that is verified in CI, not just documented.
