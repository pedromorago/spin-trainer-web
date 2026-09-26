# Arquitectura — Spin Trainer

## Sistema

```
 ┌──────────────┐  JWT (Supabase Auth)   ┌──────────────────────┐
 │ spin-trainer │ ─────────────────────▶ │   spin-trainer-api    │
 │    -web      │  REST /api/v1 (OpenAPI)│ Spring Boot 3 · Java 21│
 │ React 19     │ ◀───────────────────── │ Gradle · Flyway        │
 └──────┬───────┘                        └──────────┬───────────┘
        │ login/signup                               │ JDBC (rol propio)
        ▼                                            ▼
 ┌──────────────┐                        ┌──────────────────────┐
 │ Supabase Auth│  JWKS ──────────────▶  │ Postgres (Supabase)   │
 └──────────────┘  (la API valida el JWT)│ esquema `app`, no     │
                                         │ expuesto a PostgREST  │
                                         └──────────────────────┘
 ┌──────────────────────────────────────────────────────────────┐
 │ spin-trainer-qa: REST Assured+Cucumber · Testcontainers ·    │
 │ Newman · Playwright(TS) · validación contra la spec · Allure  │
 └──────────────────────────────────────────────────────────────┘
```

Reglas:
- **Un solo camino de datos:** el frontend solo habla con la API. Supabase emite el JWT y nada más.
- **La API es dueña del esquema** (Flyway) y de los rangos default (seed versionado). Tablas en esquema `app`, sin permisos para los roles `anon`/`authenticated` de PostgREST.
- **Contrato primero:** `openapi.yaml` vive en el repo de la API, se publica como artefacto y lo consumen web y QA.

## Frontend (este repo)

```
src/
  domain/      JS puro: hand, actions, range, quiz, stats, selection, session, cards, table, random. Sin React, sin I/O. Tests Vitest.
  shared/
    api/       contrato de acceso a datos: httpClient (real) | mock (memoria+localStorage); queries (TanStack Query)
    auth/      Supabase Auth (cargado bajo demanda) + AuthProvider + RequireAuth
    session/   marcador de la sesión de estudio (sessionStorage). No accede a la API.
    ui/        componentes de presentación (HandGrid, ActionPalette, Layout, SituationBar, ComboPicker…)
    theme/     tokens (fondo con degradado, dorado, Bebas Neue / DM Sans / JetBrains Mono) y mapa acción→color
  features/    una carpeta por módulo: shell, explorer, quiz, builder, stats, auth. Solo composición.
```

Dependencias permitidas: `features → shared → domain`. `domain` no importa nada. `shared/ui` no importa `shared/api`.
`features` nunca importa `httpClient` ni `mockApi`; solo `shared/api/index.js` y `queries.js`.
Estas reglas no son solo documentación: `eslint.config.js` las verifica (`no-restricted-imports`/`no-restricted-globals` por capa), igual que ArchUnit en la API.

La única implementación de "qué acción tiene esta mano" es `domain/range.js#actionFor`. Explorer, Quiz y Builder la comparten;
el Builder evalúa comparando la acción efectiva mano a mano (`evaluateRange`), lo que elimina la clase de bug `tgtRaise`/`tgtCall` del prototipo.

Rango efectivo (ADR-0012): el personalizado si existe, si no el del PDF, resuelto en un único hook (`useEffectiveRange`).
El Explorer es el único que escribe rangos: pincel por acción + goma (`paintHand`: fija, no alterna, así que se puede pintar
arrastrando con ratón o dedo), Guardar (`PUT` con la versión de partida → 409 si otro la cambió), Reset (`DELETE`) y Copiar
(`exportRange`). El Builder es un ejercicio sin persistencia que se verifica contra el rango efectivo.

Quiz: cada pregunta la decide `domain/quiz.js#nextQuestion` sobre los *spots* de la selección (combinaciones con rango
efectivo; varias con "Any", así que la combinación cambia en cada pregunta). En modo "solo difíciles" elige con probabilidad
proporcional al peso de `domain/stats.js#hardHands` (≥ 2 fallos; peso = 2·fallos − 0,5·aciertos; la mano sale del pool
al llegar a 0), calculado sobre `GET /stats/hands`. La mesa (`shared/ui/PokerTable`) se dibuja desde `domain/table.js`
(asientos por formato, héroe, dealer, apuestas previas desde `Situation.priorActions`) y las cartas desde `domain/cards.js`
(palos coherentes con pareja/suited/offsuit). Atajos 1..n y Enter/→ con `useEffectEvent`. La corrección local da feedback
inmediato; la API vuelve a corregir al registrar el intento.

