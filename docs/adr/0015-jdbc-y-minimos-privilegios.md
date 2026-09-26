# ADR-0015: Persistencia con JdbcClient y mínimos privilegios en la base de datos

Estado: aceptada · Fecha: 2026-09-26

## Contexto
La API guarda eventos inmutables (intentos del Quiz, ADR-0007), calcula agregados (por mano y por día en una zona
horaria), reemplaza rangos con concurrencia optimista (ADR-0013) y lee un catálogo. El dominio no puede depender de
JPA (ADR-0005), así que un ORM obligaría a mantener entidades además del dominio sin aportar nada a ese uso.
Además, la inmutabilidad de los intentos solo estaba garantizada por convención de código.

## Decisión
- **Spring JDBC (`JdbcClient`) con SQL explícito** en los adaptadores de salida. Sin JPA/Hibernate ni Spring Data.
- **Concurrencia optimista en una sentencia:** `UPDATE … WHERE version = :v`; 0 filas → 409.
- **Integridad en el esquema:** claves foráneas a (situación, stack) y (situación, acción) y `CHECK` del patrón de mano.
  La base de datos rechaza lo que el dominio ya rechaza (defensa en profundidad).
- **Dos roles:** `spin_migrator`, dueño del esquema `app`, solo lo usa Flyway; `spin_app`, el de ejecución, con
  permisos mínimos: `SELECT` en catálogo y rangos de referencia, lectura y escritura en rangos de usuario,
  `INSERT` + `SELECT` en `quiz_attempt` (sin `UPDATE` ni `DELETE`). Los roles y sus contraseñas se crean fuera de
  Flyway (script por entorno); las migraciones solo conceden permisos.
- Un test de integración verifica la matriz de permisos contra Postgres real (Testcontainers).

## Consecuencias
Más SQL escrito a mano, probado contra el mismo motor que producción. La inmutabilidad de los intentos la impone la
base de datos, no solo el código; un `GRANT` olvidado en una tabla nueva lo detecta un test.
