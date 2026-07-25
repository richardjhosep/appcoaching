# Flujos por rol — CoachOS

Qué puede hacer cada rol dentro de la plataforma, organizado por vista/módulo. Los 3 roles son **Coach**, **Coachee** y **Empresa**; todos pasan por un cambio de contraseña obligatorio en el primer login (`/cambiar-password`).

---

## Coach

### Dashboard (`/coach/dashboard`)
- Ver KPIs: coachees activos, planes pendientes, ingreso del período (CLP), satisfacción promedio.
- Banner de bienvenida con acceso directo a Coachees si todavía no hay ninguno cargado.
- Pestañas de pendientes: planes pendientes / solicitudes comerciales pendientes / ciclos por vencer.
- Click en un plan pendiente → va a la pestaña Plan de ese coachee; click en un ciclo por vencer → va a la pestaña Sesiones.

### Planes de desarrollo (`/coach/planes`)
- Listar los planes de todos los coachees, filtrar por estado (sin enviar / pendiente de aprobación / cambios solicitados / aprobado / todos).
- Click en una fila → detalle del coachee, pestaña Plan.

### Detalle de coachee (`/coach/coachees/:id`) — 4 pestañas

**Perfil**
- Ver datos del proceso: empresa, jefe directo, área/gerencia, tarifa propia, objetivo del proceso.
- Ver datos de contacto (teléfono, email) autogestionados por el coachee (solo lectura).
- Marcar/desmarcar consentimiento informado (con fecha).

**Plan**
- Ver plan completo: nivel actual/objetivo, plazo, descripción del estado, objetivo general, objetivos específicos, hábito (cuándo/en vez de/voy a), actividades de ejecución con su estado.
- Si el plan está "pendiente de aprobación": **aprobar** o **solicitar cambios** (con comentario obligatorio que el coachee ve).

**Sesiones**
- Ver avance general (%) y línea de tiempo de progreso.
- Ver la última recomendación y temas propuestos del post-sesión publicado por el coachee.
- **Agendar sesión** (fecha/hora + link opcional de videollamada).
- En sesiones pasadas: marcar asistencia (asistió/no asistió/sin registrar) y escribir notas privadas (nunca visibles para el coachee ni la empresa).
- Ver logros del coachee (solo lectura).

**Ciclo e informes**
- **Abrir nuevo ciclo** (sesiones contratadas + resumen de reunión inicial opcional).
- Editar/guardar resumen de reunión inicial e informe final.
- **Generar borrador automático** del informe final.
- Subir informe final en PDF.
- **Cerrar ciclo** con un resultado (logrado / medianamente logrado / no logrado) → habilita el certificado del coachee y pasa el ciclo al historial (visible aquí, para la empresa y en Gestión comercial).
- Ver historial de ciclos anteriores.

### Recursos / biblioteca (`/coach/recursos`)
- Crear recurso (título, tipo link/archivo, URL o archivo, etiquetas, descripción).
- Eliminar recurso.
- Buscar por título / filtrar por etiqueta.
- Asignar o desasignar un recurso a coachees específicos.

### Panel de negocio (`/coach/negocio`)
- Ver KPIs: horas realizadas del mes, ingreso del período, ingreso proyectado, coachees activos, satisfacción promedio.
- Ver alertas: ciclos por vencer, coachees sin logros recientes, coachees sin próxima sesión (cada una lleva a la pestaña Sesiones del coachee).
- Ver avance promedio por área/gerencia (gráfico de barras).
- Por empresa: marcar pagada, editar horas contratadas.
- Exportar a Excel y exportar/imprimir el panel completo en PDF.

### Legal y auditoría — Legal (`/coach/legal`)
- Por empresa: estado del contrato/NDA (pendiente/firmado), fecha, vigencia.
- Ver consentimiento informado (X de Y) por empresa y por coachees independientes; marcar/desmarcar cada uno.
- Ver panel de cumplimiento LPDP (checklist de solo lectura).

