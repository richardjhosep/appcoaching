# Plan de Jira — Épicas e Historias del MVP (Coach Fernando Ramos)

Desglose ejecutable del backlog de `docs/mvp-planning.md` en épicas e historias listas para crear en Jira. Ver también `docs/jira-plan.csv` (mismo contenido, formato de importación).

## Nota de alcance (decisiones tomadas en esta ronda)

- **Los 3 roles se mantienen**: Coachee, Empresa y Coach siguen siendo parte completa del MVP.
- **Ninguna integración real con servicios externos entra en el MVP.** Se cae por completo: Jitsi self-hosted (videollamada real), Webpay, SII (boletas automáticas), cuenta de depósito/payouts, y envío real de email/SMS/WhatsApp. Todo lo que en el prototipo depende de esto queda **simulado** en pantalla (botón "Unirse" con ventana de tiempo y link editable a mano, alertas visuales, recordatorios en pantalla) — ninguna historia de este plan construye esos backends de integración.
- **Supuesto**: la invitación de cuenta y el reset de contraseña no envían email real; el coach genera la credencial y se la comparte al usuario por su cuenta (WhatsApp, en persona, etc.). Si esto cambia, es una historia nueva a agregar en la épica de Autenticación.
- Este cambio de alcance reemplaza el contenido del antiguo "Sprint 12 — Videollamada (Jitsi)" del backlog previo por una épica nueva que sí estaba pendiente de traducir a backlog: **Legal, auditoría y búsqueda global** (ya existía en el prototipo más reciente, `coaching-platform-prototype_3.jsx`, pero no se había desglosado en historias todavía).
- Totales resultantes: **146 story points / 915 horas** (antes: 151 pts / 950 h).

## Dependencias clave entre épicas

- **Autenticación (E2)** bloquea a todas las demás — nada se prueba de punta a punta sin login/roles.
- **Empresas y Coachees (E3)** bloquea a Sesiones (E4), Plan de desarrollo (E5) y Biblioteca de recursos (E8) — todas necesitan un coachee/empresa ya creado.
- **Plan de desarrollo backend (E5)** bloquea a Plan de desarrollo frontend (E6).
- **Sesiones (E4)** + **Plan de desarrollo frontend (E6)** bloquean a Post-sesión (E7) (la sesión y el objetivo primario ya deben existir).
- **Ciclos e informes backend (E9)** bloquea a su frontend (E10), y depende de Post-sesión (E7) y Plan de desarrollo (E6) para tener datos que resumir.
- **Panel de negocio (E11)** depende de Ciclos (E9) para el corte de ingresos por sesión completada.
- **Legal/Auditoría/Búsqueda (E12)** depende del audit log base creado en Autenticación (E2).
- **Hardening (E14)** depende de todas las anteriores — es el sprint de cierre.

## Resumen de épicas

| # | Épica | Sprint | Story points | Horas | Rol principal |
|---|---|---|---|---|---|
| E1 | Fundaciones técnicas e infraestructura base | 1 | 5 | 40 | Transversal |
| E2 | Autenticación, usuarios y permisos | 2 | 13 | 80 | Transversal |
| E3 | Empresas y Coachees (multi-tenant real) | 3 | 8 | 60 | Coach / Empresa |
| E4 | Sesiones y calendario | 4 | 13 | 80 | Coach / Coachee |
| E5 | Plan de desarrollo — backend | 5 | 11 | 60 | Coachee / Coach |
| E6 | Plan de desarrollo — frontend | 6 | 10 | 60 | Coachee / Coach |
| E7 | Post-sesión y seguimiento del coachee | 7 | 13 | 80 | Coachee |
| E8 | Biblioteca de recursos | 8 | 8 | 60 | Coach / Coachee |
| E9 | Ciclos e informes — backend | 9 | 11 | 60 | Coach |
| E10 | Ciclos e informes — frontend | 10 | 10 | 60 | Coach / Coachee / Empresa |
| E11 | Panel de negocio y reportes | 11 | 13 | 80 | Coach |
| E12 | Legal, auditoría y búsqueda global | 12 | 8 | 55 | Coach |
| E13 | Satisfacción y gestión comercial | 13 | 5 | 40 | Empresa |
| E14 | Hardening, calidad y cierre | 14 | 18 | 100 | Transversal |
| | **Total** | | **146** | **915** | |

