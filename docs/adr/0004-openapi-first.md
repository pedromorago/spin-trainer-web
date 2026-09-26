# ADR-0004: OpenAPI-first with interface generation

Status: Accepted · Date: 2026-09-26

## Context
Shift Left is on the CV. A spec and code maintained by hand drift apart.

## Decision
`openapi.yaml` is the source of truth. The Gradle openapi-generator plugin generates the `*Api` interfaces and the DTOs; the controllers implement them. The QA tests validate actual responses against the same spec.

## Consequences
Changing the API requires changing the spec first. Contract tests need no hand-maintained schemas.