### Legal y auditoría — Auditoría (`/coach/auditoria`)
- Ver bitácora de auditoría del sistema (fecha, acción, destino), con filtros por texto de acción y por coachee/ID.

### Gestión comercial (`/coach/comercial`)
- Ver solicitudes de nuevos procesos enviadas por empresas; marcar como **atendida**.
- Ver procesos cerrados; botón directo "Abrir nuevo proceso con [coachee]" → pestaña Ciclo de ese coachee.

### Empresas (`/coach/empresas`)
- Listar/buscar/filtrar por nombre, estado (activa/inactiva), rango de fecha de creación.
- Crear empresa (nombre + tarifa/hora).
- Editar empresa (nombre, tarifa/hora, horas contratadas, pagada).
- Activar/desactivar (con confirmación) y eliminar (con confirmación).

### Coachees (`/coach/coachees`)
- Listar/buscar/filtrar por nombre/email, empresa, estado, rango de fecha de creación.
- Crear coachee (nombre + email obligatorios; empresa opcional o "Independiente"; jefe directo, objetivo, tarifa propia, área/gerencia) — crea el login automáticamente y **envía el correo de bienvenida con contraseña temporal**; la credencial también se muestra en pantalla.
- Editar coachee (mismos campos, sin email).
- Activar/desactivar (bloquea/desbloquea el login sin perder datos) y eliminar.
- Ver coachee → entra al detalle.

### Usuarios (`/coach/usuarios`)
- Listar/buscar/filtrar todas las cuentas por email, rol, estado, rango de fecha.
- Crear cuenta tipo Empresa (email + empresa) — única forma de crear ese rol; también dispara el correo de contraseña temporal.
- Activar/desactivar y eliminar cualquier cuenta.
- Restablecer contraseña (genera y envía una nueva contraseña temporal, con confirmación).

---

## Coachee

### Mi plan de desarrollo (`/coachee/plan`) — 3 sub-pestañas

**Definición**
- Elegir/editar competencia a desarrollar, nivel actual (siempre editable), nivel objetivo, plazo, descripción del estado actual (siempre editable), objetivo general.
- Agregar/editar/eliminar objetivos específicos (lista ordenada).
- **Enviar plan para aprobación** (mientras no esté bloqueado). Al quedar "pendiente de aprobación", competencia/nivel objetivo/objetivo general/objetivos se bloquean hasta que el coach responda.

**Hábito y ejecución**
- Completar y guardar el marco de formación de hábito: Cuándo, En vez de, Voy a, y los campos obvio/sencillo/atractivo/satisfactorio.
- Agregar actividades ligadas a un objetivo (con inicio/fin opcional), cambiar su estado (pendiente/en curso/completada), eliminarlas.

**Formación**
- Completar y guardar libros, artículos, videos, podcasts y práctica guiada recomendados.

### Mis sesiones (`/coachee/sesiones`)
- Ver lista de sesiones propias (pasadas = "Realizada", futuras = "Programada"), ordenadas por fecha.
- En sesiones futuras: ver resumen y link de videollamada compartidos por el coach.
- En sesiones pasadas sin publicar: completar post-sesión (aprendizaje principal, utilidad 1–5, cercanía al objetivo 1–10, recomendación, temas propuestos para la próxima sesión).
  - Guardar como borrador (editable).
  - Publicar (queda inmutable y visible para el coach).
- En sesiones ya publicadas: ver el post-sesión propio en solo lectura.

### Mi progreso (`/coachee/progreso`)
- Ver avance general (%) calculado desde las autoevaluaciones de post-sesión.
- Ver línea de tiempo de cercanía al objetivo por sesión.
- Agregar/eliminar logros (fecha + descripción).
- Escribir y guardar diario de reflexión (con confirmación de guardado).
- Si algún ciclo cerró con resultado, acceder al certificado correspondiente.

