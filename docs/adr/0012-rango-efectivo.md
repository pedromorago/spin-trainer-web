# ADR-0012: Rango efectivo: el personalizado prevalece; el Builder no persiste

Estado: aceptada · Fecha: 2026-09-26

## Contexto
El Explorer pasa a ser editable (pincel, Guardar, Reset). Con dos rangos posibles por situación y stack
(el de referencia del PDF, ADR-0006, y el personalizado del usuario), Quiz, Builder y Explorer necesitan
una única regla para decidir contra cuál se entrena. Hasta ahora el Builder también guardaba rangos,
de modo que había dos pantallas escribiendo el mismo recurso.

## Decisión
- **Rango efectivo = personalizado si existe; si no, el del PDF.** Lo aplican las tres pestañas a través
  de un único hook (`shared/api/queries.js#useEffectiveRange`). La UI indica cuándo se entrena un rango personalizado.
- **Solo el Explorer escribe rangos personalizados:** Guardar (`PUT`) y Reset (`DELETE`, vuelve al del PDF).
- **El Builder es un ejercicio:** empieza vacío, se construye de memoria y se verifica contra el rango efectivo. No persiste.

## Consecuencias
Si ajustas un rango (por ejemplo, contra un tipo de rival), entrenas tu estrategia; Reset devuelve la referencia.
Las estadísticas siguen siendo válidas si cambias un rango, porque cada intento guarda la acción esperada
en el momento de responder (ADR-0006, ADR-0007). Un único punto de escritura evita conflictos entre pestañas;
el control de versión optimista (409) sigue cubriendo varias pestañas o dispositivos.
