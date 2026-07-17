# Plataforma de Coaching Ejecutivo — Fernando Ramos

**Estado del proyecto al 15 de julio de 2026**

Este documento resume todo lo construido hasta ahora: identidad de marca, la landing page pública, el prototipo interactivo de la plataforma (con sus 3 roles), la arquitectura de datos, y los pendientes para seguir avanzando.

---

## 1. Identidad de marca

- **Nombre elegido:** Coach Fernando Ramos (usuario/dominio sugerido: `coachfernandoramos`).
- **Relación con SaltUp:** Fernando es socio fundador de SaltUp, su consultoría en ejecución estratégica. Se decidió un **punto medio** entre marca personal y marca corporativa:
  - El día a día (botones, progreso, estados de éxito) mantiene la calidez de la marca personal: verde salvia `#6B8F71`, bronce `#B08D57`, tinta casi negra `#121212`, pergamino `#F1EBDD`.
  - SaltUp queda presente como guiño institucional explícito: el **isotipo real de SaltUp** (extraído del brochure corporativo, fondo transparente) en el header de la plataforma y en el nav de la landing; la **foto real de Fernando** (también extraída del brochure) con un borde turquesa SaltUp (`#03B3AC`) como "sello" de la casa matriz; y la mención "Parte de **SaltUp**" en el footer de la landing.
  - Tipografía: **Poppins** (títulos, geométrica y limpia) + Inter (cuerpo/datos) + IBM Plex Mono (cifras, horas, códigos).
- **Elemento visual firma:** "anillos de proceso" — tres círculos concéntricos que representan las etapas del método: **Diagnóstico → Desarrollo → Consolidación**. Se usan como indicador de fase por coachee en toda la plataforma y en el hero de la landing.

---

## 2. Landing page pública

**Archivo:** `landing-coachfernandoramos.html`

Página de una sola vista con la identidad visual descrita arriba y contenido real (no texto de relleno):

- **Nav** con el isotipo de SaltUp + nombre, anclas a cada sección, CTA "Agenda sesión gratuita".
- **Hero** con los anillos de proceso como gráfico central y CTA doble.
- **"Te ayudo a"** — 7 puntos de valor.
- **"Sobre mí"** — bio con la fotografía real de Fernando, credenciales (MBA U. de Chile, Coach Ejecutivo PUC, Ingeniero Comercial UCN, Lean Six Sigma Oro) y la mención "Socio fundador de SaltUp".
- **Servicios** — 6 tarjetas de oferta.
- **Proceso** — las 3 fases del método, con enlace a la plataforma (pendiente de apuntar al dominio final).
- **Testimonios** reales de clientes.
- **CTA final y contacto** — WhatsApp con mensaje precargado, botón flotante, email.
- **Footer** con enlace a `saltup.cl`.

**Pendiente de su parte:** confirmar correo de contacto definitivo, decidir si se agregan logos reales de empresas clientes.

---

## 3. Plataforma (prototipo interactivo)

**Archivo:** `coaching-platform-prototype.jsx`

Prototipo funcional en React con **3 vistas de rol** (Coachee, Empresa, Coach), seleccionables desde un switcher en el header.

### 3.1 Arquitectura de datos

- Todo vive en **un solo Context de React** (`CoachingContext`), fuente única de verdad compartida entre las 3 vistas. El Context expone: `coachees` + `updateCoachee()`, `sesionesAgenda` + su setter, `historialCambios` + `registrarCambio()` (auditoría), `solicitudesReagendamiento` + funciones para crearlas/responderlas, y un sistema de **toast** (`mostrarToast()`) para confirmaciones visuales en toda la plataforma.
- **6 "empresas"**: Andes Minerals, Viña del Sur, Banco Cordillera, Retail Express, Salud Integral, e **Independientes** (coachees que llegan por sus propios medios, sin empresa patrocinadora — mismo flujo que el resto, pero sin jefatura ni contrato corporativo). Cada coachee puede tener una **tarifa propia** (`tarifaPropia`) que prevalece sobre la tarifa de su empresa — clave para independientes que negocian su propio precio.
- ~34 coachees en total: 3 fichas manuales ricas (María Fernanda Soto, Rodrigo Peña, Camila Rojas) + Ignacio Prieto (primer independiente) + el resto generado programáticamente con datos variados y realistas.
- Fecha de referencia del prototipo: **10 de julio de 2026**, hora de referencia simulada: **11:20**.
- `avanceRealDe(coachee)` — función única que concilia el "avance general" en toda la plataforma: si el coachee ya se autoevaluó, ese valor manda en todas las vistas (antes podían mostrarse números distintos según quién mirara).
- `calcularResumenCobros()` — cálculo único de cobros por empresa, usado tanto en el Panel de Negocio del Inicio del coach como en la pestaña Negocio, para que ambos siempre muestren las mismas cifras.

