# Backups de Postgres

## Cómo funciona

El servicio `postgres-backup` en `docker-compose.yml` (imagen [`prodrigestivill/postgres-backup-local`](https://github.com/prodrigestivill/docker-postgres-backup-local)) corre un `pg_dump` programado contra la base `coaching` y escribe los archivos comprimidos en el volumen `postgres_backups`, con rotación automática:

- `SCHEDULE: "@daily"` — un backup por día.
- Retención: 7 diarios, 4 semanales, 6 mensuales (`BACKUP_KEEP_DAYS`/`BACKUP_KEEP_WEEKS`/`BACKUP_KEEP_MONTHS`).
- Los archivos quedan en `/backups/{daily,weekly,monthly,last}` dentro del volumen, con un symlink `*-latest.sql.gz` apuntando siempre al más reciente de cada categoría.

No se reinventó un script de backup propio: se eligió una imagen madura y de un solo propósito para esta tarea en vez de mantener cron + `pg_dump` a mano.

## Disparar un backup manual

```bash
docker exec appcoaching-postgres-backup-1 /backup.sh
```

## Restaurar en un entorno de prueba

1. Copiar el backup deseado fuera del volumen:
   ```bash
   docker cp appcoaching-postgres-backup-1:/backups/daily/coaching-latest.sql.gz ./coaching-backup.sql.gz
   ```
2. Crear una base de prueba separada (nunca restaurar sobre la base productiva):
   ```bash
   docker exec appcoaching-postgres-1 psql -U coaching -d postgres -c "CREATE DATABASE coaching_restore_test;"
   ```
3. Restaurar el dump:
   ```bash
   gunzip -c ./coaching-backup.sql.gz | docker exec -i appcoaching-postgres-1 psql -U coaching -d coaching_restore_test
   ```
4. Verificar integridad (comparar conteos de filas contra la base original) y luego eliminar la base de prueba:
   ```bash
   docker exec appcoaching-postgres-1 psql -U coaching -d postgres -c "DROP DATABASE coaching_restore_test;"
   ```

Este procedimiento se verificó en el Sprint 14: se generó un backup real, se restauró en `coaching_restore_test` y se confirmó que el conteo de `users` (32 filas) coincidía exactamente con la base original.
