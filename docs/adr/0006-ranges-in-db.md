# ADR-0006: Default ranges as versioned data in the database

Status: Accepted · Date: 2026-09-26 · The reference ranges are examples since ADR-0024

## Context
With the ranges hardcoded in the frontend, the API cannot grade the Quiz or evaluate the Builder without duplicating them.

## Decision
The PDF ranges are loaded through Flyway data migrations (seed) with a version field. The API serves them at `GET /ranges/default/{situation}/{stack}`.

## Consequences
Updating the PDF is a migration, not a frontend deploy. Quiz attempts store the expected action at the time they are made, so stats survive range changes.
