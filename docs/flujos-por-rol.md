# Flujos por rol — CoachNexus

Qué puede hacer cada rol dentro de la plataforma, organizado por vista/módulo. Los 3 roles son **Coach**, **Coachee** y **Empresa**; todos pasan por un cambio de contraseña obligatorio en el primer login (`/cambiar-password`).

---

## Coach

### Búsqueda global y atajos
- Buscador en el menú lateral (combobox accesible): busca coachees, empresas, competencias y recursos. **Ctrl/Cmd + K** lo enfoca desde cualquier pantalla; flechas + Enter para elegir, Escape para cerrar.
- Elegir un coachee abre su ficha; elegir una empresa abre su editor en Empresas (`/coach/empresas?id=…`).

### Panorama (`/coach/dashboard`) — es el home del coach tras el login
- Si falta algo, tarjeta **"Primeros pasos"** (empresa → coachee → ciclo → plan → sesión), calculada con datos reales y descartable.
- Si alguna carga secundaria falla, un aviso lo dice (y permite reintentar) en vez de mostrar "todo al día" falso; si fallan las cargas críticas se muestra un error con **Reintentar**.
- **Atención inmediata**: sesiones sin confirmar (hoy/mañana), contratos por vencer sin gestión (botón Gestionar → historial de renovación) y pagos pendientes.
- KPIs (horas de la semana, empresas por renovar, ingreso esperado, empresas sin fecha de contrato), **Esta semana** (sesiones agrupadas por día), **Cartera de empresas** con semáforo y proyección económica.
- Pestañas de pendientes: coachees que necesitan algo (con recordatorios de sesión/progreso/plan por correo), empresas con contrato/NDA pendiente, solicitudes comerciales, prospectos con seguimiento vencido.
- Buscador aproximado de coachees (tolera errores de tipeo y tildes).

### Mi agenda (`/coach/agenda`)
- Calendario semanal con todas las sesiones; crear sesión (suelta o **serie** semanal/quincenal/mensual/personalizada), reagendar (modal o arrastrando; si es de una serie, elegir si aplica a las futuras) y cancelar.
- **Solicitudes de sesión pendientes** de los coachees: aprobar o rechazar con mensaje opcional.
- Disponibilidad semanal: bloques por día que ven los coachees para pedir hora.

### Prospectos (`/coach/prospectos`)
- Pipeline de negocio aún sin firmar (empresa o persona): filtrar por etapa/fuente, crear, editar, eliminar.
- **Gestionar** (bitácora con próximo seguimiento), **Ganado** (convierte en Empresa o Coachee y lleva a la entidad creada) y **Perdido**.

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

### Negocio — pestaña Resumen (`/coach/negocio`)
- Ver KPIs: horas realizadas del mes, ingreso del período, ingreso proyectado, coachees activos, satisfacción promedio.
- Ver alertas: ciclos por vencer, coachees sin logros recientes, coachees sin próxima sesión (cada una lleva a la pestaña Sesiones del coachee).
- Ver avance promedio por área/gerencia (gráfico de barras).
- Por empresa: marcar pagada, editar horas contratadas.
- Exportar a Excel y exportar/imprimir el panel completo en PDF.

### Legal y auditoría — Contratos y Privacidad (`/coach/legal`, pestañas `?tab=`)
- Por empresa: estado del contrato/NDA (pendiente/firmado), fecha, vigencia.
- Ver consentimiento informado (X de Y) por empresa y por coachees independientes; marcar/desmarcar cada uno.
- Ver panel de cumplimiento LPDP (checklist de solo lectura).

### Legal y auditoría — Auditoría (`/coach/legal?tab=auditoria`; `/coach/auditoria` redirige)
- Ver bitácora de auditoría del sistema (fecha, acción, destino), con filtros por texto de acción y por coachee/ID.

### Negocio — pestaña Comercial (`/coach/negocio?tab=comercial`; `/coach/comercial` redirige)
- Ver solicitudes de nuevos procesos enviadas por empresas; marcar como **atendida**.
- Ver procesos cerrados; botón directo "Abrir nuevo proceso con [coachee]" → pestaña Ciclo de ese coachee.

