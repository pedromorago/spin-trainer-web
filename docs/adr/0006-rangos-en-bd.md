# ADR-0006: Rangos default como datos versionados en la base de datos

Estado: aceptada · Fecha: 2026-09-26

## Contexto
Con los rangos hardcodeados en el frontend, la API no puede corregir el Quiz ni evaluar el Builder sin duplicarlos.

## Decisión
Los rangos del PDF se cargan mediante migraciones de datos Flyway (seed) con un campo de versión. La API los sirve en `GET /ranges/default/{situation}/{stack}`.

## Consecuencias
Actualizar el PDF es una migración, no un deploy del frontend. Los intentos del Quiz guardan la acción esperada en el momento, por lo que las stats sobreviven a cambios de rango.
