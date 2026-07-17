# Plan de negocio y planificación ágil del MVP — Coach Fernando Ramos

Versión exportable (tablas planas) del plan aprobado en `tasks/todo.md`. Ver también el Artifact visual `docs/mvp-planning.html`.

Todos los supuestos (tarifa/hora, fecha de kickoff, velocity) están marcados explícitamente y son ajustables.

**Nota de alcance (actualizada):** los 3 roles (Coachee, Empresa, Coach) se mantienen completos en el MVP. Se confirmó que **ninguna integración real con servicios externos entra en el MVP**: sin Jitsi self-hosted, sin Webpay, sin SII, sin envío real de email/SMS/WhatsApp. Esas pantallas quedan simuladas (botón "Unirse" con ventana de tiempo y link editable a mano, alertas en pantalla), sin construir el backend de integración. A cambio, se incorpora al backlog la épica "Legal, auditoría y búsqueda global" (contratos/NDA, cumplimiento LPDP, historial de auditoría, búsqueda global) que ya existía en el prototipo más reciente (`coaching-platform-prototype_3.jsx`) pero no estaba desglosada. El desglose ejecutable de este backlog en épicas/historias de Jira vive en `docs/jira-plan.md` y `docs/jira-plan.csv`.

---

## 1. Business Model Canvas

La plataforma es una **herramienta privada** del proceso de coaching de Fernando Ramos — no un producto SaaS a la venta. El Canvas describe el negocio de coaching que la plataforma soporta.

| Bloque | Contenido |
|---|---|
| **Segmentos de cliente** | Empresas medianas/grandes que invierten en desarrollo de liderazgo ejecutivo (minería, retail, agroindustria — ej. Andes Minerals, Viña del Sur). Dentro de cada empresa hay dos audiencias: el *sponsor* (RRHH + jefatura directa, que paga y da seguimiento) y el *usuario final* (el ejecutivo/gerente coachee). |
| **Propuesta de valor** | Coaching ejecutivo 1:1 con metodología propia de 3 fases (Diagnóstico → Desarrollo → Consolidación) + trazabilidad digital del proceso (plan de desarrollo con aprobación, seguimiento de avance, informes) que da a la empresa visibilidad y confianza **sin** comprometer la confidencialidad de las sesiones — algo que un coach sin plataforma no puede ofrecer. |
| **Canales** | Landing page propia (`appcoaching.md`), venta directa/networking, referidos de empresas actuales, WhatsApp como canal de contacto inicial. |
| **Relación con clientes** | Acompañamiento personal y directo (Fernando es el único coach), reportes periódicos a la empresa, resumen de reunión inicial e informe final como puntos de contacto formales con RRHH/jefatura. |
| **Fuentes de ingreso** | Tarifa por hora de coaching, diferenciada por empresa (ej. Andes Minerals \$45.000/h, Viña del Sur \$40.000/h CLP). Posible ingreso adicional futuro por programas grupales/talleres (mencionado en la landing). |
| **Recursos clave** | Fernando Ramos (su tiempo y expertise — el cuello de botella real del negocio), la plataforma digital (diferenciador y herramienta de retención), biblioteca de recursos propia, metodología de 3 fases. |
| **Actividades clave** | Sesiones de coaching, seguimiento de planes de desarrollo, generación de informes/reportes a empresas, gestión de agenda y ciclos, mantenimiento y evolución de la plataforma. |
| **Alianzas clave** | Ninguna crítica para el MVP (servicio profesional independiente). A futuro: "champions" internos en RRHH de empresas cliente, o consultoras que refieran clientes nuevos. |
| **Estructura de costos** | Tiempo de Fernando (costo de oportunidad, no efectivo), desarrollo y mantenimiento de la plataforma (lo que se valoriza en la sección 4), hosting/infraestructura, eventualmente licencias de herramientas (email transaccional, storage). |

---

## 2. Roadmap de sprints (resumen)

- **Cadencia**: Sprints Scrum de 2 semanas.
- **Equipo base asumido**: 1 desarrollador full-stack senior, dedicación full-time (40h/semana ⇒ ~80h de capacidad por sprint).
- **Total estimado**: 14 sprints, ~28 semanas (~6,5 meses) para el MVP completo (3 roles).
- **Escenario alternativo**: con 2 desarrolladores en paralelo (1 backend + 1 frontend, coordinando por contrato de API), el calendario se reduce a **~16-18 semanas (~4 meses)**. El total de horas-persona no baja (950h de trabajo siguen siendo 950h, incluso +10% aprox. por overhead de coordinación) — lo que cambia es el tiempo de calendario, no el costo total.
- **Fechas de ejemplo**: asumen kickoff el **lunes 20 de julio de 2026**. Los sprints 12-13 caen sobre fin de año / vacaciones de verano en Chile — ajustar el calendario real si el kickoff efectivo cae cerca de esas fechas.