### Empresas (`/coach/empresas`)
- Listar/buscar/filtrar por nombre, estado (activa/inactiva), rango de fecha de creación; ordenar por columna.
- Crear empresa (nombre + tarifa/hora, en CLP o UF) → aparece el atajo **"Crear coachee de esta empresa"**.
- Editar empresa (nombre, tarifa/hora, horas contratadas, pagada).
- Activar/desactivar (con confirmación) y eliminar (con confirmación).

### Coachees (`/coach/coachees`)
- Listar/buscar/filtrar por nombre/email, empresa, estado, rango de fecha de creación; ordenar por columna. Filtros, página y orden viven en la URL: al volver desde la ficha se restauran.
- Sin coachees: estado vacío con **Crear primer coachee**.
- Crear coachee (nombre + email obligatorios; empresa opcional o "Independiente"; cargo, jefe directo, objetivo, tarifa propia, área/gerencia, número de sesiones del proceso) — crea el login automáticamente y **envía el correo de bienvenida con contraseña temporal** (la contraseña ya no se muestra en pantalla). Los errores de validación aparecen junto a cada campo.
- Editar coachee (mismos campos, sin email).
- Activar/desactivar (bloquea/desbloquea el login sin perder datos) y eliminar.
- Ver coachee → entra al detalle.

### Herramientas (`/coach/herramientas`)
- Quiz, flashcards, mapas mentales, ejercicios y test de estilo del coach (selector por tarjetas, `?tab=`).

### Configuración (`/coach/configuracion`)
- Catálogos parametrizables (grupo / clave / valor / estado), p. ej. fuentes de prospecto: crear, editar, activar/desactivar y eliminar sin necesidad de un despliegue.

### Mi perfil (`/coach/perfil`)
- Perfil profesional que ven coachees y empresas (foto, bio, metodología, certificaciones, contacto, CV).

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

Todas las pantallas cargan con reintento: si una llamada falla se muestra un aviso con **Reintentar**, y si solo fallan los datos de algunas personas se indica "No pudimos cargar datos de N personas; los indicadores pueden estar incompletos" (esas personas no se presentan como "al día").

### Resumen (`/empresa/dashboard`)
- Indicadores: procesos terminados/en curso, tasa de asistencia y satisfacción promedio (con color según los mismos umbrales que el avance).
- **Necesita tu atención**: personas con sesiones pendientes sin agendar o ciclo por vencer; cada fila es un enlace que abre el progreso de esa persona en Coachees.
- Nota **"Qué ve tu empresa y qué no"** y glosario (ciclo, tasa de asistencia, avance, niveles de competencia).
- Mi contrato (horas, tarifa, estado de pago — registrado por el coach —, término), Finanzas (mes/semestre/año, ejecutado vs agendado), Tendencia de 6 meses, últimos impactos en el negocio, distribución por departamento y competencias trabajadas (contratadas vs trabajadas).

### Mis coachees (`/empresa/coachees`)
- Lista de coachees de la empresa en pestañas **Activos** / **Procesos cerrados**, con buscador por nombre y filtro "Solo con alertas".
- Activos: avance, sesiones realizadas/total, próxima sesión, avisos (sin sesión agendada, ciclo por vencer), progreso y documentos del proceso (compartidos con coach y coachee).
- Cerrados: resultado, fechas, historial de ciclos, certificado (vista previa y **Imprimir / Guardar como PDF**) y feedback del coachee al cierre.
- Todo en solo lectura salvo subir documentos del proceso: la empresa no edita sesiones, planes ni contenido del ciclo.
- Qué ve la empresa: avance general, sesiones realizadas y próxima agendada, objetivo del plan, resultado, feedback e impacto en el negocio al cierre, documentos compartidos. Qué no ve: notas privadas del coach, detalle de cada sesión, diario/mapas/pizarra del coachee.