`VITE_API_MODE=mock` (`npm run dev:mock`, `npm run build:mock`) permite desarrollar y correr E2E sin backend con el mismo contrato.
El mock valida como la API (400/404/409) y es dueño de los campos de servidor (`id`, `at`, `correct`, `version`); los builds http no lo incluyen.

Routing en *data mode* (`createBrowserRouter`): rutas lazy por feature y `useBlocker` para los cambios sin guardar.

`features/shell/AppShell` es el marco de todas las pestañas: carga el catálogo, pinta la cabecera con el marcador de sesión
y un único selector de situación/stack, y pasa `{ situations, selection }` a las páginas con `useOutletContext()`.
La selección vive en la URL (`?s=<key|any>&stack=<bb|any>`, normalizada por `domain/selection.js`): un solo estado
compartido entre pestañas y enlaces directos a cualquier situación. Con "Any", Quiz y Builder eligen una combinación al azar
(`ComboPicker`) y el Explorer muestra el modo aleatorio.

Sesión de estudio vs. progreso: la sesión (`shared/session`, reglas en `domain/session.js`) es el marcador en curso
de las respuestas del Quiz (precisión, racha, manos), vive en `sessionStorage` y se puede reiniciar.
El progreso a largo plazo son los intentos persistidos en la API (ADR-0007).

## API (repo spin-trainer-api)

Monolito modular, hexagonal por módulo, verificado con ArchUnit:

```
com.pedromorago.spintrainer
  situation/   domain · application · adapter.in.rest · adapter.out.persistence
  range/       (default ranges + user ranges, versionado optimista)
  quiz/        (QuizAttempt como evento inmutable)
  stats/       (consultas sobre attempts)
  shared/      security (JWT resource server, JWKS Supabase), problem details, correlation id
```

- `openapi-generator` genera interfaces `*Api` desde `openapi.yaml`; los controllers las implementan → el código no puede desviarse del contrato.
- Errores en RFC 9457 (Problem Details, sustituye a la 7807). Tipos: `urn:spin-trainer:validation`, `unauthorized`, `not-found`, `conflict`, `no-range`.
- `PUT /ranges/user/{situation}/{stack}` reemplaza el rango completo; `version` obligatoria (0 = crear, N = reemplazar la N) → 409 si no coincide.
- El servidor corrige los intentos (`expected`, `correct`) contra el rango efectivo; `stats` agrega con SQL y el cliente aplica la política de estudio (ADR-0013).
- Actuator `/actuator/health`, logs JSON con `correlationId`.

## Contrato v0.2 (ADR-0013; borrador en `docs/openapi-draft.yaml`, pasará a spin-trainer-api)

| Método | Ruta | Descripción |
|---|---|---|
| GET | /situations | Catálogo de 16 situaciones: stacks, acciones, héroe, acciones previas, notas |
| GET | /ranges/default | Todos los rangos de referencia con seed |
| GET | /ranges/default/{situation}/{stack} | Rango de referencia (404 si no hay seed) |
| GET | /ranges/user | Todos los rangos personalizados del usuario |
| GET | /ranges/user/{situation}/{stack} | Rango personalizado (404 si no existe) |
| PUT | /ranges/user/{situation}/{stack} | Crea (201) o reemplaza (200) con `version` obligatoria → 409 |
| DELETE | /ranges/user/{situation}/{stack} | Borra el personalizado (204, idempotente) |
| POST | /quiz/attempts | Registra `{situation, stack, hand, given}`; el servidor corrige (422 si no hay rango) |
| GET | /quiz/attempts | Intentos, del más reciente al más antiguo, paginados por cursor |
| GET | /stats/hands | Intentos/aciertos por situación, stack y mano |
| GET | /stats/progress | Intentos/aciertos por día (zona horaria IANA) |

El mock (`shared/api/mock`) implementa este contrato y `mock/__tests__/contract.test.js` valida sus respuestas y errores
contra los schemas del YAML (Ajv, JSON Schema 2020-12): si mock y spec divergen, falla un test.

## Testing

| Nivel | Web | API | QA repo |
|---|---|---|---|
| Unit | Vitest sobre `domain/`, adaptadores mock y http (cobertura ≥90%) | JUnit 5 sobre domain/application | — |
| Arquitectura | ESLint: reglas de capas en `eslint.config.js` | ArchUnit | — |
| Integración | — | Testcontainers Postgres + Flyway | — |
| Contrato | Mock validado contra `openapi-draft.yaml` (Ajv) | — | Validación de respuestas contra `openapi.yaml` |
| API funcional | — | — | REST Assured + Cucumber; Newman en regresión |
| E2E | — | — | Playwright (TS), contra API real y contra mock |
| Reporting | — | — | Allure; SonarCloud en los tres repos; GitHub Actions |