---

## E1 — Fundaciones técnicas e infraestructura base (Sprint 1, sin dependencias)

| Historia | Pts | Horas | Criterio de aceptación |
|---|---|---|---|
| Monorepo y estructura de carpetas (backend/frontend/infra) | 1 | 8 | Repo con carpetas separadas, README de arranque local |
| Esqueleto NestJS por capas (módulos, config, health check) | 1 | 8 | `GET /health` responde 200; estructura de módulos por dominio lista |
| Esqueleto Vue + Tailwind con tokens de marca | 1 | 8 | Colores/tipografías (Fraunces o Poppins, Inter, IBM Plex Mono) disponibles como tokens reutilizables |
| docker-compose base (Postgres, Redis, backend, frontend, nginx) | 1 | 8 | `docker compose up` levanta los 5 servicios sin error |
| Pipeline CI (lint, test, build) | 1 | 8 | CI corre en cada PR y bloquea merge si falla |

## E2 — Autenticación, usuarios y permisos (Sprint 2, depende de E1)

| Historia | Pts | Horas | Criterio de aceptación |
|---|---|---|---|
| Login con JWT access+refresh y rotación | 3 | 20 | Login válido devuelve access+refresh; refresh rota el token; token expirado rechaza requests |
| RBAC: roles Coach/Coachee/Empresa con guards por endpoint | 3 | 20 | Cada endpoint rechaza (403) a roles no autorizados |
| Alta de cuenta por el coach (sin email real) | 2 | 10 | El coach genera una credencial temporal visible en pantalla para compartir manualmente |
| Registro base de auditoría (quién hizo qué, cuándo) | 2 | 10 | Cada acción sensible (login, aprobación, edición) deja una fila en el log de auditoría |
| Headers de seguridad, rate-limit y CORS | 2 | 10 | Headers OWASP presentes; rate-limit activo en login; CORS restringido al dominio de la app |
| Cambio/reset de contraseña autogestionado (sin email real) | 1 | 10 | El usuario cambia su contraseña con la actual; reset genera token temporal mostrado en pantalla al coach |

## E3 — Empresas y Coachees, multi-tenant real (Sprint 3, depende de E2)

| Historia | Pts | Horas | Criterio de aceptación |
|---|---|---|---|
| CRUD de empresas (6 empresas configurables + tarifa/hora) | 2 | 15 | Coach crea/edita/desactiva una empresa con su tarifa |
| CRUD de coachees (datos, empresa, jefe directo, objetivo del proceso) | 2 | 15 | Coach crea/edita un coachee vinculado a una empresa |
| Soporte "Independientes" con tarifa propia (`tarifaPropia`) | 2 | 10 | Un coachee sin empresa puede tener tarifa propia que prevalece sobre cualquier tarifa de empresa |
| Scoping multi-tenant real para Empresa | 1 | 10 | Un usuario de Empresa solo puede ver/consultar coachees de su propia empresa (verificado con 2 empresas distintas) |
| Contacto autogestionado del coachee, requerido con aviso si falta | 1 | 10 | El coachee edita su teléfono/email; si falta, se muestra un aviso visible al coach |

## E4 — Sesiones y calendario (Sprint 4, depende de E3)

