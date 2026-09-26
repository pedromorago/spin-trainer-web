# ADR-0003: Supabase solo como proveedor de identidad; la API es la única vía de datos

Estado: aceptada · Fecha: 2026-09-26

## Contexto
El scaffold inicial escribía en tablas de Supabase directamente desde el frontend (RLS) y a la vez se planeaba una API. Dos caminos de escritura implican dos modelos de seguridad y validación duplicada.

## Decisión
El frontend usa Supabase únicamente para login/signup y obtener el JWT. Todo acceso a datos pasa por la API, que valida el JWT contra el JWKS de Supabase y conecta a Postgres con su propio rol. Las tablas viven en el esquema `app`, sin permisos para los roles `anon`/`authenticated` de PostgREST.

## Consecuencias
Sin RLS como mecanismo principal (queda como defensa en profundidad opcional). Toda la lógica de autorización y validación es testeable en la API con REST Assured.
