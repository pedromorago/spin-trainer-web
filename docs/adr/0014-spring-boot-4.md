# ADR-0014: Spring Boot 4.1 for the API

Status: Accepted · Date: 2026-09-26

## Context
The initial plan said "Spring Boot 3". When spin-trainer-api was created (September 2026), the last 3.x line (3.5) no longer
has OSS support: it ended on 30 June 2026 and only commercial support remains. Starting a new project on a line without
public patches is a concrete defect, all the more so in a portfolio. No ADR pinned the version.

## Decision
Spring Boot 4.1 (4.1.1, OSS support until July 2027) with Java 21, which stays (LTS supported until 2029).
This brings in Spring Framework 7, Spring Security 7, Jackson 3, Testcontainers 2 and JUnit 6. openapi-generator generates
for that baseline (`useSpringBoot4`, `useJackson3`). Versions live in `gradle/libs.versions.toml`; minor versions are bumped
within the support window.

## Consequences
Security patches and current APIs (modular starters, `MockMvcTester`, structured logging, `@ServiceConnection`
with Testcontainers 2). Part of the documentation online still targets Boot 3 (packages `com.fasterxml.jackson`
→ `tools.jackson`, `spring-boot-starter-web` → `spring-boot-starter-webmvc`): the official 4.1 documentation is followed.