| Historia | Pts | Horas | Criterio de aceptación |
|---|---|---|---|
| Modelo de sesión + calendario compartido | 3 | 15 | Una sesión creada por el coach aparece igual en la vista del coachee |
| Agendar / editar / eliminar sesión (vista coach) | 2 | 15 | Coach agenda, mueve o elimina una sesión y el calendario se actualiza |
| Solicitud de reagendamiento + respuesta del coach | 3 | 20 | Coachee solicita reagendar con motivo opcional; coach responde con disponibilidad o propone fecha nueva que actualiza el calendario real |
| Resumen compartido vs. notas privadas del coach | 2 | 15 | El resumen es visible al coachee; las notas privadas nunca aparecen en la vista de coachee ni empresa |
| Botón "Unirse a la sesión" simulado (ventana de tiempo, link editable) | 2 | 10 | El botón solo se activa entre 10 min antes y 90 min después de la hora agendada, y abre el link que el coach configuró — sin backend de videollamada real |
| Recordatorio automático en pantalla de la próxima sesión | 1 | 5 | El coachee ve un aviso de su próxima sesión al entrar — sin envío real de email/SMS/WhatsApp |

## E5 — Plan de desarrollo, backend (Sprint 5, depende de E3)

| Historia | Pts | Horas | Criterio de aceptación |
|---|---|---|---|
| Modelo de datos del plan (competencia, niveles, plazo, objetivo general) | 2 | 10 | Estructura basada en la planilla "Plan de Desarrollo"; persiste y se recupera correctamente |
| Objetivos específicos con relación real (FK), no índice de array | 2 | 10 | Cada objetivo específico tiene su propio id persistente, referenciable desde el plan de ejecución |
| Máquina de estados de aprobación | 3 | 20 | Transiciones válidas: Sin enviar → Pendiente de aprobación → Aprobado / Cambios solicitados → (vuelve a Pendiente al reenviar) |
| API de envío/aprobación/rechazo con comentario | 2 | 10 | "Solicitar cambios" exige comentario y lo deja visible al coachee vía API |
| Catálogo maestro de competencias (seed desde hoja "Competencia" de la planilla) | 2 | 10 | Las ~16 competencias con su definición y niveles conductuales quedan cargadas como datos maestros, no como texto libre |

## E6 — Plan de desarrollo, frontend (Sprint 6, depende de E5)

| Historia | Pts | Horas | Criterio de aceptación |
|---|---|---|---|
| Formulario de Definición con bloqueo durante aprobación | 3 | 20 | Competencia, nivel objetivo, objetivo general y objetivos específicos quedan de solo lectura mientras el estado es "Pendiente de aprobación" |
| Sub-pestaña Hábito y ejecución (Cuándo/En vez de/Voy a + Obvio/Sencillo/Atractivo/Satisfactorio) | 2 | 10 | Los 4 campos del marco de hábito se guardan y muestran correctamente |
| Plan de ejecución con objetivo primario único por actividad | 2 | 15 | Cada actividad se vincula a un solo objetivo específico vía selector; no se permite selección múltiple |
| Sub-pestaña Formación (libros/artículos/videos/podcasts/práctica guiada) | 1 | 5 | Los 5 campos de formación se guardan como texto libre |
| Vista del coach: aprobar o solicitar cambios | 2 | 10 | El coach ve el plan enviado y puede aprobar o rechazar con comentario desde su propia vista |

## E7 — Post-sesión y seguimiento del coachee (Sprint 7, depende de E4 y E6)

| Historia | Pts | Horas | Criterio de aceptación |
|---|---|---|---|
| Post-sesión inmutable por sesión realizada | 3 | 20 | Aprendizaje, utilidad (1-5) y cercanía al objetivo (1-10) quedan bloqueados una vez publicados |
| Cálculo único de "avance general" (`avanceRealDe`) | 2 | 10 | El mismo número de avance se muestra en la vista de coachee, coach y empresa para un mismo coachee |
| Recomendación del coachee + temas propuestos para la próxima sesión | 2 | 10 | El coach ve la recomendación y los temas propuestos antes de la siguiente sesión |
| Registro de logros (bitácora) | 2 | 10 | El coachee agrega un logro con fecha y descripción, visible en su historial |
| Diario de reflexión persistente con confirmación de guardado | 2 | 10 | El diario se guarda y muestra una confirmación visual (toast) al guardar |
| Línea de tiempo de progreso (nivel de competencia sesión a sesión) | 2 | 20 | Gráfico que muestra la evolución del nivel a lo largo de las sesiones registradas |

