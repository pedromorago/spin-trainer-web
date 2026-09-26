# spin-trainer-web

Frontend de Spin Trainer. Reglas comunes a los tres repos, resumidas aquí para que este repo sea autosuficiente.

## Reglas globales (resumen)
- Calidad de portfolio > velocidad. Fuente de verdad: `docs/SPIN_TRAINER_PROJECT_CONTEXT.md`, `docs/ARCHITECTURE.md`, `docs/adr/*`, `docs/openapi-draft.yaml`.
- ADRs cerrados (0001..0011); solo se reabren con fallo concreto y justificado.
- Solo Spin & Go (3-max y HU, 16 situaciones). Del prototipo MTT 6-max se toman UI y flujos, no código ni rangos (ADR-0011).
- Supabase solo emite el JWT; todos los datos van por la API. Rangos default en BD (Flyway). Intentos de Quiz = eventos inmutables.
- Sin TypeScript en este repo. Descartados: OWASP ZAP, carga, Pact, pgTAP.
- Commits **siempre a nombre de Pedro** (autor y committer: `Pedro Morago López-Vázquez <pedromoragolv@gmail.com>`; verificar `git config user.name/user.email` antes de commitear). Conventional Commits, sin trailer de coautoría ni de atribución.
- Conciso, proponer antes de generar mucho código, iterar por bloques con confirmación.

## Stack y comandos
React 19 · React Router 7 · Vite · TanStack Query · Supabase Auth · CSS-in-JS inline (tokens en `shared/theme`) · Vitest.

```
npm install
npm run dev:mock      # sin backend (vite --mode mock)
npm run dev           # VITE_API_MODE de .env.local
npm test              # Vitest
npm run test:coverage # umbral 90% en domain/ y mock
npm run lint          # ESLint, incluye reglas de capas
npm run build         # también build:mock
```
Antes de commitear: `npm run lint && npm test && npm run build` en verde.

## Capas (dependencias permitidas: features → shared → domain)
- `src/domain/`: JS puro. **No importa React ni hace I/O** (ni fetch, ni localStorage, ni Supabase). Solo importa de `domain/`.
  **Todo cambio en `domain/` lleva test Vitest** en `src/domain/__tests__/`.
- `src/shared/api/`: acceso a datos. `index.js` elige adaptador (`httpClient` | `mock/mockApi`) según `VITE_API_MODE`; `queries.js` expone hooks TanStack Query.
  Ambos adaptadores implementan el mismo contrato (el de la spec).
- `src/shared/ui/`: presentación. No importa `shared/api` (recibe datos por props/argumentos).
- `src/features/`: solo composición. Para datos **solo** usa `shared/api/index.js` y `shared/api/queries.js`; nunca `httpClient` ni `mockApi`.
- La acción efectiva de una mano se calcula solo con `domain/range.js#actionFor`.
- Colores de acción solo en `shared/theme/actionColors.js`; el dominio no conoce colores. Dentro de una situación no se repiten (test).
- Las reglas de capas las verifica `eslint.config.js`; si cambian, se cambian ahí y en `docs/ARCHITECTURE.md`.
- El mock (`shared/api/mock`) valida como la API y es dueño de los campos de servidor; mantenerlo alineado con la spec y con sus tests.

## Convenciones
- Router en *data mode* (`createBrowserRouter`, rutas lazy en `src/App.jsx`). Selección de situación/stack en la URL (`?s=&stack=`).
- Estado que depende de (situación, stack): reiniciar con `key` en un componente hijo, no con `setState` dentro de efectos.
- Accesibilidad: controles con rol y nombre accesible (Playwright `getByRole`/`getByLabel` primero).
  Celdas del grid: `"<mano>: <acción>"`. Confirmaciones en línea con `ConfirmBar`, no `window.confirm`.
- Selectores de test: `data-testid` en kebab-case `<feature>-<elemento>`; atributos `data-hand`, `data-action` (acción efectiva),
  `data-implicit`, `data-verdict`, `data-stack`.
- El contrato definitivo vive en `spin-trainer-api/openapi.yaml`; `docs/openapi-draft.yaml` es solo borrador.
