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
  domain/      JS puro: hand, actions, range, quiz, stats. Sin React, sin I/O. Tests Vitest.
  shared/
    api/       contrato de acceso a datos: httpClient (real) | mock (memoria+localStorage); queries (TanStack Query)
    auth/      Supabase Auth + RequireAuth
    ui/        componentes de presentación (HandGrid, ActionPalette, selectores, Layout)
    theme/     tokens y mapa acción→color
  features/    una carpeta por módulo: explorer, quiz, builder, stats, auth. Solo composición.
```

Dependencias permitidas: `features → shared → domain`. `domain` no importa nada. `shared/ui` no importa `shared/api`.
`features` nunca importa `httpClient` ni `mockApi`; solo `shared/api/index.js` y `queries.js`.
Estas reglas no son solo documentación: `eslint.config.js` las verifica (`no-restricted-imports`/`no-restricted-globals` por capa), igual que ArchUnit en la API.

La única implementación de "qué acción tiene esta mano" es `domain/range.js#actionFor`. Explorer, Quiz y Builder la comparten;
el Builder evalúa comparando la acción efectiva mano a mano (`evaluateRange`), lo que elimina la clase de bug `tgtRaise`/`tgtCall` del prototipo.

`VITE_API_MODE=mock` (`npm run dev:mock`, `npm run build:mock`) permite desarrollar y correr E2E sin backend con el mismo contrato.
El mock valida como la API (400/404/409) y es dueño de los campos de servidor (`id`, `at`, `correct`, `version`); los builds http no lo incluyen.

Routing en *data mode* (`createBrowserRouter`): rutas lazy por feature y `useBlocker` para los cambios sin guardar del Builder.
La selección de situación y stack vive en la URL (`?s=<key>&stack=<bb>`), así que hay enlaces directos a cualquier situación y stack.

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
- Errores en RFC 7807. Tipos: `urn:spin-trainer:validation`, `not-found`, `conflict`, `unauthorized`.
- `PUT /ranges/user/{situation}/{stack}` reemplaza el rango completo (idempotente); `version` para concurrencia optimista → 409.
- Actuator `/actuator/health`, logs JSON con `correlationId`.

## Contrato v0 (a validar antes de generar la API)

| Método | Ruta | Descripción |
|---|---|---|
| GET | /situations | Catálogo de 16 situaciones (stacks, acciones, notas) |
| GET | /ranges/default/{situation}/{stack} | Rango de referencia (PDF) |
| GET | /ranges/user/{situation}/{stack} | Rango custom del usuario (404 si no existe) |
| PUT | /ranges/user/{situation}/{stack} | Crea/reemplaza rango custom (`hands`, `version`) |
| DELETE | /ranges/user/{situation}/{stack} | Borra rango custom |
| POST | /quiz/attempts | Registra un intento |
| GET | /quiz/attempts | Intentos del usuario (paginable en v1) |

El mock (`shared/api/mock`) implementa exactamente este contrato; `docs/openapi-draft.yaml` es el borrador.

## Testing

| Nivel | Web | API | QA repo |
|---|---|---|---|
| Unit | Vitest sobre `domain/` y el adaptador mock (cobertura ≥90%) | JUnit 5 sobre domain/application | — |
| Arquitectura | ESLint: reglas de capas en `eslint.config.js` | ArchUnit | — |
| Integración | — | Testcontainers Postgres + Flyway | — |
| Contrato | — | — | Validación de respuestas contra `openapi.yaml` |
| API funcional | — | — | REST Assured + Cucumber; Newman en regresión |
| E2E | — | — | Playwright (TS), contra API real y contra mock |
| Reporting | — | — | Allure; SonarCloud en los tres repos; GitHub Actions |