## E8 — Biblioteca de recursos (Sprint 8, depende de E3)

| Historia | Pts | Horas | Criterio de aceptación |
|---|---|---|---|
| CRUD de recursos + subida a almacenamiento de objetos | 3 | 25 | El coach sube un recurso (archivo o link) y queda disponible en la biblioteca general |
| Asignación N:N explícita coach→coachee | 2 | 15 | El coach activa/desactiva qué recursos ve cada coachee específico |
| Biblioteca personal del coachee (asignados + autoasignados) | 1 | 10 | El coachee solo ve los recursos que le fueron asignados o que él mismo tomó de la biblioteca general |
| Buscador y filtro por etiqueta (vista coach) | 1 | 5 | Buscar por texto o etiqueta filtra la lista de recursos en tiempo real |
| Aprendizajes prácticos sobre recursos asignados | 1 | 5 | El coachee registra un aprendizaje ligado a un recurso específico |

## E9 — Ciclos e informes, backend (Sprint 9, depende de E6 y E7)

| Historia | Pts | Horas | Criterio de aceptación |
|---|---|---|---|
| Modelo de ciclo de coaching (apertura/cierre/resultado) | 3 | 15 | Un ciclo se abre, se cierra y queda con resultado Logrado / Medianamente logrado / No logrado |
| Resumen de reunión inicial (solo coach edita, empresa solo lee) | 2 | 10 | La empresa puede leer el resumen pero el endpoint de edición rechaza su rol |
| Generador de borrador de informe final | 3 | 20 | El sistema arma un texto inicial desde los datos ya cargados del coachee (objetivos, sesiones, avance) |
| Almacenamiento de informes/PDFs por ciclo | 2 | 10 | El PDF subido queda asociado al ciclo y es descargable después |
| Alerta de ciclo por vencer (≤2 sesiones restantes) | 1 | 5 | La alerta aparece automáticamente cuando quedan 2 o menos sesiones del ciclo |

## E10 — Ciclos e informes, frontend (Sprint 10, depende de E9)

| Historia | Pts | Horas | Criterio de aceptación |
|---|---|---|---|
| UI de informe final (edición del borrador antes de subir) | 3 | 20 | El coach edita el texto generado automáticamente antes de publicarlo |
| Certificado descargable al completar el ciclo | 2 | 15 | Al cerrar el ciclo con resultado, el coachee puede descargar su certificado |
| UI de resumen de reunión inicial (solo lectura empresa) | 2 | 10 | La empresa ve el resumen sin controles de edición |
| Historial de ciclos anteriores por coachee (expandible) | 2 | 10 | La empresa y el coach pueden expandir ciclos previos de un mismo coachee |
| Selector de resultado del proceso visible para la empresa | 1 | 5 | La empresa ve el resultado final marcado por el coach (Logrado/Medianamente logrado/No logrado) |

## E11 — Panel de negocio y reportes, Coach (Sprint 11, depende de E9)

