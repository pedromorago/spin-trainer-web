# Arquitectura — Spin Trainer

## Sistema

```
 ┌──────────────┐  JWT (Supabase Auth)   ┌──────────────────────┐
 │ spin-trainer │ ─────────────────────▶ │   spin-trainer-api    │
 │    -web      │  REST /api/v1 (OpenAPI)│Spring Boot 4.1·Java 21│
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
    ui/        componentes de presentación (HandGrid, ActionPalette, Layout, SituationBar, PokerTable, VerdictLegend…)
    theme/     tokens (fondo con degradado, dorado, Bebas Neue / DM Sans / JetBrains Mono) y mapa acción→color
  features/    una carpeta por módulo: shell, explorer, quiz, builder, stats, auth. Solo composición.
```

Dependencias permitidas: `features → shared → domain`. `domain` no importa nada. `shared/ui` no importa `shared/api`.
`features` nunca importa `httpClient` ni `mockApi`; solo `shared/api/index.js` y `queries.js`.
Estas reglas no son solo documentación: `eslint.config.js` las verifica (`no-restricted-imports`/`no-restricted-globals` por capa), igual que ArchUnit en la API.

La única implementación de "qué acción tiene esta mano" es `domain/range.js#actionFor`. Explorer, Quiz y Builder la comparten;
el Builder evalúa comparando la acción efectiva mano a mano (`evaluateRange`), lo que elimina la clase de bug `tgtRaise`/`tgtCall` del prototipo.

Rango efectivo (ADR-0012): el personalizado si existe, si no el del PDF, resuelto en un único hook (`useEffectiveRange`),
derivado de las listas `GET /ranges/default` y `GET /ranges/user` que ya comparten el Quiz y el modo "Any" (ni una
petición por combinación ni un 404 cuando aún no hay rango).
El Explorer es el único que escribe rangos: pincel por acción + goma (`paintHand`: fija, no alterna, así que se puede pintar
arrastrando con ratón o dedo), Guardar (`PUT` con la versión de partida → 409 si otro la cambió), Reset (`DELETE`) y Copiar
(`exportRange`). El Builder es un ejercicio sin persistencia que se verifica contra el rango efectivo:
la pregunta es la selección actual o una combinación al azar con rango ("Nueva pregunta"), y "Verificar" usa
`evaluateRange`, que clasifica cada mano (correcta, acción equivocada, de más, faltó) y puntúa solo las manos jugadas
en alguno de los dos rangos; con un rango cerrado, acertar los folds de las 169 inflaría la nota.

Quiz: cada pregunta la decide `domain/quiz.js#nextQuestion` sobre los *spots* de la selección (combinaciones con rango
efectivo; varias con "Any", así que la combinación cambia en cada pregunta). En modo "solo difíciles" elige con probabilidad
proporcional al peso de `domain/stats.js#hardHands` (≥ 2 fallos; peso = 2·fallos − 0,5·aciertos; la mano sale del pool
al llegar a 0), calculado sobre `GET /stats/hands`. La mesa (`shared/ui/PokerTable`) se dibuja desde `domain/table.js`
(asientos por formato, héroe, dealer, apuestas previas desde `Situation.priorActions`) y las cartas desde `domain/cards.js`
(palos coherentes con pareja/suited/offsuit). Atajos 1..n y Enter/→ con `useEffectEvent`. La corrección local da feedback
inmediato; la API vuelve a corregir al registrar el intento.

Stats separa la **sesión** (local, reiniciable: precisión, mejor racha, manos) del **histórico** (API): totales, manos
difíciles, precisión por situación (chips con medidor), top 10 de fallos por situación/stack/mano y el progreso diario
(`GET /stats/progress` en la zona horaria del navegador, completado día a día con `domain/stats.js#dailySeries`).
El gráfico de progreso sigue el método de visualización del proyecto: dos gráficos alineados por día (precisión como
línea = la historia, manos jugadas como columnas en gris = el contexto) en lugar de un doble eje; colores validados con
el validador de paleta sobre la superficie real (`theme.colors.chart*`); crosshair y tooltip con ratón y teclado;
vista de tabla como equivalente accesible; al cambiar de periodo se mantiene el render anterior atenuado.

