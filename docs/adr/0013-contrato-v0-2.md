# ADR-0013: Contrato v0.2: el servidor corrige, agrega y protege las escrituras

Estado: aceptada · Fecha: 2026-09-26

## Contexto
Revisión del contrato v0 antes de generar la API (OpenAPI-first, ADR-0004), con el alcance ampliado del frontend
(ADR-0011, ADR-0012: mesa del Quiz, modo "Any", manos difíciles, progreso). Problemas de v0:
- El cliente enviaba `expected` y el mock aceptaba `correct`: las estadísticas se podían falsear desde el navegador.
- `PUT` sin `version` sobre un rango existente lo sobrescribía sin avisar (actualización perdida).
- `GET /quiz/attempts` sin paginar y estadísticas calculadas en el cliente sobre todos los intentos; el módulo `stats`
  de la API no tenía endpoints.
- La mesa del Quiz y el modo aleatorio necesitaban datos que el contrato no daba (posición del héroe, acciones previas,
  qué combinaciones tienen rango).
- `3BET_C` y `3B_CALL` eran la misma acción ("3-bet / Call") con dos códigos.
- Sin respuestas 401, sin tags (openapi-generator agrupa las interfaces `*Api` por tag), `Problem` sin campos obligatorios.

## Decisión
1. **El servidor corrige:** `AttemptWrite` solo lleva `situation, stack, hand, given`. El servidor calcula `expected`
   contra el rango efectivo en ese momento (ADR-0012) y `correct`, y guarda `rangeSource` y `rangeVersion`.
   422 `no-range` si la combinación no tiene rango.
2. **Escrituras sin actualizaciones perdidas:** `RangeWrite.version` es obligatoria (`0` = crear, `N` = reemplazar la
   versión N; si no coincide, 409). `PUT` responde 201 al crear y 200 al reemplazar; situación/stack desconocido → 404.
3. **Estadísticas agregadas en la API, política en el cliente:** `GET /stats/hands` (intentos y aciertos por
   situación, stack y mano) y `GET /stats/progress` (por día, zona horaria IANA). Manos difíciles, pesos y rankings
   se calculan en `domain/stats.js` sobre esas filas. `GET /quiz/attempts` pagina por cursor (del más reciente al más antiguo).
4. **Catálogo más rico:** `Situation.hero` y `Situation.priorActions` (posición y acción de quien actuó antes).
   `GET /ranges/default` y `GET /ranges/user` devuelven todos los rangos de una vez.
5. **Higiene del contrato:** tags por módulo; 401 en todas las operaciones; `Problem` RFC 9457 (sustituye a la 7807)
   con `type`, `title` y `status` obligatorios, `correlationId` y `errors` por campo; `Stack` con `multipleOf: 0.5`;
   `Hand` con un patrón que rechaza `AAs`/`AK`; `additionalProperties: false` en los cuerpos; `x-enum-varnames` para
   generar nombres Java válidos (`3BET` → `THREE_BET`); se unifica `3B_CALL` en `3BET_C`.

## Consecuencias
Más superficie de API, pero también más que probar desde spin-trainer-qa: corrección en el servidor, 409/422,
paginación por cursor y agregados. El mock implementa v0.2 y un test valida sus respuestas contra los schemas
de `docs/openapi-draft.yaml`. `priorActions` y la unificación de `3B_CALL` son lecturas del PDF: se validan con Pedro
al hacer el seed.
