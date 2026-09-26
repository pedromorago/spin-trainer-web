# spin-trainer-web

Frontend de Spin Trainer: entrenador de rangos preflop para Spin & Go (3-max y heads-up). Proyecto de estudio y portfolio QA.

React 19 · React Router 7 · Vite · TanStack Query · CSS-in-JS inline · Supabase Auth · Vercel. Sin TypeScript en producto.

Requisitos: Node `^22.13` o `>=24`.

## Arrancar sin backend

```bash
npm install
npm run dev:mock                # http://localhost:5173 (modo mock, funciona en Windows)
```

En modo mock no hace falta login ni API: los datos viven en memoria/localStorage con el mismo contrato que la API real.

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` / `dev:mock` | Servidor de desarrollo (API real / mock) |
| `npm run build` / `build:mock` | Build de producción (API real / mock, para E2E) |
| `npm test` | Vitest: dominio, adaptador mock, invariante de colores |
| `npm run test:coverage` | Cobertura v8 + lcov (umbral 90%) |
| `npm run lint` | ESLint, incluidas las reglas de capas |
| `npm run spec:check` / `spec:sync` | Comprueba / trae la copia del contrato desde `../spin-trainer-api/openapi.yaml` |

## Con la API real

`cp .env.example .env.local` y ajusta `VITE_API_MODE=http`, `VITE_API_BASE_URL` (spin-trainer-api) y las credenciales de Supabase Auth; después `npm run dev`.

## Estructura

```
src/domain/    reglas de negocio en JS puro, con tests
src/shared/    api (http | mock), auth, ui, theme
src/features/  explorer · quiz · builder · stats · auth
docs/          contexto, arquitectura, ADRs, copia del contrato v0.2 (OpenAPI), prompt
scripts/       sincronización del contrato con spin-trainer-api
```

Ver `docs/ARCHITECTURE.md`.