`VITE_API_MODE=mock` (`npm run dev:mock`, `npm run build:mock`) permite desarrollar y correr E2E sin backend con el mismo contrato.
El mock valida como la API (400/404/409) y es dueño de los campos de servidor (`id`, `at`, `correct`, `version`); los builds http no lo incluyen.

Routing en *data mode* (`createBrowserRouter`): rutas lazy por feature y `useBlocker` para los cambios sin guardar.

`features/shell/AppShell` es el marco de todas las pestañas: carga el catálogo, pinta la cabecera con el marcador de sesión
y un único selector de situación/stack, y pasa `{ situations, selection }` a las páginas con `useOutletContext()`.
La selección vive en la URL (`?s=<key|any>&stack=<bb|any>`, normalizada por `domain/selection.js`): un solo estado
compartido entre pestañas y enlaces directos a cualquier situación. Con "Any", el Quiz elige combinación en cada pregunta, el Builder
una por pregunta y el Explorer muestra el modo aleatorio.

Sesión de estudio vs. progreso: la sesión (`shared/session`, reglas en `domain/session.js`) es el marcador en curso
de las respuestas del Quiz (precisión, racha, manos), vive en `sessionStorage` y se puede reiniciar.
El progreso a largo plazo son los intentos persistidos en la API (ADR-0007).

## API (repo spin-trainer-api)

Spring Boot 4.1 sobre Java 21 (ADR-0014). Monolito modular, hexagonal por módulo, verificado con ArchUnit:

```
com.pedromorago.spintrainer
  situation/   catálogo (seed); en memoria tras la primera lectura
  range/       rangos de referencia (solo lectura) y del usuario (versionado optimista); rango efectivo
  quiz/        intentos corregidos en el servidor, eventos inmutables, paginación por cursor
  stats/       lado de lectura de quiz: GROUP BY por mano y por día (límites de cada día calculados en java.time
               para la zona IANA pedida; Postgres no interpreta nombres de zona)
    └─ cada módulo: domain · application (port.in, port.out, servicio) · adapter.in.rest · adapter.out.persistence
  shared/      kernel (Hand, Stack, Action, SituationKey, UserId, DomainException) · security (JWT de Supabase)
               · web (Problem Details, correlation id, CORS, ETag) · config (Clock)
  api/         generado desde openapi.yaml (interfaces *Api y DTOs); no se versiona
```

Reglas que comprueba ArchUnit (`ArchitectureTest`): dominio y kernel sin Spring, Jakarta, Jackson ni JDBC; `application`
sin adaptadores ni transporte; solo `adapter.in.rest` usa el código generado y cada `@RestController` implementa una
interfaz generada; solo `adapter.out.persistence` usa JDBC; entre módulos solo se usan `application.port.in` y el
dominio publicado; `shared` no depende de ningún módulo; sin ciclos.

- **Contrato:** `openapi-generator` genera las interfaces sin implementación por defecto: una operación sin implementar
  no compila. Lo que el generador no traduce (múltiplos de 0,5, claves del mapa `hands`, orden de la mano, acciones de
  la situación) lo valida el dominio. JSON estricto (`JsonConfig`): campos desconocidos (`additionalProperties: false`),
  coerciones (`"25"` por 25, `0.9` por 0, índices como enum) y documentos de más de 64 KB son un 400.
- **Orden de validación:** forma de la petición (400) → existencia de la combinación (404) → reglas de negocio
  (400 por mano, 409, 422). El mock valida primero la existencia; la diferencia solo se ve con peticiones que fallan
  en ambas cosas a la vez.
- **Lecturas consistentes:** un rango (versión + manos) se lee en una sola sentencia (`rango LEFT JOIN manos`), así que
  nunca se mezclan dos escrituras y el control de versiones no puede aceptar un rango leído a medias.