| Historia | Pts | Horas | Criterio de aceptación |
|---|---|---|---|
| Cálculo único de cobros por empresa (`calcularResumenCobros`) | 3 | 20 | El mismo cálculo alimenta el panel de inicio y la pestaña Negocio, sin cifras distintas entre ambos |
| Panel de negocio: horas, ingresos del período, ingreso proyectado | 3 | 20 | Ingresos del período solo suma empresas marcadas como pagadas; proyectado suma sesiones agendadas futuras |
| Panel de alertas de seguimiento | 2 | 15 | Alerta a coachees sin logros recientes, ciclos por cerrar y sesiones sin agendar |
| Comparativa de avance por área/gerencia (gráfico de barras) | 2 | 10 | El gráfico agrupa el avance promedio por área/gerencia |
| Exportar reporte real PDF/Excel (client-side, sin integración externa) | 2 | 10 | El PDF se genera vía impresión del navegador y el Excel vía SheetJS, sin llamar a ningún servicio externo |
| Gestión de horas contratadas vs. consumidas por empresa | 1 | 5 | Se muestra el consumo de horas de cada empresa contra lo contratado |

## E12 — Legal, auditoría y búsqueda global (Sprint 12, depende de E2)

| Historia | Pts | Horas | Criterio de aceptación |
|---|---|---|---|
| Contratos y NDA por empresa (registro manual, sin firma electrónica real) | 2 | 15 | El coach marca estado (firmado/pendiente), fecha y vigencia por empresa |
| Consentimiento informado por coachee | 1 | 10 | Se registra y cuenta cuántos coachees de cada empresa tienen consentimiento firmado |
| Panel de cumplimiento LPDP (checklist de medidas activas) | 1 | 10 | Se listan las medidas activas (notas privadas, contacto autogestionado, datos agregados a empresa) |
| Historial de auditoría (UI sobre el log del Sprint 2) | 2 | 10 | Se puede ver quién editó qué y cuándo, filtrado por coachee o tipo de acción |
| Búsqueda global (coachees, empresas, competencias, recursos) | 2 | 10 | La búsqueda fija en la vista del coach encuentra resultados de las 4 entidades desde un mismo campo |

## E13 — Satisfacción y gestión comercial, Empresa (Sprint 13, depende de E10)

| Historia | Pts | Horas | Criterio de aceptación |
|---|---|---|---|
| Encuesta de satisfacción de la empresa | 2 | 15 | La empresa responde una encuesta y el resultado queda visible al coach |
| Solicitud de nuevo proceso de coaching (formulario) | 1 | 10 | La empresa envía una solicitud que el coach ve en su panel |
| "Abrir nuevo proceso con [nombre]" desde un proceso cerrado | 1 | 10 | Desde un proceso cerrado, un botón pre-llena el formulario de apertura con ese mismo coachee |
| KPIs de empresa (procesos terminados/en curso, asistencia, satisfacción) | 1 | 5 | Los 4 KPIs se calculan desde datos reales de la empresa logueada |

## E14 — Hardening, calidad y cierre (Sprint 14, depende de todas las anteriores)

| Historia | Pts | Horas | Criterio de aceptación |
|---|---|---|---|
| Backups automáticos de Postgres | 3 | 15 | Backup diario programado y restaurable en un entorno de prueba |
| Suite e2e (Playwright) cubriendo los 3 roles | 5 | 30 | Un flujo completo por rol (login → acción principal) pasa en CI |
| Revisión de headers de seguridad, puertos expuestos y variables de entorno | 3 | 15 | Ningún puerto interno queda expuesto públicamente; secretos fuera del control de versiones |
| Densidad para celular en toda la plataforma | 3 | 15 | Ninguna vista requiere scroll horizontal en un viewport de 375px |
| Onboarding y estados vacíos (coachee/empresa nuevos) | 2 | 15 | Un usuario nuevo sin datos ve un estado guía, no una pantalla en blanco o con error |
| Validación de formularios (teléfono, email, montos, enlaces) | 2 | 10 | Los campos rechazan formatos inválidos con mensaje de error claro |

---

## Siguiente paso

Importar `docs/jira-plan.csv` al proyecto Jira (Import CSV), mapeando `Story Points` al campo de puntos de historia del proyecto y `Sprint` al sprint correspondiente ya creado en el tablero (o crearlos primero con las fechas de `docs/mvp-planning.md`).
