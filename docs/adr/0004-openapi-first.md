# ADR-0004: OpenAPI-first con generación de interfaces

Estado: aceptada · Fecha: 2026-09-26

## Contexto
Shift Left figura en el CV. Mantener spec y código a mano se desincroniza.

## Decisión
`openapi.yaml` es la fuente de verdad. El plugin openapi-generator de Gradle genera las interfaces `*Api` y los DTOs; los controllers las implementan. Los tests QA validan las respuestas reales contra la misma spec.

## Consecuencias
Cambiar la API exige cambiar primero la spec. Los tests de contrato no necesitan schemas mantenidos a mano.
