# ADR-0016: Deployment: web on Vercel, API on Fly.io

Status: Accepted · Date: 2026-09-26 · API hosting superseded by ADR-0018 (Render, native image)

## Context
Roadmap step 5 deploys the system. The web app is a static build (Vercel, as the project context already said); the
API needed a host, with Fly.io and Render as candidates. Requirements: run the API's existing Dockerfile unchanged (the
image spin-trainer-qa tests is the one deployed), a health check on readiness, secrets outside the repo, a European
region next to Supabase's Postgres, and a low cost for sporadic traffic (a study tool and a portfolio). A static
host also has to answer two questions the local builds hide: the SPA fallback and caching across deploys (a stale
`index.html` asking for chunks that no longer exist) and the browser security headers.

## Decision
- **API on Fly.io** (`fly.toml` in spin-trainer-api): region `cdg` (Paris), with Supabase in `eu-west-3` (Paris) so
  that API and database are in the same area; one `shared-cpu-1x` machine with 512 MB (peak RSS ~275 MiB measured under
  the QA suite with that limit), stopped when idle and started on demand; health check on `/actuator/health/readiness`.
  Secrets with `fly secrets`. Deployed by `.github/workflows/deploy.yml` after a green CI on `main`, with the commit CI
  validated and a smoke test; without `FLY_API_TOKEN` it deploys nothing.
- **Web on Vercel** (`vercel.json`): SPA fallback except for `/assets/` (a missing chunk is a 404, which the route error
  screen handles, not an HTML page served as JavaScript); hashed assets cached as `immutable` and `index.html`
  revalidated on every visit (Vercel's default for HTML); security headers: a Content-Security-Policy without inline
  scripts or styles and with connections only to the API and Supabase, `nosniff`, `Referrer-Policy`,
  `Permissions-Policy` and `frame-ancestors 'none'`. Production builds use `VITE_API_MODE=http`; preview deployments
  use `mock`, so they need neither CORS nor data.
- The E2E tests serve the build with those same rewrites and headers (spin-trainer-qa `scripts/serve-web.mjs`), so the
  whole suite runs under the production CSP.

## Alternatives
- **Render**: also runs Docker images, but its free instance sleeps after inactivity and wakes slowly (container start
  plus JVM startup on a small instance), and the paid plan is a fixed monthly cost. Keeping both configurations would
  mean maintaining two deployments.
- **The API on Vercel or another serverless platform**: it would mean giving up the Dockerfile and the image QA tests.

## Consequences
- What QA tests (the image, the headers) is what is deployed.
- The first request after an idle period waits for the machine and the JVM to start (seconds). Acceptable for a study
  tool; `min_machines_running = 1` removes it at a fixed monthly cost.
- Fly.io needs a payment method on the account; prices and regions are checked when the app is created.
- The CSP names the API's host (`https://spin-trainer-api.fly.dev`): changing the Fly.io app name or using a custom
  domain means changing `fly.toml` and `vercel.json` together (`docs/DEPLOY.md`).
