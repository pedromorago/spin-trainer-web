# ADR-0008: Validación contra la spec en lugar de Pact

Estado: aceptada · Fecha: 2026-09-26

## Contexto
Pact fue descartado: un único consumidor y un único proveedor no justifican un broker.

## Decisión
Los tests de API validan cada respuesta contra `openapi.yaml` con un validador de spec; el frontend se prueba E2E también contra un adaptador mock que implementa el mismo contrato.

## Consecuencias
Menos infraestructura. La detección de drift depende de mantener la spec como fuente de verdad (ADR-0004).
