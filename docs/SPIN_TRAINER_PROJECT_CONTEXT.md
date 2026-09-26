# Spin Trainer — Contexto del proyecto (v2, septiembre 2026)

## Qué es
Web app de entrenamiento de rangos preflop para Spin & Go (3-max y heads-up). Dos objetivos al mismo nivel:
1. Herramienta real para mi estudio de poker.
2. Portfolio QA de nivel profesional. **La calidad del portfolio prima sobre la velocidad.**

## Dueño
Pedro, QA Automation Engineer (~5 años). ISTQB CTFL v4.0, Grado en Matemáticas.
Stack profesional: Java + REST Assured + JUnit 5 (backend), Playwright + TypeScript (E2E), Gradle, CI/CD.

## Dominio
- 16 situaciones del PDF de referencia (Tablasmentov3.pdf): 12 de 3-max y 4 de HU. Catálogo en `src/shared/api/mock/situations.js` (en producción lo sirve la API).
- Stacks concretos en BB (incluido 12.5). Acciones compuestas: MR_4B_C, MR_C_C, MR_C_F, MR_F_F, L_C_C, L_C_F, L_PUSH, L_F, ALLIN, 3BET, 3BET_C, 3B_CALL, CALL, CALL_VS_X2, ISO_C, ISO_F, LIMP, CHECK, FOLD.
- Una acción por mano y (situación, stack). Mano no listada = acción implícita: FOLD, o CHECK si FOLD no está entre las acciones.
- Grid 13×13: diagonal parejas, triángulo superior suited, inferior offsuit. 169 manos, 1326 combos.
- Módulos: Explorer, Quiz, Builder, Stats. Descopeado: calculadora de equity.

## Arquitectura (ver docs/ARCHITECTURE.md y docs/adr/)
- **spin-trainer-web** (este repo): React 19, React Router 7, Vite, TanStack Query, CSS-in-JS inline, sin TypeScript. `domain/` puro + `shared/` + `features/`. Adaptador `mock` para desarrollar y correr E2E sin backend. Vercel.
- **spin-trainer-api**: Spring Boot 3, Java 21, Gradle. Monolito modular hexagonal (situation, range, quiz, stats) verificado con ArchUnit. OpenAPI-first con openapi-generator. Flyway (esquema + seed de rangos). JWT de Supabase validado como resource server. RFC 7807. Fly.io o Render.
- **spin-trainer-qa**: REST Assured + JUnit 5 + Cucumber, Testcontainers, Newman, Playwright + TS, validación contra la spec, Allure, SonarCloud, GitHub Actions.
- Supabase = Auth (JWT) + Postgres. **Único camino de datos: la API.** Tablas en esquema `app`, no expuesto a PostgREST.

## Decisiones cerradas
Gradle, no Maven · sin TS en producto · Supabase solo Auth · rangos default en BD (seed) · intentos de Quiz como eventos · validación contra spec en lugar de Pact.
**Rechazado:** OWASP ZAP, herramientas de carga, Pact, pgTAP, TypeScript en producto.

## Patrones QA a replicar (de mi framework profesional)
ServiceBase · TestBase + TestWatcherBase · body builder DTOs · ErrorType enum con plantillas · validación JSON Schema (ahora: contra la spec) · Qase por anotaciones · token chain · Page Objects con region comments · data factories con Faker.
Mejoras a documentar: dividir god-objects · Lombok @Builder · ThreadLocalRandom · Awaitility · @ConfigurationProperties · ThreadLocal para paralelo · registry pattern en el login.

## Lecciones
- Bug del prototipo: rangos mixtos mal clasificados por confundir `tgtRaise`/`tgtCall`. Resuelto entonces con un flag `hasColors`; en la v2 desaparece porque `evaluateRange` compara la acción efectiva mano a mano.
- La consistencia de acciones entre vistas se garantiza teniendo una única función (`domain/range.js#actionFor`).

## Estado
- Prototipo vanilla (single file, localStorage): funcional, uso personal.
- Web v2: estructura nueva, 62 tests Vitest (dominio, mock, invariante de colores) con cobertura ≥90%, ESLint con reglas de capas, mock API que valida como la API, 4 features. Compila, pasa lint y tests. Sin desplegar.
- API y suite QA: no empezadas. Contrato v0 en `docs/openapi-draft.yaml`, pendiente de validación.

## Roadmap
0. Entorno Windows 10/11 desde cero (Node LTS, Java 21, Git, Docker Desktop, IDE, gh CLI).
1. Validar contrato v0 → crear spin-trainer-api (Gradle, openapi-generator, Flyway, ArchUnit, Testcontainers).
2. Seed de rangos del PDF (Flyway), situación por situación, validando conmigo.
3. Conectar web a API real (`VITE_API_MODE=http`), Supabase Auth en producción.
4. spin-trainer-qa: API tests + contrato + E2E (contra mock y contra API real) + Allure + CI.
5. Deploy (Vercel + Fly.io/Render) y README de portfolio con enlaces a ADRs y reports.

## Cómo trabajar conmigo
Conciso, técnico, sin marketing. Iterativo: propón, valido, sigues. Numero las peticiones. Reviso y corrijo.
