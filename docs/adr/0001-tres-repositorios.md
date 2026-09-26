# ADR-0001: Tres repositorios: web, api y qa

Estado: aceptada · Fecha: 2026-09-26

## Contexto
El proyecto es a la vez producto y portfolio QA. Un portfolio de testing creíble necesita una suite independiente del código que prueba, como ocurre en equipos profesionales.

## Decisión
Repos separados: spin-trainer-web, spin-trainer-api y spin-trainer-qa. La spec OpenAPI se publica desde el repo api como artefacto versionado.

## Consecuencias
Más overhead de CI y versionado del contrato. A cambio, la suite QA demuestra pruebas de caja negra reales y cada repo tiene su pipeline y su quality gate en SonarCloud.
