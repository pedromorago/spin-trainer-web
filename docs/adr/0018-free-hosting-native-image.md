# ADR-0018: Free hosting: the API as a native image on Render

Status: Accepted · Date: 2026-09-26 · Supersedes the API part of ADR-0016 (the web stays on Vercel)

## Context
ADR-0016 put the API on Fly.io. Fly.io has no free plan for new accounts, and the project has a hard requirement: it
must cost nothing. The free options that run a Docker image were compared in September 2026:

| Option | Card | Instance | Idle behaviour |
|---|---|---|---|
| Render (free) | not required | 512 MB, 0.1 CPU, 750 h/month | sleeps after 15 min; waking takes about a minute |
| Koyeb (free) | required (anti-fraud) | 512 MB, 0.1 vCPU, one per account | sleeps after 1 h; wakes in 1–5 s |
| Cloud Run, Northflank, Oracle Always Free | required | larger | no hard spending cap (Cloud Run), or a VM to maintain (Oracle) |

Every free instance has a tenth of a CPU. Measured with the QA environment under the same limits (0.1 CPU,
512 MB), the JVM image took 114 s to start Spring Boot (129 s until ready): on top of the host's wake-up, the first
request after each idle period would wait two to three minutes.

## Decision
- **Render's free web service** (`render.yaml`, Frankfurt, next to Supabase in `eu-central-1`): the only option that is
  free without a card on file.
- **The API is a GraalVM native image** (`org.graalvm.buildtools.native`, Spring AOT, GraalVM 25, `-march=compatibility`
  so it runs on any x86-64 host). With the same limits it is ready in 3.8 s, Flyway migrations of an empty database
  included, and uses 64 MiB instead of about 275 MiB. The `Dockerfile` builds it, so the image spin-trainer-qa tests is
  still the one deployed; the JVM keeps running the unit and integration tests (`./gradlew check`), which are faster to
  iterate on.
- **GitHub Actions builds and pushes the image** to GHCR (`deploy.yml`): the native build needs several GB of memory,
  which Render's free builds do not guarantee. Render deploys that exact image through its deploy hook.
- **The web app survives the wake-up**: queries retry only transient failures (no connection, 502/503/504, or a
  non-JSON 200 from the host) for about 75 s, and after 4 s of loading the shell says the server is waking up. Writes
  are never retried.

## Consequences
- Hosting costs nothing: Render (API), Vercel Hobby (web) and Supabase Free (Auth and Postgres).
- After 15 minutes without use, the first load of a study session waits for Render to wake the instance (about a
  minute); the app shows why. Supabase pauses a free project after a week without activity: it is resumed from its
  dashboard.
- The native build takes about four minutes and a few GB of memory in CI and in the QA environment. Reflection that
  Spring AOT cannot see must be declared with runtime hints; the QA suite running against the native image is what
  proves nothing was left out.
- Koyeb is the alternative if a card on file is acceptable: the same image runs there and wakes in seconds.
