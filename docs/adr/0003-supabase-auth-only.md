# ADR-0003: Supabase as identity provider only; the API is the only data path

Status: Accepted · Date: 2026-09-26

## Context
The initial scaffold wrote to Supabase tables directly from the frontend (RLS) while an API was also being planned. Two write paths mean two security models and duplicated validation.

## Decision
The frontend uses Supabase only for login/signup and to obtain the JWT. All data access goes through the API, which validates the JWT against Supabase's JWKS and connects to Postgres with its own role. Tables live in the `app` schema, with no privileges for PostgREST's `anon`/`authenticated` roles.

## Consequences
RLS is not the primary mechanism (it remains optional defense in depth). All authorization and validation logic is testable in the API with REST Assured.
