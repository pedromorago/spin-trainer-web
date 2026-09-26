# ADR-0005: Monolito modular hexagonal verificado con ArchUnit

Estado: aceptada · Fecha: 2026-09-26

## Contexto
La preocupación arquitectónica central es mantener consistente la lógica de rangos entre vistas y casos de uso. Sin reglas explícitas, la lógica acaba en controllers y repositorios.

## Decisión
Paquete por módulo de negocio (situation, range, quiz, stats) con capas domain / application / adapter. El dominio no depende de Spring ni JPA. ArchUnit impone las dependencias entre capas y entre módulos.

## Consecuencias
Más clases y mapeos. A cambio, dominio testeable en aislamiento y arquitectura verificada en CI, no solo documentada.
