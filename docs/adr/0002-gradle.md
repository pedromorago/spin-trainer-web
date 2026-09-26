# ADR-0002: Gradle en lugar de Maven

Estado: aceptada · Fecha: 2026-09-26

## Contexto
El stack profesional de Pedro usa Gradle. Una primera propuesta recomendaba Maven.

## Decisión
Gradle (Kotlin DSL) para la API y la suite QA Java.

## Consecuencias
Consistencia con el entorno de trabajo real; toolchains de Java 21 y version catalogs para las dependencias.
