# spin-trainer-web

Frontend de Spin Trainer: entrenador de rangos preflop para Spin & Go (3-max y heads-up). Proyecto de estudio y portfolio QA.

React 19 · React Router 7 · Vite · TanStack Query · CSS-in-JS inline · Supabase Auth · Vercel. Sin TypeScript en producto.

## Arrancar sin backend

```bash
npm install
cp .env.example .env.local      # VITE_API_MODE=mock ya viene puesto
npm run dev                     # http://localhost:5173
npm test                        # tests de dominio (Vitest)
```

Con `VITE_API_MODE=mock` no hace falta login ni API: los datos viven en memoria/localStorage con el mismo contrato que la API real.

## Con la API real

`VITE_API_MODE=http`, `VITE_API_BASE_URL` apuntando a spin-trainer-api y las credenciales de Supabase Auth.

## Estructura

```
src/domain/    reglas de negocio en JS puro, con tests
src/shared/    api (http | mock), auth, ui, theme
src/features/  explorer · quiz · builder · stats · auth
docs/          contexto, arquitectura, ADRs, contrato v0, prompt
```

Ver `docs/ARCHITECTURE.md`.
