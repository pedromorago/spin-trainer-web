# ADR-0011: Solo Spin & Go; del prototipo MTT se toman UI y flujos

Estado: aceptada · Fecha: 2026-09-26

## Contexto
Existió un prototipo vanilla (un único fichero, localStorage) orientado a MTT 6-max. Sus flujos de estudio son buenos:
Explorer editable, Quiz sobre una mesa, Builder con verificación y Stats de sesión. En cambio, sus rangos y posiciones no aplican
a Spin & Go, y su código mezclaba vista y lógica, que es donde nació el bug `tgtRaise`/`tgtCall` (ADR-0009).

## Decisión
El producto entrena solo Spin & Go: 3-max y heads-up, con las 16 situaciones del catálogo.
Del prototipo se toman la UI y los flujos, no su código ni sus rangos.
`situation.format` se limita a `3max` y `hu`: no hay 6-max ni MTT.

## Consecuencias
Las funcionalidades del prototipo se reimplementan sobre la arquitectura actual (dominio puro + `shared/api`, ADR-0009),
adaptadas al catálogo: mesa de 3 o 2 asientos, acciones por situación y rangos del PDF servidos por la API (ADR-0006).
Añadir otro formato exigiría un ADR nuevo y ampliar el enum `format` del contrato.