### 3.2 Módulo Coachee

**Inicio** — reorganizado en dos niveles con separador visual "Tu contexto":
- Nivel 1 (urgente): saludo + etapa del proceso, botón **"Entrar"** a la videollamada (se agranda solo cuando la sesión está realmente activa — ventana de 10 minutos antes hasta 90 después —, y usa el enlace específico que el coach configuró para esa sesión), recordatorio, tareas pendientes del plan de ejecución (ordenadas de más antigua a más reciente, con link directo a Plan de desarrollo), temas propuestos para la próxima sesión.
- Nivel 2 (contexto): sesiones completadas, **avance general** (calculado desde su propia autoevaluación de "qué tan cerca sientes que estás de tu objetivo", escala 1-10 → %), estado del plan, objetivo vigente (competencia + objetivo general, sin porcentaje), y "Mi contacto" (teléfono/email que el propio coachee ingresa y controla).

**Plan de desarrollo** — con sub-pestañas internas:
- *Definición*: competencia, nivel objetivo, nivel actual, plazo, recorrido de nivel, descripción del estado actual, objetivo general, objetivos específicos. Las partes que requieren aprobación del coach (competencia, nivel objetivo, objetivo general, objetivos específicos) quedan bloqueadas al enviarse, hasta que el coach aprueba o solicita cambios.
- *Hábito y ejecución*: marco de hábito (Cuándo / En vez de / Voy a + Obvio / Sencillo / Atractivo / Satisfactorio) y plan de ejecución (cada actividad vinculada a un objetivo específico primario).
- *Formación*: libros, artículos, videos, podcasts.

**Sesiones**:
- "Próximas sesiones" con botón **"Solicitar reagendamiento"** al lado — despliega un mini calendario de las próximas sesiones agendadas para elegir cuál reagendar, con motivo opcional. La solicitud llega al coach, quien puede enviar opciones de disponibilidad o proponer una nueva fecha directamente (que actualiza el calendario real).
- **Post-sesión**: por cada sesión ya realizada (numerada, de la más reciente a la primera, inmutable una vez publicada) se registra un aprendizaje principal; además, evaluación de utilidad (1-5), evaluación de "qué tan cerca estás de tu objetivo" (1-10, alimenta el avance general), recomendación libre para el coach ("Mi recomendación para seguir mejorando el proceso de coaching es..."), y temas propuestos para la próxima sesión.

**Recursos** — biblioteca personal: solo los recursos que el coach le asignó específicamente (o que él mismo se asignó desde la biblioteca general).

**Diario y logros** (pestaña fusionada) — diario de reflexión persistente (con botón Guardar y confirmación), registro de logros, y autoevaluación periódica.

**Certificado final** — se activa al completar el ciclo.

### 3.3 Módulo Empresa

Vista de ejemplo: Andes Minerals (hardcodeado, simula el login de esa empresa).

**Inicio**:
- Header con nota de confidencialidad **arriba** (ya no al final): las notas de sesión nunca son visibles para la empresa.
- Exportar reporte (PDF real vía impresión del navegador, Excel real vía SheetJS) y botón "Imprimir reporte ejecutivo" (una página, formato imprimible).
- KPIs: procesos terminados, en curso, tasa de asistencia (98%), satisfacción promedio.
- Distribución por departamento, competencias trabajadas (con clic para ver qué coachees trabajan cada una), alerta de ciclos por vencer.
- **Facturación** integrada como widget (ya no pestaña aparte): descarga de última factura + historial de pagos.

**Procesos activos** — toggle Tarjetas / Lista. Cada proceso muestra competencia trabajada, objetivo, jefe directo, resumen de reunión inicial, historial de ciclos.

**Procesos cerrados** — resultado del proceso (Logrado / Medianamente logrado / No logrado), informe final expandible, y botón **"Abrir nuevo proceso con [nombre]"** que despliega el formulario de apertura pre-orientado a ese mismo coachee.

**Encuestas y solicitudes** — encuesta de satisfacción + solicitud de nuevo proceso.

### 3.4 Módulo Coach

**Inicio** — reordenado por prioridad: botón de sesión activa, **alertas de seguimiento** y **planes pendientes de aprobación** primero (lo accionable), **Panel de negocio** después (lo informativo) — con las mismas cifras que la pestaña Negocio (ingresos del mes = sesiones realmente realizadas este mes × tarifa, solo empresas marcadas como pagadas).

**Coachees** — con sub-vista Activos/Cerrados y filtro por empresa. La ficha de cada coachee tiene sub-pestañas:
- *Perfil*: contacto (solo lectura — lo ingresa el coachee) y resumen de reunión inicial (solo lo redacta el coach).
- *Plan y progreso*: historial de aprendizajes de sesión y recomendaciones que el coachee dejó para el coach; evaluación promedio del proceso según sesiones transcurridas.
- *Recursos*: recursos asignados a ese coachee.
- *Informes*: generador de borrador de informe final.