### Finanzas (`/empresa/finanzas`)
- Cabecera de reporte (logo, empresa, "Emitido el …") e **Imprimir / Guardar como PDF** (usa la impresión del navegador; no hay selector de período).
- Este mes (gasto, horas consumidas/contratadas, estado de pago registrado por el coach, monto pendiente), gasto por coachee, proyección mensual/semestral/anual de lo ya agendado y retorno de la inversión por proceso cerrado. Selector CLP/UF.

### Informe ejecutivo (`/empresa/informe`)
- Informe imprimible (mismos criterios de impresión): indicadores, tendencia, retorno de la inversión (con distribución de resultados) y resumen financiero. Si falla la carga de cualquier fuente se muestra el error en vez de un informe parcial.

### Satisfacción y procesos (`/empresa/satisfaccion`)
- Encuesta de satisfacción por proceso cerrado (categorías 1–5 + comentario opcional) y solicitud de un nuevo proceso (nombre sugerido + mensaje); el estado (pendiente/atendida) se refleja de vuelta. Si no se pudieron revisar los procesos de alguna persona se avisa.

### Competencias (`/empresa/competencias`)
- Crear, editar y eliminar las competencias propias de la empresa con sus niveles; el coach las ve y elige cuál desarrollar en cada coachee.

### Mi Coach (`/empresa/coach`)
- Perfil real del coach (foto, bio, metodología, certificaciones, contacto, CV), en solo lectura.

### Certificado (`/empresa/coachees/:coacheeId/ciclos/:cicloId/certificado`)
- Certificado imprimible de un ciclo cerrado con resultado, con la marca CoachNexus; **Imprimir / Guardar como PDF**.

---

## Flujos cruzados entre roles

- **Aprobación del plan de desarrollo**: coachee arma el plan → lo envía → el coach lo revisa en el detalle del coachee → aprueba o solicita cambios con comentario, que vuelve a aparecer en la vista del coachee.
- **Post-sesión**: el coach agenda la sesión → aparece para el coachee → el coachee completa y publica el post-sesión → la recomendación y los temas propuestos vuelven a aparecer para el coach; asistencia y notas privadas son exclusivas del coach.
- **Ciclo de coaching**: el coach abre el ciclo, escribe resumen/informe y lo cierra con un resultado → esto habilita el certificado del coachee, aparece en la vista (solo lectura) de la empresa, y queda listado como "proceso cerrado" en Gestión comercial con acceso directo para abrir uno nuevo.
- **Solicitudes comerciales**: la empresa pide un nuevo proceso → el coach lo ve como pendiente y lo marca "atendida", lo que actualiza el estado visible para la empresa.
- **Correos de acceso**: crear un coachee, crear una cuenta Empresa, o restablecer cualquier contraseña dispara un correo real con contraseña temporal y link de acceso; quien lo recibe queda forzado a cambiar la contraseña en su primer login.
- **Recursos**: el coach crea y asigna recursos a coachees puntuales; lo asignado (o autoagregado) aparece en "Mi biblioteca" del coachee, y los "aprendizajes" privados que el coachee registra por recurso los puede ver el coach (no editarlos).
- **Consentimiento informado**: el mismo estado se puede marcar tanto desde la pestaña Perfil del detalle de coachee como en bloque desde la vista Legal.
- **Prospecto → cliente**: al marcar un prospecto como ganado se crea la Empresa o el Coachee y el coach aterriza directamente en esa entidad.
- **Empresa → primer coachee**: tras crear una empresa, el atajo "Crear coachee de esta empresa" abre el alta con la empresa ya elegida.

## Notas de alcance (funcionalidad de backend sin UI expuesta)

- **Reagendamiento de sesiones**: sí tiene UI. El coachee solicita reagendar desde "Mis sesiones" (y ve el estado de su solicitud; no puede duplicar una pendiente); el coach responde en la pestaña Sesiones del detalle del coachee, y además puede reagendar directamente desde Mi agenda o el detalle (modal o arrastrando en el calendario).
- **Autogestión de contacto del coachee** (`PATCH /coachees/me/contact`): el backend lo permite, pero el coach solo lo ve en modo lectura en la pestaña Perfil — no hay un formulario en el frontend donde el propio coachee lo edite.
