# ADR-0014: Spring Boot 4.1 en la API

Estado: aceptada · Fecha: 2026-09-26

## Contexto
El plan inicial decía "Spring Boot 3". Al crear spin-trainer-api (septiembre de 2026), la última rama 3.x (3.5) ya no
tiene soporte OSS: terminó el 30/06/2026 y solo queda soporte comercial. Empezar un proyecto nuevo sobre una línea sin
parches públicos es un defecto concreto, más aún en un portfolio. Ningún ADR fijaba la versión.

## Decisión
Spring Boot 4.1 (4.1.1, soporte OSS hasta julio de 2027) con Java 21, que se mantiene (LTS con soporte hasta 2029).
Eso arrastra Spring Framework 7, Spring Security 7, Jackson 3, Testcontainers 2 y JUnit 6. openapi-generator genera
para esa base (`useSpringBoot4`, `useJackson3`). Las versiones viven en `gradle/libs.versions.toml`; se sube de minor
dentro de la ventana de soporte.

## Consecuencias
Parches de seguridad y APIs actuales (starters modulares, `MockMvcTester`, logs estructurados, `@ServiceConnection`
con Testcontainers 2). Parte de la documentación de internet sigue siendo de Boot 3 (paquetes `com.fasterxml.jackson`
→ `tools.jackson`, `spring-boot-starter-web` → `spring-boot-starter-webmvc`): se sigue la documentación oficial de 4.1.