---

## 3. Backlog / Carta Gantt (detalle exportable)

Columnas mínimas para importar a Excel, ClickUp, MS Project o TeamGantt: `Sprint | Fecha inicio | Fecha fin | Épica | Historias clave | Story points | Horas | Dependencias`.

| Sprint | Inicio | Fin | Épica | Historias clave | Pts | Horas | Dependencias |
|---|---|---|---|---|---|---|---|
| 1 | 2026-07-20 | 2026-07-31 | Fundaciones técnicas | Monorepo, esqueleto Nest por capas, esqueleto Vue+Tailwind+tokens de marca, docker-compose base, CI lint/test/build | 5 | 40 | — |
| 2 | 2026-08-03 | 2026-08-14 | Autenticación y usuarios | Login, JWT access+refresh con rotación, RBAC, invitación por coach, audit log base, headers/rate-limit/CORS | 13 | 80 | Sprint 1 |
| 3 | 2026-08-17 | 2026-08-28 | Empresas y Coachees | CRUD de empresas y coachees, contacto requerido con aviso, provisión de cuentas | 8 | 60 | Sprint 2 |
| 4 | 2026-08-31 | 2026-09-11 | Sesiones y calendario | Calendario compartido, agendar/editar/quitar sesión, reagendamiento, separación resumen compartido / notas privadas | 13 | 80 | Sprint 3 |
| 5 | 2026-09-14 | 2026-09-25 | Plan de desarrollo — backend | Modelo de datos (objetivos con FK real, no índice de array), estados de aprobación, API de envío/aprobación/rechazo | 11 | 60 | Sprint 3 |
| 6 | 2026-09-28 | 2026-10-09 | Plan de desarrollo — frontend | Formularios, bloqueo de campos durante aprobación, hábito (Cuándo/En vez de/Voy a), plan de ejecución, plan de formación | 10 | 60 | Sprint 5 |
| 7 | 2026-10-12 | 2026-10-23 | Post-sesión y seguimiento | Aprendizajes, utilidad de sesión, temas propuestos, logros, autoevaluación, línea de progreso | 13 | 80 | Sprint 4, Sprint 6 |
| 8 | 2026-10-26 | 2026-11-06 | Biblioteca de recursos | CRUD de recursos, asignación N:N explícita coach→coachee, aprendizajes de recursos, subida a almacenamiento de objetos | 8 | 60 | Sprint 3 |
| 9 | 2026-11-09 | 2026-11-20 | Ciclos e informes — backend | Ciclos de coaching, generador de borrador de informe final, almacenamiento de PDFs | 11 | 60 | Sprint 6, Sprint 7 |
| 10 | 2026-11-23 | 2026-12-04 | Ciclos e informes — frontend | Certificado descargable, UI de informe final, resumen de reunión inicial (solo coach edita) | 10 | 60 | Sprint 9 |
| 11 | 2026-12-07 | 2026-12-18 | Panel de negocio y reportes | Ingresos del mes/proyectados, panel de alertas, comparativa por área, exportar reporte real (PDF/Excel, client-side, sin integración externa) | 13 | 80 | Sprint 9 |
| 12 | 2026-12-21 | 2027-01-01 | Legal, auditoría y búsqueda global ⚠ fin de año | Contratos/NDA por empresa (registro manual), cumplimiento LPDP, historial de auditoría, búsqueda global | 8 | 55 | Sprint 2 |
| 13 | 2027-01-04 | 2027-01-15 | Satisfacción y gestión comercial ⚠ vacaciones | Encuesta de satisfacción de empresa, solicitud de nuevo proceso, horas contratadas vs. consumidas | 5 | 40 | Sprint 10 |
| 14 | 2027-01-18 | 2027-01-29 | Hardening y cierre | Backups de Postgres, e2e (Playwright, 3 roles), revisión de headers/puertos expuestos, densidad celular, onboarding | 18 | 100 | Todas las anteriores |

**Totales**: 146 story points · 915 horas de desarrollo.

**Fuera de alcance del MVP** (confirmado con el usuario): videollamada real self-hosted (Jitsi), Webpay, SII/boletas automáticas, cuenta de depósito/payouts, envío real de email/SMS/WhatsApp. Ver desglose completo en `docs/jira-plan.md`.

---

## 4. Valorización del desarrollo

**Supuesto de tarifa**: rango de mercado para desarrollo full-stack freelance/agencia en Chile, **\$20.000 – \$35.000 CLP/hora** (ajustable — reemplazar por tarifa real si ya la tienen negociada).

