# Deployment

One-time setup of Supabase, the API on Fly.io and the web app on Vercel. Why this way: ADR-0016. The repos already
contain everything that does not depend on an account: `spin-trainer-api/fly.toml`,
`spin-trainer-api/.github/workflows/deploy.yml` and `spin-trainer-web/vercel.json`.

Order: Supabase → API → web → back to the API and Supabase with the web's final domain.

## 0. Prerequisites

- Accounts: Supabase, Fly.io (it asks for a payment method), Vercel, and GitHub with the three repos.
- `flyctl`. Windows (PowerShell): `iwr https://fly.io/install.ps1 -useb | iex`; Linux/macOS: `curl -L https://fly.io/install.sh | sh`.

## 1. Supabase (Auth and Postgres)

1. Create the project in **West EU (Paris)**, `eu-west-3`, next to the API. Keep the database password (the `postgres`
   administrator).
2. **Authentication → Sign In / Providers**: Email enabled (the web app signs in with email and password). It is a
   personal tool: once your account exists, you can turn off new sign-ups.
3. **Project Settings → JWT Keys**: the API only accepts tokens signed with an asymmetric key (ES256) that it verifies
   against the JWKS. The current signing key must be ECC (P-256); if the project still uses the legacy shared secret,
   migrate to signing keys.
4. **SQL Editor**: run `spin-trainer-api/src/main/resources/db/bootstrap/bootstrap.sql`, replacing the two passwords
   as the file explains. It creates `spin_migrator` (Flyway) and `spin_app` (the API) with least privilege (ADR-0015).
5. **Connect → Session pooler**: copy the host. The API uses
   `DB_URL=jdbc:postgresql://<pooler host>:5432/postgres`, and behind the pooler the users are `spin_app.<ref>` and
   `spin_migrator.<ref>` (`<ref>` is the project reference, the subdomain of its URL).
6. Note the project URL (`https://<ref>.supabase.co`) and the publishable (anon) key for the web app. The `app` schema
   must not be exposed to the Data API: by default only `public` is, so leave it as it is.

## 2. API on Fly.io

From `spin-trainer-api` (PowerShell: the same commands, with each `fly secrets set` on a single line):

```
fly auth login
fly apps create spin-trainer-api
fly secrets set --stage SUPABASE_URL=https://<ref>.supabase.co DB_URL=jdbc:postgresql://<pooler host>:5432/postgres
fly secrets set --stage DB_APP_USER=spin_app.<ref> DB_MIGRATOR_USER=spin_migrator.<ref>
fly secrets set --stage DB_APP_PASSWORD=<...> DB_MIGRATOR_PASSWORD=<...>
fly secrets set --stage CORS_ALLOWED_ORIGINS=https://<web domain>
fly deploy
curl https://spin-trainer-api.fly.dev/actuator/health/readiness
```

- If the name `spin-trainer-api` is taken, choose another and change it in `fly.toml` (`app`) and in the web's
  `vercel.json` (`connect-src`). The deploy workflow reads the name from `fly.toml`.
- The first start runs Flyway as `spin_migrator`: schema, catalog and the 73 reference ranges (V1..V5).
- The web domain is not known until step 3: deploy with a provisional value and update `CORS_ALLOWED_ORIGINS`
  afterwards (`fly secrets set` restarts the machine).
- Continuous deployment: `fly tokens create deploy` and save the token as the `FLY_API_TOKEN` secret in the
  spin-trainer-api repo (Settings → Secrets and variables → Actions). From then on, every green CI on `main` deploys
  and runs the smoke test.

## 3. Web on Vercel

1. Import `spin-trainer-web`. `vercel.json` already sets the framework (Vite), `npm run build` and `dist`.
2. Environment variables:

   | Variable | Production | Preview |
   |---|---|---|
   | `VITE_API_MODE` | `http` | `mock` |
   | `VITE_API_BASE_URL` | `https://spin-trainer-api.fly.dev/api/v1` | not needed |
   | `VITE_SUPABASE_URL` | `https://<ref>.supabase.co` | not needed |
   | `VITE_SUPABASE_ANON_KEY` | publishable (anon) key | not needed |

   Preview deployments use the mock: they need neither the API's CORS nor real data.
3. Deploy and note the production domain.

## 4. Close the loop

- API: `fly secrets set CORS_ALLOWED_ORIGINS=https://<web domain>`.
- Supabase: **Authentication → URL Configuration → Site URL** = the web domain.

## 5. Check

- The web app: sign up or sign in, answer in the Quiz and see it in Stats. The browser console shows no CSP errors.
- `curl -I https://<web domain>/` returns the `Content-Security-Policy`, and `/assets/*` returns
  `Cache-Control: public, max-age=31536000, immutable`.
- The spin-trainer-qa suite does not run against production: the API only trusts Supabase's tokens, and the suite forges
  its own with the QA key. That is intended.

## Changing names or domains

| Change | Where |
|---|---|
| API name or domain | `fly.toml` (`app`), `vercel.json` (`connect-src`), `VITE_API_BASE_URL` in Vercel |
| Web domain | `CORS_ALLOWED_ORIGINS` (Fly.io secret), Site URL in Supabase |
| Custom Supabase domain | `vercel.json` (`connect-src`), `SUPABASE_URL`, `VITE_SUPABASE_URL` |
