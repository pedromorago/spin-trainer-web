# ADR-0009: Capa de dominio en JavaScript puro en el frontend

Estado: aceptada · Fecha: 2026-09-26

## Contexto
El bug de rangos mixtos (`tgtRaise` vs `tgtCall`) del prototipo nació de tener la validación dentro de la vista. No se usa TypeScript en código de producto.

## Decisión
`src/domain/` contiene manos, acciones, rangos, motor de Quiz y stats como funciones puras sin React ni I/O, con tests unitarios en Vitest. Las features solo componen. El acceso a datos va por `shared/api` con dos adaptadores (http y mock) del mismo contrato.

## Consecuencias
Toda regla de negocio del frontend es testeable en milisegundos. El mock permite E2E sin backend. La estructura por feature evita carpetas por tipo técnico.