- **Una regla de acción por mano:** `range/domain/RangeRules#actionFor` es el equivalente de `domain/range.js#actionFor`;
  el servidor corrige el Quiz con ella y guarda `expected`, `rangeSource` y `rangeVersion` en cada intento.
- **Persistencia (ADR-0015):** `JdbcClient` con SQL explícito, sin JPA. Esquema `app` migrado por Flyway con
  numeración secuencial (esquema y seed en orden de aplicación). La base de datos rechaza datos imposibles (claves
  foráneas a la tabla de 169 manos y a las acciones de cada situación, `CHECK (correct = (given = expected))`).
  Dos roles: `spin_migrator` (dueño, Flyway) y `spin_app` (la API): lectura del catálogo y de los rangos de
  referencia, escritura de los rangos del usuario y solo `INSERT` + `SELECT` en `quiz_attempt`. Los roles los crea
  `db/bootstrap/bootstrap.sql` una vez por entorno.
- **Concurrencia:** `PUT` de un rango es `INSERT … ON CONFLICT DO NOTHING` (versión 0) o `UPDATE … WHERE version = ?`;
  0 filas → 409 con la versión actual. Un test con 8 escrituras simultáneas comprueba que gana exactamente una.
- **Seguridad (ADR-0003):** resource server sin estado; firma ES256 contra el JWKS de Supabase, emisor, `exp`
  obligatoria, `aud` y `role = authenticated` (los tokens `anon`/`service_role` no sirven) y `sub` UUID. CORS por
  configuración.
- **Errores:** RFC 9457 en un único `@RestControllerAdvice` (también los 401): `urn:spin-trainer:validation`,
  `unauthorized`, `not-found`, `conflict`, `no-range`, `unsupported` (405/406/413/415), `unavailable` (503: el JWKS de
  Supabase no responde; no se confunde con una sesión cerrada) e `internal`, con `correlationId` y `errors` por campo
  en los 400.
- **Caché:** catálogo y rangos de referencia con `ETag` y `Cache-Control: no-cache, private` (304 con `If-None-Match`).
- **Observabilidad:** `X-Correlation-Id` aceptado o generado → MDC → respuesta y Problem; logs JSON (ECS) en `prod`;
  Actuator solo `health` (liveness/readiness).
- **Desarrollo local:** `gradlew bootTestRun` levanta la API con un Postgres de Testcontainers preparado como
  producción y un emisor de JWT local (imprime un token); con `SUPABASE_URL` valida los tokens reales de la web.

## Contrato v0.2 (ADR-0013; `spin-trainer-api/openapi.yaml`, copia en `docs/openapi.yaml`)

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
| Unit | Vitest sobre `domain/`, adaptadores mock y http (cobertura ≥90%) | JUnit 6 + AssertJ sobre dominio y casos de uso, sin Spring (JaCoCo: ≥90% dominio/casos de uso/kernel) | — |
| Arquitectura | ESLint: reglas de capas en `eslint.config.js` | ArchUnit | — |
| Integración | — | App completa con MockMvc, Postgres 17 de Testcontainers con los roles de producción y JWT reales contra un JWKS local | — |
| Contrato | Mock validado contra la copia `docs/openapi.yaml` (Ajv) | Cada respuesta de los tests de integración validada contra `openapi.yaml` (estado declarado + schema) | Cada respuesta de REST Assured y Cucumber validada contra una copia fijada de la spec (estado, Content-Type, schema y formatos) |
| API funcional | — | — | Caja negra contra la imagen Docker de la API: REST Assured + JUnit (particiones, límites, tabla de decisión, estados), Cucumber en español y Newman |
| E2E | — | — | Playwright (TS): las mismas specs contra el mock y contra la API real; axe (WCAG 2.2 AA) |
| Reporting | — | — | Allure combinado (API, Newman, E2E) en GitHub Actions; SonarCloud en los tres repos (pendiente) |
