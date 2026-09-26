# ADR-0015: Persistence with JdbcClient and least privilege in the database

Status: Accepted · Date: 2026-09-26

## Context
The API stores immutable events (Quiz attempts, ADR-0007), computes aggregates (per hand and per day in a time
zone), replaces ranges with optimistic concurrency (ADR-0013) and reads a catalog. The domain cannot depend on
JPA (ADR-0005), so an ORM would mean maintaining entities alongside the domain while adding nothing for this use case.
Moreover, attempt immutability was only guaranteed by code convention.

## Decision
- **Spring JDBC (`JdbcClient`) with explicit SQL** in the outbound adapters. No JPA/Hibernate or Spring Data.
- **Optimistic concurrency in a single statement:** `UPDATE … WHERE version = :v`; 0 rows → 409.
- **Integrity in the schema:** foreign keys to (situation, stack) and (situation, action) and a `CHECK` on the hand pattern.
  The database rejects what the domain already rejects (defense in depth).
- **Two roles:** `spin_migrator`, owner of the `app` schema, used only by Flyway; `spin_app`, the runtime role, with
  minimal privileges: `SELECT` on the catalog and reference ranges, read and write on user ranges,
  `INSERT` + `SELECT` on `quiz_attempt` (no `UPDATE` or `DELETE`). The roles and their passwords are created outside
  Flyway (per-environment script); migrations only grant privileges.
- An integration test verifies the privilege matrix against real Postgres (Testcontainers).

## Consequences
More hand-written SQL, tested against the same engine as production. Attempt immutability is enforced by the
database, not just by the code; a `GRANT` forgotten on a new table is caught by a test.
