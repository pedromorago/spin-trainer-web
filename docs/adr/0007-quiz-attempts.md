# ADR-0007: Quiz attempts as immutable events

Status: Accepted · Date: 2026-09-26

## Context
The initial schema stored aggregated counters (correct/total) per situation and stack, losing per-hand and per-date detail.

## Decision
Each answer is persisted as a `QuizAttempt` (situation, stack, hand, expected, given, correct, timestamp). Statistics are queries over that table.

## Consequences
A table that grows with usage (acceptable; pagination in v1). Enables most-missed hands, progress over time and filters without migrating data.
