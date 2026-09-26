# spin-trainer-web

Frontend de Spin Trainer. Reglas comunes a los tres repos, resumidas aquí para que este repo sea autosuficiente.

## Reglas globales (resumen)
- Calidad de portfolio > velocidad. Fuente de verdad: `docs/SPIN_TRAINER_PROJECT_CONTEXT.md`, `docs/ARCHITECTURE.md`, `docs/adr/*`, `docs/openapi.yaml` (copia del contrato de la API).
- ADRs cerrados (0001..0015); solo se reabren con fallo concreto y justificado.
- Solo Spin & Go (3-max y HU, 16 situaciones). Del prototipo MTT 6-max se toman UI y flujos, no código ni rangos (ADR-0011).
- Rango efectivo = personalizado si existe, si no el del PDF (`useEffectiveRange`). Solo el Explorer escribe rangos; el Builder no persiste (ADR-0012).
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
npm run spec:check    # docs/openapi.yaml == ../spin-trainer-api/openapi.yaml
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
- El mock (`shared/api/mock`) valida como la API y es dueño de los campos de servidor. Contrato v0.2 (ADR-0013): el servidor corrige los intentos,
  `PUT` exige `version`, stats agregadas por API y política en `domain/stats.js`. Cambiar el contrato = cambiar primero `spin-trainer-api/openapi.yaml`
  y traerlo con `npm run spec:sync` (`spec:check` detecta la divergencia); `mock/__tests__/contract.test.js` valida el mock contra la copia.

## Convenciones
- Router en *data mode* (`createBrowserRouter`, rutas lazy en `src/App.jsx`).
- `features/shell/AppShell` da a las páginas `{ situations, selection }` vía `useOutletContext()`; las páginas no tienen selector propio.
  La selección vive en la URL (`?s=<key|any>&stack=<bb|any>`) y se normaliza con `domain/selection.js`. Con "Any", Quiz y Builder trabajan sobre los *spots* de la selección con rango
  (`useEffectiveRanges` + `domain/quiz.js#playableSpots`).
- Sesión de estudio (`shared/session`): marcador local de respuestas del Quiz. El progreso histórico son los intentos de la API.
- Estado que depende de (situación, stack): reiniciar con `key` en un componente hijo, no con `setState` dentro de efectos.
- Accesibilidad: controles con rol y nombre accesible (Playwright `getByRole`/`getByLabel` primero).
  Celdas del grid: `"<mano>: <acción>"`. Confirmaciones en línea con `ConfirmBar`, no `window.confirm`.
- Grid editable: `HandGrid onPaint` + `domain/range.js#paintHand` (fija, no alterna; `ERASE` = goma). Cambios sin guardar: `useUnsavedChanges` + `UnsavedChangesBar`.
- Texto sobre colores de acción: `shared/theme/contrast.js#readableText` (test WCAG AA ≥ 4.5:1 para todas las acciones).
- Quiz: preguntas con `domain/quiz.js#nextQuestion` (spots de la selección, modo normal/difíciles); mesa con `domain/table.js` + `PokerTable`.
  Atajos de teclado con `useEffectEvent` + listener en `window`; los `<kbd>` visibles van `aria-hidden` y el atajo en `aria-keyshortcuts`.
- Selectores de test: `data-testid` en kebab-case `<feature>-<elemento>`; atributos `data-hand`, `data-action` (acción efectiva),
  `data-implicit`, `data-verdict` (`correct|wrong|extra|missing`), `data-played`, `data-stack`.
- Veredictos del Builder: `domain/range.js#evaluateRange` (tipos y puntuación) + `shared/theme/verdictStyles.js` (contorno y glifo, no solo color).
- Gráficos: nunca doble eje (dos medidas → dos gráficos alineados); una serie → sin leyenda, el título la nombra; etiqueta directa selectiva;
  crosshair/tooltip también por teclado y vista de tabla. Colores `theme.colors.chart*`, validados con el validador de paleta de dataviz
  contra la superficie oscura (L 0.48–0.67, ≥ 3:1); el texto nunca lleva el color de la serie.
- El contrato vive en `spin-trainer-api/openapi.yaml`; `docs/openapi.yaml` es una copia que no se edita a mano.