**Calendario**:
- "Tus próximas 3 sesiones" arriba, seguido de **solicitudes de reagendamiento** pendientes (con las dos formas de responder), seguido del calendario.
- Toggle **Mes / Semana** — la vista semanal muestra las horas como filas (08:00–19:00) y los 7 días como columnas.
- Cada sesión tiene su propio **enlace de videollamada editable** (se actualiza automáticamente en el botón "Entrar" del coachee).
- Búsqueda global (coachees, empresas, competencias, recursos) fija arriba de todas las secciones.

**Recursos y plantillas** — biblioteca con buscador y **asignación directa a un coachee** desde cada tarjeta de recurso (selector + botón "Asignar"), más plantillas reutilizables de plan de desarrollo.

**Negocio** — horas contratadas vs. consumidas por empresa (con satisfacción promedio de cada una, mostrada con estrella), cobros por empresa, módulo SII, cuenta de depósito.

**Legal y auditoría** — con sub-pestañas:
- *Contratos*: estado de contrato y NDA por empresa.
- *Privacidad*: medidas de cumplimiento con la Ley de Protección de Datos Personales (notas de sesión privadas, contacto autogestionado, consentimiento informado por coachee).
- *Auditoría*: historial de cambios — quién editó qué y cuándo (aprobaciones de plan, asignación de recursos, calificación de procesos).

### 3.5 Ajustes transversales

- **Patrón de sub-pestañas** replicado en Plan de Desarrollo, ficha de coachee del coach, y Legal y Auditoría — mismo lenguaje visual para pantallas con mucho contenido.
- **Sistema de toast** (confirmaciones de guardado) en diario, aprendizajes, recomendaciones y contacto.
- Cierre con tecla Escape en el modal de detalle de sesión.
- Vocabulario unificado: "Aprendizajes de sesión" en ambos roles (antes tenía nombres distintos según la pantalla).
- Densidad para celular en toda la plataforma.
- Código muerto eliminado (funciones y mapas que quedaron sin uso tras iteraciones anteriores).
- Todo el archivo se verifica con un compilador (Babel) después de cada bloque de cambios.

---

## 4. Archivos entregados hasta ahora

| Archivo | Contenido |
|---|---|
| `landing-coachfernandoramos.html` | Landing page pública |
| `coaching-platform-prototype.jsx` | Prototipo interactivo de la plataforma (3 roles) |
| `appcoaching.md` | Este documento de estado |

---

## 5. Pendientes / próximos pasos sugeridos

### 1. Backend real
Hoy todo es un prototipo con datos de ejemplo en memoria (sin persistencia real ni cuentas de usuario). Falta: base de datos real, autenticación, multi-tenant real (hoy la vista Empresa solo muestra "Andes Minerals" fijo), y conectar a proveedores reales: videollamada (hoy el enlace es configurable pero no valida que sea una URL real de Zoom/Meet/Jitsi), Webpay, SII, y envío real de WhatsApp/Email/SMS detrás de las alertas.

### 2. Experiencia de usuario
- **Onboarding / estados vacíos**: qué ve un coachee o una empresa nueva el primer día.
- **Validación de formularios**: teléfono, email, montos y enlaces no validan formato todavía.
- **Post-sesión como flujo guiado**: hoy todas las preguntas (aprendizaje, utilidad, cercanía al objetivo, recomendación, temas) se muestran juntas; podría convertirse en un flujo de una pregunta a la vez.

### 3. Negocio y legal (fuera del código, pero importante)
- **Contratos y acuerdos de confidencialidad reales** entre Fernando, los coachees y las empresas — la plataforma ya los referencia (sección Legal), pero no reemplaza el respaldo legal real.
- **Cumplimiento con la Ley de Protección de Datos Personales en Chile** — la plataforma ya declara las medidas que aplica, pero falta la política de privacidad formal y los protocolos de acceso/eliminación de datos.
- **Independientes**: hoy comparten el mismo modelo de contrato/NDA "por empresa" que las compañías reales; si crece, conviene trackear su acuerdo de forma individual.

### 4. Cosas menores, "nice to have"
- Búsqueda global — hoy cubre coachees/empresas/competencias/recursos; podría extenderse a otras entidades.
- Auditoría — hoy registra solo un puñado de acciones clave; podría ampliarse a más eventos.
- Encuestas y Solicitudes (Empresa) podrían separarse en pestañas propias si el volumen de cada una crece.

### 5. Conectar el botón "Ingresar a la plataforma"
De la landing page con el dominio/login real, una vez esté definido.
