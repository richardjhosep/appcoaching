# Plataforma de Coaching Ejecutivo — Fernando Ramos

**Estado del proyecto al 13 de julio de 2026**

Este documento resume todo lo construido hasta ahora: decisiones de marca, la landing page pública, el prototipo interactivo de la plataforma (con sus 3 roles), la arquitectura de datos, y los pendientes para seguir avanzando.

---

## 1. Identidad de marca

- **Nombre elegido:** Coach Fernando Ramos (usuario/dominio sugerido: `coachfernandoramos`, preferido sobre `fernandoramoscoach` por sonar más natural como forma de referirse a él y por ser el patrón habitual en el rubro).
- **Recomendación de dominio:** separar la plataforma de coaching de la web de la consultora, ya que hablan a audiencias distintas y una plataforma de coaching necesita sentirse personal, no un servicio más del catálogo.
- **Paleta de color:**
  - Tinta profunda `#16232E` (fondo oscuro / marca)
  - Pergamino `#F1EBDD` (texto sobre fondo oscuro)
  - Marfil `#FBF9F4` (fondo general)
  - Salvia `#6B8F71` (color de crecimiento/avance — usado en progreso, aprobaciones, éxito)
  - Bronce `#B08D57` (acento cálido, uso restringido — alertas suaves, énfasis)
  - Línea `#E4DCC9` (bordes)
- **Tipografía:** Fraunces (títulos, con carácter), Inter (cuerpo y datos), IBM Plex Mono (cifras, horas, códigos).
- **Elemento visual firma:** "anillos de proceso" — tres círculos concéntricos que representan las etapas reales del método de coaching: **Diagnóstico → Desarrollo → Consolidación**. Se usa tanto en la plataforma (indicador de fase por coachee) como en el hero de la landing page, para que ambas piezas se sientan como una sola marca.

---

## 2. Landing page pública

**Archivo:** `landing-coachfernandoramos.html`

Página de una sola vista, construida con la identidad visual descrita arriba, con contenido real extraído del CV y del documento de coaching de Fernando (no texto genérico de relleno). Incluye:

- **Nav** con anclas a cada sección y CTA "Agenda sesión gratuita".
- **Hero** con los anillos de proceso como gráfico central (en vez de una foto de stock) y CTA doble: agendar sesión / ver cómo funciona el proceso.
- **"Te ayudo a"** — 7 puntos de valor (acelerar desarrollo, liderazgo transformador, resultados estratégicos, gestión de equipos, ejecución con excelencia, toma de decisiones, iniciativas de alto impacto).
- **"Sobre mí"** — bio basada en 20 años de experiencia directiva (L'Oréal, Grupo Ramos en República Dominicana, Tottus, Easy, Construmart), credenciales (MBA U. de Chile, Coach Ejecutivo PUC, Ingeniero Comercial UCN, Lean Six Sigma Oro), y un marco reservado para su fotografía profesional real (aún no incorporada).
- **Servicios** — 6 tarjetas: coaching individual, mentoría ejecutiva, programas para equipos, talleres, facilitación estratégica, acompañamiento en cambio.
- **Proceso** — las 3 fases del método, más un bloque que conecta con la plataforma ("Ingresar a la plataforma", pendiente de enlazar al dominio final).
- **Testimonios** reales de clientes (citados tal como los proporcionó Fernando).
- **CTA final y contacto** — botón de WhatsApp con mensaje precargado, botón flotante de WhatsApp, email de contacto.

**Pendiente de su parte:** fotografía profesional, confirmar correo de contacto definitivo, decidir si se agregan logos reales de empresas.

---

## 3. Plataforma (prototipo interactivo)

**Archivo:** `coaching-platform-prototype.jsx`

Prototipo funcional en React con **3 vistas de rol** (Coachee, Empresa, Coach), seleccionables desde un switcher en el header, pensado para validar la experiencia antes de construir el backend real.

### 3.1 Arquitectura de datos

- Toda la información vive en **un solo Context de React** (`CoachingContext`), que es la fuente única de verdad compartida entre las 3 vistas. Cualquier edición hecha en una vista (por ejemplo, el coach aprueba un plan, o agenda una sesión) se refleja automáticamente en las demás — ya no hay datos aislados por vista.
- El Context expone: `coachees` (arreglo con todos los datos de cada coachee) + `updateCoachee()`, y `sesionesAgenda` (calendario compartido) + su setter.
- Datos de ejemplo cargados: 3 coachees — María Fernanda Soto y Rodrigo Peña (Andes Minerals), Camila Rojas (Viña del Sur) — en distintas etapas del proceso para mostrar variedad (en curso, finalizado, recién iniciado).
- Diseñado como demo: la fecha de referencia del prototipo es el **10 de julio de 2026**.

### 3.2 Módulo Coachee

- Header con etapa del proceso (anillos), próxima sesión.
- **Botón "Unirse a la sesión"** — se activa (con indicador pulsante) si hay una sesión agendada para hoy; si no, muestra "No tienes sesión activa hoy". (Simulado: aún no conectado a un proveedor real de videollamada).
- Recordatorio automático de próxima sesión.
- Objetivos activos y contador de sesiones completadas.
- **Línea de tiempo de progreso** — gráfico de evolución del nivel de competencia sesión a sesión.
- **Resumen de sesiones** — síntesis que el coach comparte al cierre de cada sesión (distinto de sus notas privadas).
- **Post-sesión** (nuevo): registro de aprendizajes principales, evaluación de utilidad de la sesión (escala 1-5), y propuesta de temas para la próxima sesión.
- **Plan de desarrollo**, con dos zonas de edición diferenciadas:
  - *Requiere aprobación del coach*: competencia a desarrollar, nivel objetivo, objetivo general, objetivos específicos. Al enviarlo, queda bloqueado como "Pendiente de aprobación" hasta que el coach lo apruebe o solicite cambios (con comentario visible para el coachee).
  - *Libre edición del coachee*: nivel actual, plazo, descripción del estado actual, hábito a cambiar (marco Cuándo / En vez de / Voy a + Obvio / Sencillo / Atractivo / Satisfactorio), plan de ejecución, y plan de formación.
  - **Plan de ejecución**: cada actividad se vincula a **un único objetivo primario** (sin objetivos secundarios), mediante un selector.
- Registro de logros (bitácora de avances concretos).
- Autoevaluación periódica (mini encuesta de 3 preguntas).
- Solicitud de reagendamiento de sesión.
- Biblioteca de recursos — **muestra solo los recursos que el coach le asignó específicamente** (ya no la biblioteca completa).
- Aprendizajes prácticos de los recursos asignados.
- Diario de reflexión previo a la próxima sesión.
- Certificado y resumen final descargable (se activa al completar el ciclo).

### 3.3 Módulo Empresa

- Header con nota de confidencialidad (las notas de sesión nunca son visibles para la empresa).
- Alerta de ciclo por vencer (cuando quedan ≤2 sesiones).
- Exportar reporte (botones PDF/Excel, simulados).
- Por cada coachee, en formato de tarjeta (responsivo para celular, sin scroll horizontal):
  - Jefe directo, etapa del proceso, sesiones, avance, satisfacción.
  - Objetivo del proceso.
  - Historial de ciclos anteriores (expandible).
  - **Resumen de reunión inicial (RRHH + Jefe)** — de solo lectura para la empresa; lo carga exclusivamente el coach.
  - Si el proceso terminó: informe final subido por el coach (expandible) + selector de **resultado del proceso** (Logrado / Medianamente logrado / No logrado).
- Estadísticas generales: avance promedio, sesiones del mes, satisfacción promedio.
- Comparativa de avance por área/gerencia (gráfico de barras).
- Encuesta de satisfacción de la empresa sobre el servicio de coaching.
- Solicitud de nuevo proceso de coaching (formulario).

### 3.4 Módulo Coach

- Header con estadísticas generales (coachees, empresas, sesiones del mes).
- **Botón "Unirse a la sesión"** activa hoy (igual que en la vista del coachee).
- **Panel de negocio** (nuevo): horas realizadas del mes, ingresos del período (calculado desde el calendario de sesiones × tarifa por empresa), ingreso proyectado por sesiones ya agendadas, coachees activos, satisfacción promedio.
- Panel de alertas de seguimiento (coachees sin logros recientes, ciclos por cerrar, sesiones sin agendar).
- **Planes pendientes de aprobación** — lista de coachees con cambios propuestos al plan de desarrollo, con opción de aprobar o solicitar ajustes (con comentario).
- Lista de coachees con filtro por empresa, y ficha de detalle: sesiones, avance, satisfacción, notas privadas (nunca visibles para la empresa).
- **Asignar recursos** — checklist para activar/desactivar qué recursos de la biblioteca ve cada coachee específico.
- **Gestión de coachee — Contacto** (nuevo): teléfono celular y email, marcados como campos requeridos (con aviso si faltan), pensados para alertas de compromisos y agenda.
- **Resumen de reunión inicial** — el coach es el único que puede redactarlo/editarlo; la empresa solo lo visualiza.
- Generador de borrador de informe final (arma un primer texto desde los datos ya cargados del coachee, editable antes de subir).
- Calendario resumen de próximas sesiones: vista mensual + agenda cronológica de todos los coachees combinados (para ver disponibilidad de un vistazo), edición de horas, agregar/quitar sesiones.
- Plantillas reutilizables de plan de desarrollo (competencias frecuentes).
- Gestión de horas contratadas vs. consumidas por empresa.
- Biblioteca de recursos con buscador y filtro por etiqueta.

### 3.5 Ajustes transversales

- **Densidad para celular**: paddings, tipografías y layouts ajustados para pantallas angostas; la tabla de empresa se reemplazó por tarjetas apiladas (sin scroll horizontal).
- Todo el archivo fue verificado con un compilador (Babel) para confirmar que no tiene errores de sintaxis.

---

## 4. Archivos entregados hasta ahora

| Archivo | Contenido |
|---|---|
| `landing-coachfernandoramos.html` | Landing page pública |
| `coaching-platform-prototype.jsx` | Prototipo interactivo de la plataforma (3 roles) |
| `appcoaching.md` | Este documento de estado |

---

## 5. Pendientes / próximos pasos sugeridos

1. **Backend real**: hoy todo es un prototipo con datos de ejemplo en memoria (sin persistencia real ni cuentas de usuario). El siguiente paso natural es una base de datos real, autenticación, y conectar la videollamada a un proveedor real (Zoom/Meet/Jitsi).
2. **Fotografía profesional** de Fernando para la landing page.
3. **Confirmar tarifas reales por hora/empresa** (hoy son valores de ejemplo: Andes Minerals $45.000, Viña del Sur $40.000) para que el Panel de Negocio refleje ingresos reales.
4. **Definir quién puede editar qué** más allá del plan de desarrollo (por ejemplo, si el coachee debería poder cambiar libremente su propio teléfono/email, o si eso también queda solo en manos del coach).
5. **Onboarding / estados vacíos**: qué ve un coachee nuevo antes de tener sesiones, logros o plan cargado.
6. **Conectar el botón "Ingresar a la plataforma"** de la landing page con el dominio/login real una vez esté definido.