| Escenario | Tarifa/hora | Horas totales | Costo total desarrollo (CLP) |
|---|---|---|---|
| Bajo | \$20.000 | 915 | **\$18.300.000** |
| Medio | \$28.000 | 915 | **\$25.620.000** |
| Alto | \$35.000 | 915 | **\$32.025.000** |

**Costos recurrentes de infraestructura** (no incluidos arriba, mensuales):

| Ítem | Estimado CLP/mes | Nota |
|---|---|---|
| VM (Docker Compose: nginx, backend, frontend, Postgres, Redis, MinIO) | \$30.000 – \$90.000 | Rango bajo = VPS económico (Hetzner/DigitalOcean, 2-4 vCPU/4-8GB); rango alto = equivalente en GCP Compute Engine (destino futuro acordado). Sin Jitsi self-hosted (fuera de alcance del MVP), el requerimiento de cómputo baja. |
| Dominio | ~\$15.000/año | Prorrateado, no mensual real |
| TLS (Let's Encrypt vía certbot) | \$0 | Gratuito |

---

## 5. Flujos principales

### 5.1 Ciclo de coaching completo
1. La empresa envía una **solicitud de nuevo proceso** (o el coach lo crea directamente).
2. El coach registra al **coachee** (datos, empresa, jefe directo, objetivo del proceso) y abre un **ciclo**.
3. El coach redacta el **resumen de reunión inicial** (con RRHH + jefatura) — de solo lectura para la empresa.
4. El coachee construye su **plan de desarrollo**; el coach lo aprueba (ver flujo 5.2).
5. Se agendan y ejecutan **sesiones** — cada una con resumen compartido + notas privadas del coach + post-sesión del coachee.
6. Cuando quedan ≤2 sesiones, se dispara la **alerta de ciclo por vencer** (visible también a la empresa).
7. Al cerrar el ciclo, el coach sube el **informe final** (con generador de borrador automático) y marca el **resultado** (Logrado / Medianamente logrado / No logrado).
8. El ciclo queda en el **historial** del coachee; el coachee recibe su **certificado descargable**.

### 5.2 Aprobación del plan de desarrollo
1. El coachee completa competencia, nivel objetivo, objetivo general y objetivos específicos → estado `Sin enviar`.
2. El coachee envía el plan → estado `Pendiente de aprobación` (campos quedan bloqueados).
3. El coach revisa: **Aprobar** → estado `Aprobado` (el coachee puede seguir editando el resto del plan: nivel actual, hábito, ejecución, formación); o **Solicitar cambios** (con comentario) → estado `Cambios solicitados`, campos se desbloquean y el coachee ve el comentario.
4. El coachee ajusta y vuelve a enviar (paso 2) hasta quedar `Aprobado`.
5. Aun con el plan `Aprobado`, el coachee puede **proponer cambios** más adelante, lo que reabre el ciclo de aprobación.

### 5.3 Sesión con videollamada (simulada — sin integración real, fuera de alcance del MVP)
1. El coach agenda una sesión en el **calendario compartido** y le asigna un **link de videollamada editable** (Meet/Zoom/lo que el coach ya use — la plataforma no aloja ni integra el proveedor).
2. El coachee ve un **recordatorio en pantalla** de su próxima sesión (sin envío real de email/SMS/WhatsApp).
3. El día de la sesión, tanto coach como coachee ven el botón **"Unirse a la sesión"** activo (indicador pulsante) solo dentro de la ventana de tiempo agendada (10 min antes a 90 min después).
4. El botón abre el link que el coach configuró manualmente para esa sesión — no hay servidor de videollamada propio.
5. Al finalizar, el coach registra **resumen compartido** (visible al coachee) y **notas privadas** (nunca visibles a coachee ni empresa) por separado.
6. El coachee completa el **post-sesión**: aprendizajes, calificación de utilidad (1-5), temas propuestos para la próxima.

### 5.4 Cálculo de ingresos (Panel de negocio)
1. Cada sesión queda vinculada a un coachee → una empresa → una **tarifa por hora** propia de esa empresa.
2. Al completarse una sesión, sus horas se suman a los **ingresos del período** (`SUM(tarifa_hora)` de las sesiones completadas del mes).
3. Las sesiones **agendadas pero futuras** alimentan el **ingreso proyectado** (mismo cálculo, sobre sesiones no completadas aún).
4. El **panel de negocio** del coach muestra: horas realizadas del mes, ingresos del período, ingreso proyectado, coachees activos, satisfacción promedio — todo derivado de las tablas `sesiones` + `empresas`, sin datos duplicados ni desincronizados.

---

## Siguiente paso

Confirmar o ajustar los supuestos marcados arriba (tarifa/hora real, fecha de kickoff, si el equipo será de 1 o 2 desarrolladores) y marcar como completado en `tasks/todo.md`.