### Biblioteca de recursos (`/coachee/biblioteca`)
- Dos pestañas: "Mi biblioteca" (recursos asignados o autoagregados) y "Catálogo general" (buscar por título entre todos los recursos).
- Agregar un recurso del catálogo a la propia biblioteca / quitarlo.
- Abrir recursos tipo link en una pestaña nueva o descargar los de tipo archivo.
- Por recurso: ver los propios "aprendizajes" registrados y agregar uno nuevo.

### Certificado (`/coachee/ciclos/:id/certificado`)
- Ver certificado imprimible de un ciclo cerrado (coach, coachee, objetivo general, resultado, fechas de apertura/cierre) — solo si el ciclo cerró con resultado.
- Descargar/imprimir y volver a Mi progreso.

---

## Empresa

### Mis coachees (`/empresa/coachees`)
- Ver la lista de coachees que pertenecen a la empresa.
- Click en un coachee → vista de Ciclo de ese coachee.

### Ciclo (`/empresa/coachees/:id/ciclo`)
- Por coachee: ver ciclo abierto actual (sesiones realizadas/total, resumen de reunión inicial escrito por el coach, aviso de "por vencer").
- Ver historial de ciclos cerrados.
- Todo en solo lectura: la empresa no edita sesiones, planes ni contenido del ciclo.

### Satisfacción y procesos (`/empresa/satisfaccion`)
- Ver KPIs: procesos terminados, procesos en curso, tasa de asistencia, satisfacción promedio.
- Enviar encuesta de satisfacción (calificación 1–5 + comentario opcional).
- Solicitar un nuevo proceso (nombre sugerido + mensaje opcional) — el coach la ve en Dashboard/Gestión comercial y su estado (pendiente/atendida) se refleja de vuelta acá.

---

## Flujos cruzados entre roles

- **Aprobación del plan de desarrollo**: coachee arma el plan → lo envía → el coach lo revisa en el detalle del coachee → aprueba o solicita cambios con comentario, que vuelve a aparecer en la vista del coachee.
- **Post-sesión**: el coach agenda la sesión → aparece para el coachee → el coachee completa y publica el post-sesión → la recomendación y los temas propuestos vuelven a aparecer para el coach; asistencia y notas privadas son exclusivas del coach.
- **Ciclo de coaching**: el coach abre el ciclo, escribe resumen/informe y lo cierra con un resultado → esto habilita el certificado del coachee, aparece en la vista (solo lectura) de la empresa, y queda listado como "proceso cerrado" en Gestión comercial con acceso directo para abrir uno nuevo.
- **Solicitudes comerciales**: la empresa pide un nuevo proceso → el coach lo ve como pendiente y lo marca "atendida", lo que actualiza el estado visible para la empresa.
- **Correos de acceso**: crear un coachee, crear una cuenta Empresa, o restablecer cualquier contraseña dispara un correo real con contraseña temporal y link de acceso; quien lo recibe queda forzado a cambiar la contraseña en su primer login.
- **Recursos**: el coach crea y asigna recursos a coachees puntuales; lo asignado (o autoagregado) aparece en "Mi biblioteca" del coachee, y los "aprendizajes" privados que el coachee registra por recurso los puede ver el coach (no editarlos).
- **Consentimiento informado**: el mismo estado se puede marcar tanto desde la pestaña Perfil del detalle de coachee como en bloque desde la vista Legal.

## Notas de alcance (funcionalidad de backend sin UI expuesta)

- **Reagendamiento de sesiones**: existen endpoints de backend para que el coachee solicite reagendar una sesión y el coach responda (`solicitudes-reagendamiento`), pero ninguna vista del frontend los expone todavía.
- **Autogestión de contacto del coachee** (`PATCH /coachees/me/contact`): el backend lo permite, pero el coach solo lo ve en modo lectura en la pestaña Perfil — no hay un formulario en el frontend donde el propio coachee lo edite.
