# ADR-0007: Intentos de Quiz como eventos inmutables

Estado: aceptada · Fecha: 2026-09-26

## Contexto
El esquema inicial guardaba contadores agregados (correct/total) por situación y stack, perdiendo el detalle por mano y por fecha.

## Decisión
Cada respuesta se persiste como `QuizAttempt` (situación, stack, mano, esperada, dada, correcta, timestamp). Las estadísticas son consultas sobre esa tabla.

## Consecuencias
Tabla que crece con el uso (asumible; paginación en v1). Permite manos más falladas, evolución temporal y filtros sin migrar datos.
