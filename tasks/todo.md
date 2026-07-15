# Planificación ágil + Canvas + valorización del MVP — Plataforma Coach Fernando Ramos

## Contexto

El plan técnico anterior (arquitectura NestJS/Vue/Postgres/Docker, 12 fases) sigue siendo la base de alcance y orden técnico, pero el usuario necesita ahora una capa de planificación de **producto/negocio** sobre esa base, para poder:

- Ejecutar el desarrollo como sprints Scrum reales.
- Valorizar el desarrollo (costo estimado en CLP).
- Tener un Business Model Canvas del negocio de coaching que la plataforma soporta.
- Tener los flujos principales documentados de forma visual, no solo como lista de features.
- Poder llevar la planificación a una carta Gantt (fechas, duración, dependencias) en cualquier herramienta externa (Excel, MS Project, ClickUp, TeamGantt).

Decisiones ya confirmadas con el usuario para esta capa de planificación:
- **Modelo de negocio**: la plataforma es una herramienta privada del proceso de Fernando Ramos (no SaaS multi-coach) — el Canvas se enfoca en un solo negocio.
- **Alcance del MVP**: se mantiene la réplica completa de los 3 roles (Coachee, Empresa, Coach), como ya se acordó en el plan técnico.
- **Valorización**: se usa un rango de mercado en CLP para desarrollo full-stack (freelance/agencia en Chile), dejando el supuesto de tarifa/hora explícito y ajustable.
- **Formato de entrega**: un **Artifact visual** (HTML, presentable) + un **archivo Markdown** en el repo con las mismas tablas en formato plano, listo para copiar a una herramienta de Gantt.

---

## Qué se va a construir (2 entregables)

### 1. Artifact visual (`docs/mvp-planning.html` publicado como Artifact)

Documento único, navegable, con estas secciones:

- **Business Model Canvas** (grilla de 9 bloques): segmentos de cliente, propuesta de valor, canales, relación con clientes, fuentes de ingreso, recursos clave, actividades clave, alianzas clave, estructura de costos — construido con lo ya conocido del dominio (empresas cliente tipo Andes Minerals/Viña del Sur, tarifa por hora diferenciada por empresa, Fernando como recurso clave/cuello de botella, la plataforma como diferenciador de confianza y trazabilidad frente a coaching sin herramienta digital).
- **Roadmap de sprints** (línea de tiempo visual, ~11-12 sprints de 2 semanas ≈ 5-6 meses con 1 desarrollador full-stack full-time; nota de escenario alternativo con 2 desarrolladores en paralelo backend/frontend, ~14-16 semanas).
- **Backlog por sprint**: cada sprint con objetivo, historias de usuario clave (derivadas de las 12 fases técnicas ya definidas — auth, coachee core, plan de desarrollo con aprobación, sesiones/calendario, empresa, Jitsi, reportes, hardening), estimación en story points (Fibonacci) y horas equivalentes.
- **Valorización**: tabla de horas totales × 3 escenarios de tarifa (bajo/medio/alto, en CLP/hora), total estimado del desarrollo, más costo recurrente estimado de infraestructura (VM con capacidad para Jitsi+Postgres+Redis+MinIO+Node, dominio, TLS).
- **Flujos principales** (diagramas, no solo texto): (1) ciclo de coaching completo desde alta de empresa/coachee hasta informe final, (2) flujo de aprobación del plan de desarrollo (coachee↔coach), (3) flujo de sesión con videollamada (agendar → recordatorio → unirse → resumen/notas → post-sesión), (4) flujo de cálculo de ingresos (sesión completada → horas × tarifa empresa → panel de negocio).

### 2. Markdown exportable (`docs/mvp-planning.md`)

Mismos contenidos en formato de tablas planas, pensado para copiar/pegar:
- Tabla de Canvas (bloque | contenido).
- Tabla de backlog/Gantt: `Sprint | Tarea/Historia | Épica | Duración (días) | Dependencias | Story points` — estructura mínima que cualquier herramienta de Gantt puede importar o replicar manualmente.
- Tabla de valorización con los 3 escenarios y los supuestos (tarifa/hora, horas totales, costo infraestructura mensual).
- Los 4 flujos principales descritos como pasos numerados (equivalente en texto a los diagramas del Artifact).

---

## Insumos que ya tengo (no requieren más preguntas)

- **Backlog técnico base**: las 12 fases del plan técnico anterior (Fase 0 Scaffolding → Fase 11 Hardening/GCP), con tamaños relativos S/M/L ya asignados — se traducen 1:1 a story points (S=5, S/M=8, M=13, L=21, M/L=18) y horas (S≈40h, S/M≈60h, M≈80h, L≈120h, M/L≈100h), totalizando ≈950h / ≈151 puntos.
- **Datos de negocio ya modelados**: tarifas diferenciadas por empresa (Andes Minerals $45.000/h, Viña del Sur $40.000/h CLP) como base del bloque "fuentes de ingreso" del Canvas.
- **Flujos ya validados en el prototipo**: máquina de estados de aprobación del plan (`coaching-platform-prototype_2.jsx:477-478`, `:1964-1991`), fórmulas de panel de negocio (`:1777-1831`), lógica de botón "Unirse a sesión" (`:397+`) — se convierten en los diagramas de flujo.
- **Referencia de tarifa de mercado CLP** para desarrollo full-stack freelance/agencia en Chile: rango $20.000–$35.000 CLP/hora, usado para los 3 escenarios de valorización (bajo/medio/alto), dejado explícito como supuesto editable en el documento.

---

## Pasos de ejecución

- [ ] Cargar el skill `artifact-design` antes de escribir el HTML del Artifact (obligatorio por las reglas de la herramienta).
- [ ] Escribir `docs/mvp-planning.md` con las tablas (Canvas, backlog/Gantt, valorización, flujos en texto).
- [ ] Escribir `docs/mvp-planning.html` con el mismo contenido en formato visual (Canvas en grilla, timeline de sprints, diagramas de flujo, tarjetas de valorización) y publicarlo como Artifact.
- [ ] Confirmar con el usuario si algún supuesto (tarifa/hora, duración de sprint, velocity) necesita ajuste antes de considerarlo definitivo.

## Verificación

- El Markdown se revisa por consistencia interna: suma de horas/puntos por sprint coincide con el total declarado; cada tarea de la tabla Gantt tiene fecha de inicio/duración/dependencia coherente con el orden de fases ya acordado (Auth y Plan de Desarrollo siguen siendo bloqueantes tempranos).
- El Artifact se revisa visualmente (renderizado en el navegador vía la herramienta Artifact) antes de entregarlo, confirmando que el Canvas, el timeline y los diagramas se vean correctamente en modo claro y oscuro.

## Revisión (se completa al terminar)

_Pendiente — se agrega tras ejecutar el plan._
