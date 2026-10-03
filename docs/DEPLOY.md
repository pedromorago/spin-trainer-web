# Deployment

One-time setup of Supabase, the API on Render and the web app on Vercel, all on free plans with no card on file. Why
this way: ADR-0018 (and ADR-0016 for the web). The repos already contain everything that does not depend on an
account: `spin-trainer-api/render.yaml`, `spin-trainer-api/.github/workflows/deploy.yml` and `spin-trainer-web/vercel.json`.

Order: Supabase → API image → Render → web → back to the API and Supabase with the web's final domain.

## 0. Prerequisites

Accounts on Supabase, Render and Vercel (all free, sign in with GitHub), and GitHub with the three repos.

## 1. Supabase (Auth and Postgres)

1. Create the project in **Central EU (Frankfurt)**, `eu-central-1`, next to the API. Keep the database password (the
   `postgres` administrator).
2. **Authentication → Sign In / Providers** (ADR-0019, ADR-0020): *Allow new users to sign up* **on** (it also gates
   Google's new accounts), **Email** provider **off** (Google is the only way in), anonymous sign-ins off. **Google**
   enabled with the client of section 7.
3. **Project Settings → JWT Keys**: the API only accepts tokens signed with an asymmetric key (ES256) that it verifies
   against the JWKS. The current signing key must be ECC (P-256); if the project still uses the legacy shared secret,
   migrate to signing keys.
4. **SQL Editor**: run `spin-trainer-api/src/main/resources/db/bootstrap/bootstrap.sql`, replacing the two passwords
   as the file explains. It creates `spin_migrator` (Flyway) and `spin_app` (the API) with least privilege (ADR-0015).
5. **Connect → Session pooler**: copy the host. The API uses
   `DB_URL=jdbc:postgresql://<pooler host>:5432/postgres?sslmode=require`, and behind the pooler the users are `spin_app.<ref>` and
   `spin_migrator.<ref>` (`<ref>` is the project reference, the subdomain of its URL).
6. Note the project URL (`https://<ref>.supabase.co`) and the publishable (anon) key for the web app. The `app` schema
   must not be exposed to the Data API: by default only `public` is, so leave it as it is.

A free project is paused after a week without activity; if the app stops loading data after a break, resume it from
the Supabase dashboard.

## 2. The API image

In spin-trainer-api, **Actions → deploy → Run workflow**. Without Render set up yet, it only builds the native image
(about four minutes) and pushes it to `ghcr.io/pedromorago/spin-trainer-api`. From then on, every green CI on `main`
does it again.

The package inherits the repo's public visibility, so Render pulls it without credentials. If the repo ever goes
private, add a registry credential in Render (a GitHub token with only `read:packages`) and reference it from
`render.yaml` (`image.creds.fromRegistryCreds`).

## 3. API on Render

1. **New → Blueprint**, pick the spin-trainer-api repo. Render reads `render.yaml` (free web service in Frankfurt, image
   from GHCR, readiness health check) and asks for the secrets:

   | Variable | Value |
   |---|---|
   | `SUPABASE_URL` | `https://<ref>.supabase.co` |
   | `DB_URL` | `jdbc:postgresql://<pooler host>:5432/postgres?sslmode=require` |
   | `DB_APP_USER` / `DB_MIGRATOR_USER` | `spin_app.<ref>` / `spin_migrator.<ref>` |
   | `DB_APP_PASSWORD` / `DB_MIGRATOR_PASSWORD` | the passwords from `bootstrap.sql` |
   | `CORS_ALLOWED_ORIGINS` | the web domain (`https://spintrainer.pedromorago.com`, step 4) |

2. The first start runs Flyway as `spin_migrator`: schema, catalog and the 80 reference ranges (V1..V7). Check
   `https://spin-trainer-api.onrender.com/actuator/health/readiness` → `{"status":"UP"}`.
3. **Service → Settings → Deploy Hook**: copy the URL and save it as the `RENDER_DEPLOY_HOOK_URL` secret in the
   spin-trainer-api repo (**Settings → Secrets and variables → Actions**). From then on, every green CI on `main` builds
   the image, deploys it, waits until `/actuator/info` reports that commit (Render keeps the previous version serving
   while a new one fails, so a green readiness alone would prove nothing) and checks that the JWT issuer answers.

If the name `spin-trainer-api` is taken, Render adds a suffix to the URL: use that URL in `deploy.yml` (`API_URL`), in
`vercel.json` (`connect-src`) and in `VITE_API_BASE_URL`.

## 4. Web on Vercel

1. Import `spin-trainer-web`. `vercel.json` already sets the framework (Vite), `npm run build` and `dist`.
2. Environment variables:

   | Variable | Production | Preview |
   |---|---|---|
   | `VITE_API_MODE` | `http` (or `demo`, below) | `mock` |
   | `VITE_API_BASE_URL` | `https://spin-trainer-api.onrender.com/api/v1` | not needed |
   | `VITE_SUPABASE_URL` | `https://<ref>.supabase.co` | not needed |
   | `VITE_SUPABASE_ANON_KEY` | publishable (anon) key | not needed |

   Preview deployments use the mock: they need neither the API's CORS nor real data.

   **Switching sign-in off for a while (demo mode, ADR-0022).** Edit `VITE_API_MODE` (Production) to `demo`, save, and
   redeploy the latest production deployment (**Deployments → ⋯ → Redeploy**): Vite reads the variable at build time,
   so a new build is needed. The site then needs no account and keeps each visitor's progress in their browser; the
   API and Supabase are left as they are. Set it back to `http` and redeploy to restore sign-in. The other variables can
   stay.
3. Deploy. Vercel serves it at `https://spin-trainer-web.vercel.app` (the project name).
4. Custom domain: **Settings → Domains → Add Existing** → `spintrainer.pedromorago.com` (Production). In Cloudflare, the
   DNS record Vercel shows (a `CNAME` for `spintrainer`) with the proxy **off** (DNS only): proxied, Vercel cannot issue
   its certificate. Then edit `spin-trainer-web.vercel.app` → **Redirect to Another Domain**, 308, to the custom domain:
   one origin, so one login session (Supabase keeps it per origin) and one entry in the API's CORS.

## 5. Close the loop

- Render: set `CORS_ALLOWED_ORIGINS` to the web domain (**Environment**; Render restarts the service).
- Supabase: **Authentication → URL Configuration → Site URL** = the web domain; **Redirect URLs**:
  `https://<web domain>/**` (Google's return, `/auth/callback`) and, for development, `http://localhost:5173/**`.

## 6. Check

- The web app: sign in (with Google too, section 7), answer in the Quiz and see it in Stats. The browser console shows no CSP errors.
- After 15 minutes without use the API sleeps: the next load shows "Waking up the server" and takes about a minute.
- `curl -I https://<web domain>/` returns the `Content-Security-Policy`, and `/assets/*` returns
  `Cache-Control: public, max-age=31536000, immutable`.
- The spin-trainer-qa suite does not run against production: the API only trusts Supabase's tokens, and the suite forges
  its own with the QA key. That is intended.

## 7. Sign in with Google (ADR-0019)

1. [Google Cloud console](https://console.cloud.google.com): a project (e.g. `spin-trainer`).
2. **Google Auth Platform → Branding**: app name *Spin Trainer*, support email, logo optional; authorized domain
   `pedromorago.com`; home page and privacy policy `https://<web domain>/` and `https://<web domain>/privacy`.
3. **Audience**: *External*, then **Publish app** (in *Testing* only listed test users can sign in). With only the
   `openid`, `email` and `profile` scopes Google does not require verification.
4. **Clients → Create client → Web application**: authorized JavaScript origin `https://<web domain>`; authorized
   redirect URI `https://<ref>.supabase.co/auth/v1/callback` (Supabase shows it in its Google provider panel).
5. Supabase, **Sign In / Providers → Google**: enable, paste the client ID and secret, save.
6. Check by hand after each change to the login (the E2E suite cannot drive Google): sign in with a Google account
   that has never used the app, answer in the Quiz, sign out and in again.

## Changing names or domains

| Change | Where |
|---|---|
| API name or domain | `deploy.yml` (`API_URL`), `vercel.json` (`connect-src`), `VITE_API_BASE_URL` in Vercel |
| Web domain | `CORS_ALLOWED_ORIGINS` (Render), Site URL in Supabase |
| Custom Supabase domain | `vercel.json` (`connect-src`), `SUPABASE_URL`, `VITE_SUPABASE_URL` |
