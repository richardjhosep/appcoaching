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

- [x] Cargar el skill `artifact-design` antes de escribir el HTML del Artifact (obligatorio por las reglas de la herramienta).
- [x] Escribir `docs/mvp-planning.md` con las tablas (Canvas, backlog/Gantt, valorización, flujos en texto).
- [x] Escribir `docs/mvp-planning.html` con el mismo contenido en formato visual (Canvas en grilla, timeline de sprints, diagramas de flujo, tarjetas de valorización) y publicarlo como Artifact.
- [ ] Confirmar con el usuario si algún supuesto (tarifa/hora, duración de sprint, velocity) necesita ajuste antes de considerarlo definitivo.

## Verificación

- El Markdown se revisa por consistencia interna: suma de horas/puntos por sprint coincide con el total declarado; cada tarea de la tabla Gantt tiene fecha de inicio/duración/dependencia coherente con el orden de fases ya acordado (Auth y Plan de Desarrollo siguen siendo bloqueantes tempranos).
- El Artifact se revisa visualmente (renderizado en el navegador vía la herramienta Artifact) antes de entregarlo, confirmando que el Canvas, el timeline y los diagramas se vean correctamente en modo claro y oscuro.

## Revisión (se completa al terminar)

- `docs/mvp-planning.md`: Canvas, backlog/Gantt de 14 sprints (151 pts / 950h), valorización en 3 escenarios CLP y los 4 flujos principales, listo para copiar a Excel/ClickUp/MS Project.
- `docs/mvp-planning.html`: misma información en Artifact visual (Canvas en grilla real, Gantt horizontal generado desde los datos de sprint, tablas, tarjetas de valorización), con paleta y tipografías de `appcoaching.md` (Fraunces/Inter/IBM Plex Mono incrustadas como data URI), soporte claro/oscuro. Publicado en https://claude.ai/code/artifact/d817036a-31b9-44c4-a3d9-161435cc61eb
- Pendiente de confirmar con el usuario: tarifa/hora real (hoy \$20.000–\$35.000 CLP/h de mercado), fecha real de kickoff (hoy asume 2026-07-20), y si el equipo será de 1 o 2 desarrolladores.

---

# Plan de Jira (épicas + historias) — 2026-07-16

## Contexto

Continuación del plan anterior. El usuario pidió bajar el backlog de `docs/mvp-planning.md` a un plan de Jira (épicas/historias) y confirmó dos decisiones de alcance: (1) los 3 roles se mantienen, (2) ninguna integración real con servicios externos entra al MVP (sin Jitsi self-hosted, sin Webpay, sin SII, sin envío real de email/SMS/WhatsApp — esas pantallas quedan simuladas). Se detectó además que el backlog previo estaba basado en el prototipo `_2.jsx` y no cubría módulos ya presentes en el prototipo más reciente `_3.jsx` (Legal/Auditoría, búsqueda global), que se incorporaron en reemplazo del sprint de Jitsi.

## Pasos de ejecución

- [x] Leer `appcoaching.md`, `appcoaching_1.md`, `docs/mvp-planning.md`, la planilla `Plan de Desarrollo Coachee.xlsx` (hojas Competencia / Plan de Desarrollo / Ejemplo) y grepear `coaching-platform-prototype_3.jsx` para confirmar módulos no cubiertos por el backlog anterior (SII, payouts, Legal/Auditoría, búsqueda global).
- [x] Confirmar con el usuario (AskUserQuestion): alcance de rol Empresa, tratamiento de integraciones externas, y formato de entrega (CSV + Markdown).
- [x] Redactar `docs/jira-plan.md`: 14 épicas, ~74 historias con story points/horas/criterio de aceptación, nota de alcance y dependencias entre épicas.
- [x] Generar `docs/jira-plan.csv` (script Python con el módulo `csv` para escapado correcto) y validarlo con `csv.reader` (89 filas, 14 épicas, 74 historias, sin filas malformadas, suma de puntos = 146).
- [x] Actualizar `docs/mvp-planning.md`: nota de alcance, tabla de sprints (sprint 12 pasa de Jitsi a Legal/Auditoría/Búsqueda global), totales (146 pts / 915 h), valorización recalculada (3 escenarios CLP), costos de infraestructura (se quita Jitsi de la VM y el ítem de email transaccional), y flujo 5.3 actualizado para reflejar videollamada simulada.

## Verificación

- CSV validado programáticamente: 89 filas totales (header + 14 Epic + 74 Story), sin filas malformadas, suma de story points de las historias = 146 (coincide con el total declarado en el Markdown y en `mvp-planning.md`).
- Revisión manual: ninguna historia de `docs/jira-plan.md`/`.csv` construye Jitsi, Webpay, SII ni envío real de email/SMS/WhatsApp; donde el prototipo lo simula, la historia lo deja explícito ("simulado", "sin integración real").
- Suma de horas/puntos por épica verificada a mano contra la tabla resumen (146 pts / 915 h en ambos archivos).

## Revisión (se completa al terminar)

- `docs/jira-plan.md`: 14 épicas (Fundaciones → Hardening), con tabla resumen, historias con criterio de aceptación, nota de alcance (integraciones fuera del MVP) y dependencias entre épicas.
- `docs/jira-plan.csv`: mismo contenido en formato de importación Jira (Issue Type, Epic Name/Link, Summary, Description, Story Points, Sprint, Component, Priority, Labels), listo para "Import CSV" en un proyecto Jira.
- `docs/mvp-planning.md`: actualizado para que el backlog, los totales y la valorización sean consistentes con el nuevo alcance (146 pts / 915 h en vez de 151 pts / 950 h).
- Pendiente: crear el proyecto/tablero en Jira e importar el CSV; confirmar si el campo "Story Points" del proyecto Jira ya existe como campo nativo de Scrum o hay que habilitarlo primero.

---

# Sprint 1 (E1) — Fundaciones técnicas e infraestructura base — 2026-07-16

## Contexto

Ejecución del Sprint 1 de `docs/jira-plan.md`. El usuario confirmó el stack técnico original (NestJS + Vue + Tailwind + Postgres + Redis + Docker Compose + nginx), no React, aunque el prototipo validado esté en React (ese prototipo queda solo como referencia visual/funcional).

## Pasos de ejecución

- [x] `backend/`: generado con `nest new -p npm --skip-git --strict` (Nest 11, TypeScript 5.7.3 fijado por el propio schematic). Se quitó el `AppController`/`AppService` de ejemplo y se agregó `ConfigModule` (`@nestjs/config`) + `HealthModule` (`GET /health` → `{status:'ok'}`), con test unitario y e2e actualizado. Dockerfile multi-stage (`node:22-alpine`).
- [x] `frontend/`: generado con `npm create vite@latest -- --template vue-ts` (Vue 3.5, Vite 8, TypeScript 6.0.2). Se agregó Tailwind v4 (`@tailwindcss/vite`, config CSS-first con `@theme`), tokens de marca (tinta/pergamino/marfil/salvia/bronce/línea/turquesa SaltUp) y tipografías vía `@fontsource` (solo subconjunto `latin-*`, para no cargar Cirílico/Devanagari/Vietnamita de más). `App.vue` mínimo con fetch a `/api/health` para probar el cableado. Vitest + `@vue/test-utils` con 2 tests smoke. ESLint flat config (`typescript-eslint` + `eslint-plugin-vue`). Proxy de dev (`/api` → `localhost:3000`) en `vite.config.ts`. Dockerfile multi-stage (build con Node, sirve con `nginx:alpine`).
- [x] `docker-compose.yml` (postgres, redis, backend, frontend, nginx — 5 servicios), `nginx/nginx.conf` (reverse proxy `/api/` → backend, `/` → frontend), `.env.example`, `.gitignore` actualizado (`dist/`, `coverage/`, `*.tsbuildinfo`). MinIO deliberadamente fuera de este sprint (entra en Sprint 8, cuando hay subida real de archivos).
- [x] `.github/workflows/ci.yml`: 2 jobs (`backend`, `frontend`), cada uno lint + test + build en Node 22.

## Verificación

- Backend local: `npm run lint` (limpio), `npm test` (1/1), `npm run test:e2e` (1/1 contra `/health`), `npm run build` (ok).
- Frontend local: `npm run lint` (limpio), `npm test` (2/2 con Vitest), `npm run build` (ok; bundle de fuentes optimizado a solo subconjunto latin).
- Stack completo: `docker compose up --build` levantó los 5 servicios (`postgres`/`redis` healthy, `backend`/`frontend`/`nginx` up). `curl http://localhost/api/health` → `{"status":"ok"}` (200) a través de nginx; `curl http://localhost/` → 200 con el título correcto de la plataforma. Stack bajado con `docker compose down` al terminar.

## Revisión

Sprint 1 completo y verificado end-to-end. Próximo paso: Sprint 2 (E2 — Autenticación, usuarios y permisos), que depende de esta base.

---

# Sprint 2 (E2) — Autenticación, usuarios y permisos — 2026-07-16

## Contexto

Ejecución de E2 de `docs/jira-plan.md` (13pt/80h). El usuario confirmó **TypeORM** como ORM (decoradores, integración oficial `@nestjs/typeorm`, coherente con el resto de Nest) tras comparar contra Prisma, y confirmó que el backend corre sobre **Node.js** (NestJS + Node 22, ya establecido en Sprint 1).

## Pasos de ejecución

- [x] Dependencias: `@nestjs/typeorm`, `typeorm`, `pg`, `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt`, `@nestjs/throttler`, `helmet`, `class-validator`, `class-transformer`, `ioredis`, `dotenv`.
- [x] `config/configuration.ts` ampliado (jwt access/refresh secret+TTL, bcryptRounds, seed.coachEmail/Password, frontendUrl) + `common/duration.util.ts` (convierte `"15m"/"7d"` a segundos, usado tanto para `expiresIn` del JWT como para el TTL de Redis — evita mantener dos formatos del mismo valor).
- [x] `database/data-source.ts` (DataSource único para el CLI de migraciones, glob `__dirname` que sirve tanto en ts-node como en dist compilado) + `TypeOrmModule.forRootAsync` en `app.module.ts` (`synchronize: false`, `autoLoadEntities: true`).
- [x] `redis/` — wrapper fino de `ioredis` (`setWithTtl`/`get`/`delete`).
- [x] `users/` — entidad `User` (uuid, email único, passwordHash, role enum, mustChangePassword, isActive), `UsersService` (hash bcrypt, generación de contraseña temporal, cambio/reset), `UsersController` (`POST /users` solo Coach, `PATCH /users/me/password`, `POST /users/:id/reset-password` solo Coach).
- [x] `audit/` — entidad `AuditLog` + `AuditService.record()`.
- [x] `auth/` — `Role` enum, `JwtStrategy` (Passport), `RolesGuard`/`@Roles`/`@CurrentUser`, `AuthService` (login, refresh con rotación de jti en Redis, logout/revocación), `AuthController` (`/auth/login` con throttle estricto 5/min, `/auth/refresh`, `/auth/logout`).
- [x] `seed/` — `SeedService` (`OnApplicationBootstrap`) crea el primer Coach desde `SEED_COACH_EMAIL`/`SEED_COACH_PASSWORD` si no existe ninguno todavía.
- [x] `main.ts` — `helmet()`, CORS con `frontendUrl`, `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`, `transform`); `ThrottlerGuard` registrado como `APP_GUARD` global en `app.module.ts`.
- [x] Migración inicial `InitUsersAndAudit` (tablas `users` y `audit_logs`, extensión `uuid-ossp`) generada y corrida contra Postgres real. `backend/Dockerfile` actualizado: el `CMD` de runtime corre `typeorm migration:run` antes de `node dist/main`.
- [x] Tests unitarios con mocks: `AuthService` (login ok/credenciales inválidas/usuario inactivo, refresh rota el jti y rechaza tokens revocados/inválidos, logout), `UsersService` (alta con password temporal vs. password explícito del seed, cambio de contraseña, reset), `RolesGuard` (sin rol requerido / rol correcto / rol incorrecto).
- [x] `docker-compose.yml`: se publicó el puerto de Redis (`6379:6379`) para poder correr los tests e2e desde fuera de Docker, igual que ya se hacía con Postgres.
- [x] `.env.example` y `tasks/todo.md` actualizados.

## Verificación

- Unitarios: `npm run lint` (limpio) y `npm test` → **20/20** tests pasando (incluye los 3 suites nuevos de Auth/Users/RolesGuard).
- e2e contra Postgres/Redis reales: se creó una base `coaching_test` separada, se corrieron las migraciones ahí, y `npm run test:e2e` (2/2, incluye el flujo completo login → RBAC 401/403 → refresh con rotación → logout → refresh ya revocado falla).
- `docker compose up --build` completo: logs del backend confirman `No migrations are pending` (ya corridas) y `Seeded initial coach account: fernando@coachfernandoramos.cl`.
- Verificación manual con `curl` a través de nginx: login del coach semilla → 200 con tokens; `POST /users` sin token → 401; con token de coach → 201 (crea coachee, devuelve password temporal); login de ese coachee → `POST /users` con su token → 403; `POST /auth/refresh` → 200 con par nuevo; reutilizar el refresh viejo → 401 (rotación); `POST /auth/logout` → 200; refresh con el token ya deslogueado → 401.
- `SELECT` en `audit_logs`: quedaron registrados `LOGIN_SUCCESS`, `USER_CREATED` y `LOGOUT` con el `user_id` correcto y timestamps coherentes con la secuencia de la prueba.
- Stack bajado con `docker compose down` al terminar.

## Revisión

Sprint 2 completo y verificado end-to-end (unitarios + e2e + manual + auditoría). Próximo paso: Sprint 3 (E3 — Empresas y Coachees, multi-tenant real), que depende de esta base de autenticación/roles.

---

# Sprint 3 (E3) — Empresas y Coachees (multi-tenant real) — 2026-07-16

## Contexto

Ejecución de E3 de `docs/jira-plan.md` (8pt/60h, depende de E2). El usuario pidió continuar sprint tras sprint sin pausar en modo planificación por cada uno (ver memoria `feedback_review_via_ui`) — el checkpoint de revisión queda para cuando haya una UI que mostrar.

## Pasos de ejecución

- [x] `empresas/` — entidad `Empresa` (nombre único, tarifaHora CLP, isActive), `EmpresasService`/`EmpresasController` (CRUD, solo Coach).
- [x] `User` (Sprint 2) extendido con `empresaId` nullable + relación a `Empresa`; `UsersService.createUser` ahora exige y valida `empresaId` cuando `role === EMPRESA` (ignora/fuerza `null` para los demás roles); `CreateUserDto` gana `empresaId` opcional.
- [x] JWT (`AccessTokenPayload`/`AuthenticatedUser`) gana el claim `empresaId`, propagado desde `AuthService.issueTokens` y `JwtStrategy.validate` — permite aplicar scoping multi-tenant sin consulta extra a la base en cada request.
- [x] `coachees/` — entidad `Coachee` (userId único → login, empresaId nullable → null = "Independiente", tarifaPropia, jefeDirecto, objetivoProceso, telefono/emailContacto sin validación estricta de formato todavía — eso es explícitamente Sprint 14). `CoacheesService.create()` crea el login (reutiliza `UsersService.createUser`) y el perfil en una sola llamada. Scoping: `findAllForActor`/`findOneForActor` filtran por `empresaId` cuando el actor es rol Empresa (403 si el coachee es de otra empresa o independiente). `GET /coachees/me` y `PATCH /coachees/me/contact` para autogestión del propio coachee.
- [x] `@nestjs/mapped-types` para `PartialType`/`OmitType` en los DTOs de actualización.
- [x] Migración `AddEmpresasAndCoachees` (tablas `empresas`, `coachees`, FK `users.empresa_id`) generada y corrida sobre los datos ya sembrados en Sprint 2 sin romper nada.
- [x] Tests unitarios: `EmpresasService`, `CoacheesService` (creación con/sin empresa, rechazo de `empresaId` inexistente, scoping por rol incluyendo el 403), `UsersService.createUser` (4 casos nuevos para el rol `EMPRESA`).
- [x] e2e: `test/coachees.e2e-spec.ts` — flujo completo de scoping multi-tenant (2 empresas, coachee independiente, 403 cruzado) + contacto autogestionado.

## Hallazgo de seguridad real (detectado por el propio e2e, no fue solo teoría)

Al agregar la relación `Coachee.user` para mostrar el email de login junto al perfil, el primer intento de mitigación (`@Exclude()` en `User.passwordHash` + `ClassSerializerInterceptor` registrado a mano en `main.ts`) **no funcionó**: el e2e (`test/coachees.e2e-spec.ts`) bootstrapea la app vía `Test.createTestingModule` y nunca pasa por `bootstrap()` de `main.ts`, así que el interceptor nunca se aplicaba y `passwordHash` viajaba en la respuesta de `GET /coachees/:id`. Se corrigió de raíz registrando el interceptor como `APP_INTERCEPTOR` dentro de `app.module.ts` (mismo patrón que `ThrottlerGuard` vía `APP_GUARD`), para que forme parte del grafo de DI y aplique sin importar cómo se bootstrapee la app (prod, e2e, o lo que sea a futuro). Re-verificado: el e2e y la prueba manual con `curl` confirman que `passwordHash` ya no aparece en ninguna respuesta.

## Verificación

- Unitarios: `npm run lint` (limpio) y `npm test` → **39/39** tests.
- e2e contra `coaching_test`: **3/3 suites** (health, auth, coachees) — incluye el flujo completo de scoping multi-tenant y la aserción explícita de que `passwordHash` no aparece en el JSON.
- `docker compose up --build`: logs confirman que la migración nueva corrió sin error sobre los datos existentes ("No migrations are pending" tras aplicarla, coach del Sprint 2 intacto) y las rutas de `/empresas` y `/coachees` quedaron mapeadas correctamente (con `/coachees/me` antes de `/coachees/:id`).
- Verificación manual con `curl` a través de nginx: coach crea Empresa A y B → crea coachee independiente + uno por empresa → crea login `EMPRESA` para la Empresa A → login como esa empresa → `GET /coachees` solo devuelve el suyo → `GET /coachees/:id` de la Empresa B o del independiente → 403 → coachee autogestiona su contacto vía `PATCH /coachees/me/contact` → el coach ve el contacto actualizado y se confirmó a mano (`grep passwordHash`) que no aparece en la respuesta.
- Stack bajado con `docker compose down` al terminar.

## Revisión

Sprint 3 completo y verificado end-to-end, con una corrección de seguridad real de por medio (no solo teórica). Próximo paso: Sprint 4 (E4 — Sesiones y calendario), que depende de Empresas/Coachees.

---

# Sprint 4 (E4) — Sesiones y calendario — 2026-07-16

## Contexto

Ejecución de E4 de `docs/jira-plan.md` (13pt/80h, depende de E3). El usuario pidió avanzar sprint a sprint sin pausar en modo planificación para cada uno (memoria `feedback_review_via_ui`), así que este sprint se ejecutó directo, aplicando los mismos patrones ya establecidos (módulo por dominio, scoping por actor, DTOs con `class-validator`, migraciones generadas contra Postgres real).

## Pasos de ejecución

- [x] `sesiones/` — entidad `Sesion` (coacheeId, fechaHora timestamptz, linkVideollamada, resumenCompartido, notasPrivadas) y `SolicitudReagendamiento` (sesionId, coacheeId, motivo, estado pendiente/resuelta, respuestaCoach, resolvedAt).
- [x] `SesionesService`/`SesionesController`: CRUD completo (Coach) — crear valida que el coachee exista; `GET /sesiones/me` y `GET /sesiones/me/proxima` (Coachee) devuelven las sesiones **sin** `notasPrivadas` (se arma explícitamente el objeto de respuesta sin ese campo, sin depender de serialización condicional); `PATCH /sesiones/:id` (Coach) edita fecha/link/resumen/notas en un solo endpoint.
- [x] `SolicitudesReagendamientoService`/`Controller`: el coachee solicita reagendar sobre una sesión propia (`POST /sesiones/:id/reagendamiento`, 404 si la sesión no es suya — verificado con un segundo coachee); el coach lista pendientes (`GET /solicitudes-reagendamiento`) y responde (`POST /solicitudes-reagendamiento/:id/responder`) con una fecha nueva (que actualiza la sesión real) y/o un mensaje de disponibilidad.
- [x] `CoacheesService.exists()` agregado (paralelo al de `EmpresasService`) para la validación de `coacheeId` al crear una sesión.
- [x] Migración `AddSesiones` (tablas `sesiones`, `solicitudes_reagendamiento`, FKs con cascada) generada y corrida sobre los datos existentes de Sprint 2/3 sin romper nada.
- [x] Tests unitarios: `SesionesService` (validación de coachee, ownership, ocultamiento de `notasPrivadas` en las 2 vistas de coachee, update, remove) y `SolicitudesReagendamientoService` (rechazo sin perfil de coachee, propagación del error de ownership, creación válida, respuesta con fecha nueva vs. solo mensaje).
- [x] e2e (`test/sesiones.e2e-spec.ts`): flujo completo agendar → resumen/notas → coachee ve sin notas privadas → reagendamiento → respuesta del coach → sesión actualizada → un segundo coachee no puede reagendar una sesión ajena (404).

## Nota de diseño

El botón "Unirse a la sesión" simulado y el recordatorio en pantalla (historias de E4) no necesitaron endpoints propios: alcanza con que `Sesion` exponga `fechaHora` y `linkVideollamada` — la ventana de activación (10 min antes / 90 min después) y el aviso son cálculo puro de frontend sobre esos datos, sin lógica de backend adicional. El campo `estado`/`cancelada` que se había considerado en el diseño inicial se descartó: la historia solo pedía "agendar/editar/eliminar", cubierto con `DELETE /sesiones/:id` real.

## Verificación

- Unitarios: `npm run lint` (limpio) y `npm test` → **56/56** tests.
- e2e contra `coaching_test`: **4/4 suites** (health, auth, coachees, sesiones).
- `docker compose up --build`: logs confirman migración corrida sin error sobre los datos existentes y las rutas de `/sesiones` mapeadas en el orden correcto (`me`, `me/proxima` antes de `:id`).
- Verificación manual con `curl`: agendar sesión → coach agrega resumen/notas → coachee ve el resumen pero no las notas privadas (confirmado con `grep`) → coachee solicita reagendamiento → coach lo ve pendiente → coach responde con fecha nueva → se confirmó que la sesión quedó con la fecha propuesta por el coach.
- Nota operativa: el rate-limit de `/auth/login` (5/min) se activó durante las pruebas manuales por pura repetición de logins en poco tiempo — comportamiento esperado y correcto del guard de Sprint 2, no un bug.
- Stack bajado con `docker compose down` al terminar.

## Revisión

Sprint 4 completo y verificado end-to-end. Próximo paso: Sprint 5 (E5 — Plan de desarrollo, backend), que depende de Empresas/Coachees (no de Sesiones).

---

# Sprint 5 (E5) — Plan de desarrollo, backend — 2026-07-16

## Contexto

Ejecución de E5 de `docs/jira-plan.md` (11pt/60h, depende de E3). Alcance interpretado literal al criterio de aceptación ya escrito: modelo de datos (competencia/niveles/plazo/objetivo general), objetivos específicos con FK real, máquina de estados de aprobación, y catálogo maestro de competencias. Los campos de Hábito/Ejecución/Formación (historias de Sprint 6, "frontend") quedan fuera de este sprint — no había criterio de aceptación que los pidiera acá, y "objetivos específicos... referenciable desde el plan de ejecución" solo exige que el objetivo tenga FK real, no que la tabla de ejecución exista ya.

## Pasos de ejecución

- [x] `competencias/` — entidad `Competencia` (nombre único, definición, `niveles` jsonb con los anclajes conductuales), datos de seed (`competencias.seed-data.ts`) con las 16 competencias completas extraídas de la hoja "Competencia" de `Plan de Desarrollo Coachee.xlsx`, `CompetenciasController` (`GET /competencias`, cualquier rol autenticado).
- [x] `planes-desarrollo/` — entidad `PlanDesarrollo` (coacheeId único, competenciaId FK nullable, nivelActual/nivelObjetivo, plazo, descripcionEstadoActual, objetivoGeneral, estado, comentarioCoach) y `ObjetivoEspecifico` (planId FK real con `onDelete: CASCADE`, descripcion, orden).
- [x] `PlanesDesarrolloService`: auto-creación de un plan en blanco (`sin_enviar`) la primera vez que el coachee lo consulta; `updateOwn` bloquea competencia/nivelObjetivo/objetivoGeneral mientras el estado es `pendiente_aprobacion`, pero deja siempre libres nivelActual/plazo/descripcionEstadoActual (tal como especifica el documento: "libre edición del coachee"); `enviar` exige competencia+nivelObjetivo+objetivoGeneral+≥1 objetivo antes de pasar a `pendiente_aprobacion`; `aprobar`/`solicitarCambios` (Coach) solo válidos desde `pendiente_aprobacion`.
- [x] CRUD de objetivos específicos (`POST/PATCH/DELETE /planes-desarrollo/me/objetivos/:id`), bloqueado también mientras el plan está pendiente de aprobación.
- [x] Migración `AddPlanDesarrollo` (tablas `competencias`, `planes_desarrollo`, `objetivos_especificos`) generada y corrida sobre los datos existentes sin romper nada.
- [x] Tests unitarios: `PlanesDesarrolloService` (auto-creación, bloqueo de campos gated vs. libres, validación de competencia inexistente, las 4 transiciones de estado con sus rechazos, CRUD de objetivos) y `CompetenciasService` (seed, `findById`).
- [x] e2e (`test/planes-desarrollo.e2e-spec.ts`): definición → 2 objetivos → envío → bloqueo 403 → coach solicita cambios → coachee ajusta y reenvía → coach aprueba → doble aprobación rechazada (409).

## Bug de concurrencia real encontrado por el propio e2e (no teórico)

El seed de competencias hacía `count()` y, si era 0, insertaba — un patrón "verificar y luego insertar" que no es atómico. Al correr los 5 archivos e2e en paralelo (cada uno levanta su propia instancia de Nest contra la misma base `coaching_test`), varias instancias vieron `count() === 0` al mismo tiempo y todas intentaron insertar las mismas 16 filas, violando la restricción única de `nombre` y tumbando el bootstrap de la app en 4 de los 5 suites. Se corrigió con un `INSERT ... ON CONFLICT DO NOTHING` (`createQueryBuilder().insert().values(...).orIgnore()`), atómico a nivel de base de datos — ya no importa cuántas instancias arranquen a la vez.

## Verificación

- Unitarios: `npm run lint` (limpio) y `npm test` → **75/75** tests.
- e2e contra `coaching_test`: **5/5 suites** (incluida la corrida en paralelo que expuso el bug de concurrencia del seed, ahora resuelto).
- `docker compose up --build`: logs confirman migración corrida sin error y "Seeded 16 competencias from the master catalog." en el primer boot.
- Verificación manual con `curl`: catálogo de 16 competencias con niveles → coachee define plan + 2 objetivos → envía (`pendiente_aprobacion`) → intento de editar objetivo general bloqueado (403) → coach aprueba (`aprobado`).
- Nota operativa (igual que en Sprint 4): el rate-limit de `/auth/login` se activó varias veces durante las pruebas manuales por repetición de logins en poco tiempo — comportamiento esperado, no un bug.
- Stack bajado con `docker compose down` al terminar.

## Revisión

Sprint 5 completo y verificado end-to-end, con un bug de concurrencia real corregido de raíz. Próximo paso: Sprint 6 (E6 — Plan de desarrollo, frontend) o, si se prioriza backend, Sprint 7 (Post-sesión y seguimiento) o Sprint 8 (Biblioteca de recursos), que no dependen de Sesiones ni de Sprint 6.

---

# Sprint 6 (E6) — Plan de desarrollo, frontend real — 2026-07-16

## Contexto

El usuario pidió explícitamente construir ahora el **frontend Vue real** (no más backend-only) para el Plan de Desarrollo: sus 3 sub-pestañas (Definición / Hábito y ejecución / Formación) y la vista de aprobación del coach, conectado a la API de los Sprints 2-5. Al revisar el alcance real de E6 apareció un vacío: Hábito y Formación no tenían dónde persistir — deliberadamente dejados fuera de Sprint 5 porque ninguna historia los pedía todavía. Este sprint agrega esos campos al backend **y** construye el frontend, ambos conectados de punta a punta (sin fachada sin persistencia).

## Parte 1 — Extensión de backend

- [x] `PlanDesarrollo` gana columnas nullable de libre edición (nunca bloqueadas en `pendiente_aprobacion`): `habitoCuando/EnVezDe/VoyA/Obvio/Sencillo/Atractivo/Satisfactorio`, `formacionLibros/Articulos/Videos/Podcasts/PracticaGuiada`.
- [x] Nueva entidad `ActividadEjecucion` (planId FK cascade, objetivoId FK real a `ObjetivoEspecifico`, actividad, fechaInicio/fechaFin libres tipo "Semana 1", estado pendiente/en_curso/completada); endpoints `POST/PATCH/DELETE /planes-desarrollo/me/actividades[/:id]`, de libre edición.
- [x] `GET /auth/me` — devuelve `{id, email, role, empresaId}` desde el JWT ya validado; lo usa el frontend para restaurar sesión al recargar sin decodificar el JWT a mano.
- [x] Migración `AddHabitoFormacionActividad` generada y corrida.
- [x] Tests unitarios: hábito/formación editables aun con plan `pendiente_aprobacion`, CRUD de actividades (incluye rechazo si `objetivoId` no es del propio plan).

## Parte 2 — Frontend Vue real

- [x] `vue-router@5.2.0` + `pinia@4.0.2`. Tokens JWT en `localStorage` (trade-off anotado como hardening de Sprint 14).
- [x] `api/client.ts` (fetch wrapper con reintento tras refresh en 401), `stores/auth.ts` (Pinia, persistido en localStorage), `router/index.ts` (guards por rol).
- [x] `LoginView`, `AppShell`, `coachee/PlanDesarrolloView` (3 sub-pestañas), `coach/PlanesListView` + `PlanDetailView` (aprobar/solicitar cambios). Vista mínima "no disponible" para rol Empresa (sin historias de Empresa en E6).
- [x] Tests unitarios: store de auth + bloqueo de campos gated en `DefinicionTab`.

## Tres bugs reales encontrados por prueba manual en navegador (no teóricos)

1. **404 en rutas del SPA**: nginx servía el build estático sin fallback, así que cualquier ruta que no fuera `/` (ej. `/login`) devolvía 404 al recargar o navegar directo. Corregido agregando `frontend/nginx.conf` con `try_files $uri $uri/ /index.html;` y copiándolo en el `Dockerfile`.

2. **Campos se vaciaban al volver a una sub-pestaña ya guardada**: las 3 tabs tenían un `watch(() => props.plan, ...)` para resincronizar el formulario local si el plan cambiaba. Pero cualquier acción en una tab (ej. agregar un objetivo en Definición) dispara un refetch del plan completo — ese `watch` entonces pisaba en silencio los campos aún no guardados de la tab activa. Corregido eliminando los 3 `watch`: cada tab ya se remonta desde cero al cambiar de sub-pestaña (`v-if`/`v-else-if` en el padre), así que no necesita resincronizarse en caliente.

3. **Bug de backend real, más sutil — campos de Definición se perdían en la respuesta tras guardar Hábito o Formación por separado**: incluso después de corregir (2), volver a Definición tras guardar Hábito y Formación mostraba todos los campos vacíos, aunque la base de datos sí tenía los valores correctos (confirmado con `curl` directo). Causa raíz: `PlanesDesarrolloService.updateOwn()` hacía `Object.assign(plan, dto)`. Con `target: ES2023` en `tsconfig.json`, `useDefineForClassFields` queda activo por defecto, así que cada campo `@IsOptional()` no presente en el body de la request igual existe como propiedad propia `undefined` en la instancia del DTO transformada por `class-transformer`. `Object.assign` copia esas propiedades `undefined` sobre la entidad en memoria — TypeORM omite esas columnas al hacer `UPDATE` (por eso la base de datos quedaba intacta), pero el objeto devuelto en la respuesta HTTP sí quedaba con esos campos perdidos. Reproducido de forma aislada con `curl`: un `PATCH /planes-desarrollo/me` con solo `{"habitoCuando":"cuando"}` devolvía `competenciaId`, `nivelActual`, `nivelObjetivo` y `objetivoGeneral` en `null` en la respuesta, pese a que un `GET` inmediatamente después mostraba los valores correctos en la base. Se encontró el mismo patrón (mismo riesgo) en `updateObjetivo`/`updateActividad` de este servicio y en `EmpresasService.update`/`CoacheesService.update`/`updateOwnContact`. Corregido de raíz en los 6 sitios con un helper nuevo `common/assign-defined.util.ts` (`assignDefined`) que copia solo las propiedades cuyo valor no es `undefined`, reemplazando el `Object.assign` genérico.

## Verificación

- Backend: `npm run lint` (limpio), `npm test` → **81/81** tests, `npm run test:e2e` contra `coaching_test` recreada y migrada desde cero → **5/5 suites**.
- Frontend: `npm run lint` (limpio), `npm test` (vitest) → **6/6** tests, `npm run build` (incluye `vue-tsc -b`) sin errores de tipos.
- `docker compose up --build` completo (postgres, redis, backend, frontend, nginx).
- Verificación en navegador real con Playwright (skill `run`, ver memoria de sesión sobre `chromium-cli` no disponible → se usó `npx playwright` directo): login coach → crear coachee → login coachee → completar Definición (competencia, niveles, plazo, descripción, objetivo general, 1 objetivo específico) → guardar → cambiar a Hábito, completar y guardar → cambiar a Formación, completar y guardar → volver a Definición → **todos los campos siguen visibles y correctos** (antes del fix, quedaban en blanco) → enviar plan → `Pendiente de aprobación` → como coach, `GET /planes-desarrollo?estado=pendiente_aprobacion` lo lista → `POST .../aprobar` → `aprobado`. Captura final adjunta al proceso de verificación.
- Stack bajado con `docker compose down` al terminar.

## Revisión

Sprint 6 completo y verificado end-to-end, con tres bugs reales encontrados y corregidos mediante prueba real en navegador (no solo tests automatizados) — dos de frontend (404 de SPA, pérdida de datos en formularios por un `watch` mal puesto) y uno de backend genuinamente sutil (pérdida de campos en la respuesta de un `PATCH` parcial por `Object.assign` + semántica de `useDefineForClassFields`), este último corregido de forma sistémica en los 6 lugares del código que compartían el mismo patrón de riesgo, no solo en el punto donde se manifestó. Próximo paso: Sprint 7 (Post-sesión y seguimiento) o Sprint 8 (Biblioteca de recursos).

---

# Sprint 7 (E7) — Post-sesión y seguimiento del coachee — 2026-07-16

## Contexto

Ejecución de E7 de `docs/jira-plan.md` (13pt/80h, depende de E4 y E6), full-stack de punta a punta como en el Sprint 6. Alcance interpretado desde `appcoaching_1.md` (spec del prototipo React original) para resolver ambigüedades no cubiertas por el criterio de aceptación literal: el post-sesión lo completa el **coachee** (no el coach) por cada sesión ya realizada; `avanceRealDe` se calcula desde la autoevaluación de "cercanía al objetivo" (1-10 → %) del post-sesión más reciente publicado, sin fallback inventado (si no hay autoevaluación aún, se muestra "sin datos" en vez de fabricar un número); el diario de reflexión se modeló como un documento único persistente por coachee (no entradas fechadas independientes), consistente con "el diario se guarda y muestra confirmación al guardar" del criterio de aceptación.

## Backend

- [x] `sesiones/` — nueva entidad `PostSesion` (1:1 con `Sesion`, cascade): aprendizaje, utilidad (1-5), cercaniaObjetivo (1-10), recomendación, temas propuestos, `publicada`. Patrón de borrador editable → publicar (igual que Plan de Desarrollo): `PATCH /sesiones/:id/post-sesion` mientras no está publicada, `POST /sesiones/:id/post-sesion/publicar` exige los 3 campos clave y bloquea toda edición futura. Ambos rechazan sesiones futuras (el post-sesión solo aplica a sesiones ya realizadas). `GET /sesiones/me` y `GET /sesiones` (coach) devuelven cada sesión con su `postSesion` anidado.
- [x] Nuevo módulo `seguimiento/` — `Logro` (coachee agrega/lista/borra los suyos; coach/empresa los leen vía scoping ya existente de `CoacheesService.findOneForActor`), `EntradaDiario` (documento único por coachee, auto-creado en blanco, `GET`/`PATCH /seguimiento/diario/me`), `avanceGeneral(coacheeId)` (única función, reutilizada por los endpoints de coachee/coach/empresa — mismo número en las 3 vistas, tal como pedía el criterio de aceptación) y `lineaProgreso(coacheeId)` (serie de cercanía al objetivo por sesión, para el gráfico de evolución).
- [x] Migración `AddPostSesionLogroDiario` generada y corrida contra dev + `coaching_test`.
- [x] Tests unitarios: `PostSesionesService` (rechazo de sesión futura, borrador editable, bloqueo tras publicar, validación de campos requeridos para publicar, cálculo de avance y de la línea de progreso) y `SeguimientoService` (logros con ownership, diario auto-creado y actualizado, delegación del avance a `PostSesionesService`).
- [x] e2e (`test/post-sesion-seguimiento.e2e-spec.ts`): flujo completo borrador → publicar → inmutable (edición y republicación rechazadas) → avance idéntico visto como coachee y como coach → línea de progreso → logros (alta, lectura del coach, borrado) → diario (auto-creación, guardado, persistencia).

## Frontend

- [x] `api/sesiones.ts` (post-sesión: guardar borrador, publicar) y `api/seguimiento.ts` (logros, diario, avance, línea de progreso).
- [x] `views/coachee/SesionesView.vue`: lista de sesiones (más reciente primero), formulario de post-sesión para sesiones realizadas sin publicar, resumen de solo lectura una vez publicado.
- [x] `views/coachee/ProgresoView.vue` + `components/ProgresoLineaTiempo.vue` (SVG inline, sin librería de gráficos): avance general, línea de tiempo de cercanía al objetivo, logros (alta/lista/borrado), diario con botón Guardar y confirmación tipo toast.
- [x] `views/coach/CoacheeSeguimientoView.vue`: misma información en solo lectura para el coach (avance, línea de progreso, recomendación/temas del post-sesión más reciente, logros), enlazada desde `PlanDetailView` ("Ver seguimiento").
- [x] Nav por rol agregada al header de `AppShell` (Plan / Sesiones / Progreso para el coachee); rutas nuevas en `router/index.ts`.
- [x] Tests unitarios: `ProgresoLineaTiempo` (estado vacío vs. puntos renderizados) y `SesionesView` (formulario editable vs. resumen de solo lectura vs. sesión futura sin formulario).

## Verificación

- Backend: `npm run lint` (limpio), `npm test` → **96/96** tests, `npm run test:e2e` contra `coaching_test` → **6/6 suites**.
- Frontend: `npm run lint` (limpio), `npm test` (vitest) → **11/11** tests, `npm run build` (`vue-tsc -b` + vite) sin errores de tipos.
- `docker compose up --build` completo.
- Verificación real en navegador con Playwright: coach agenda una sesión pasada y una futura para un coachee de prueba → coachee completa el post-sesión de la sesión pasada (aprendizaje, utilidad 4/5, cercanía 7/10, recomendación, temas) → guarda borrador → publica → confirma que queda de solo lectura y que un segundo intento de editar/publicar es rechazado → en "Mi progreso" ve **70%** de avance general y el punto correspondiente en la línea de tiempo → agrega un logro y guarda el diario (toast visible) → recarga la página y confirma que avance, logro y diario persisten → como coach, entra a "Ver seguimiento" del mismo coachee y confirma que ve **exactamente el mismo 70%**, la misma recomendación/temas y el mismo logro.
- Stack bajado con `docker compose down` al terminar.

## Revisión

Sprint 7 completo y verificado end-to-end, sin bugs nuevos encontrados en la verificación de navegador (a diferencia de los Sprints 3, 5 y 6). El fix sistémico de `assignDefined` del Sprint 6 se reutilizó directamente en `PostSesionesService.upsertOwn` desde el diseño, evitando reintroducir el mismo bug en el nuevo módulo. Próximo paso: Sprint 8 (Biblioteca de recursos, depende solo de E3) o Sprint 9 (Ciclos e informes backend, depende de E6 y E7 — ya satisfechos).

---

# Sprint 8 (E8) — Biblioteca de recursos — 2026-07-16

## Contexto

Ejecución de E8 de `docs/jira-plan.md` (8pt/60h, depende de E3), full-stack de punta a punta. La historia "CRUD de recursos + subida a almacenamiento de objetos" se interpretó a la luz de la exclusión de integraciones externas del MVP (confirmada al inicio del proyecto): la subida de archivos es **real** (bytes efectivamente persistidos, descargables después), pero a **disco local del propio backend** (volumen Docker), no a un proveedor externo tipo S3 — eso sería justo el tipo de integración con terceros que quedó fuera de alcance. Un recurso de tipo "link" simplemente guarda una URL, sin integración alguna.

## Backend

- [x] Módulo `recursos/` — entidad `Recurso` (titulo, descripcion, etiquetas como `simple-array`, tipo `archivo`|`link`, url o archivoNombre/archivoPath), `AsignacionRecurso` (N:N recurso↔coachee con `activa` boolean y `origen` coach|autoasignado, unique por par), `AprendizajeRecurso` (coacheeId, recursoId, contenido).
- [x] `POST /recursos` (Coach, multipart con `FileInterceptor` + `diskStorage` en un volumen dedicado) crea un recurso de tipo archivo o link; `GET /recursos?search=&etiqueta=` (búsqueda por título + filtro por etiqueta, ambos combinables); `PATCH/DELETE /recursos/:id`.
- [x] `PUT /recursos/:id/asignaciones/:coacheeId` (Coach, toggle activa/desactiva); `POST/DELETE /recursos/:id/autoasignar` (Coachee, autoasignación — no puede quitar un recurso que le asignó su coach, solo los que se autoasignó); `GET /recursos/me` (biblioteca personal: asignados + autoasignados).
- [x] `GET /recursos/:id/archivo` — descarga protegida: el coach siempre puede, el coachee solo si el recurso está en su biblioteca (403 en caso contrario, verificado con un segundo coachee sin acceso).
- [x] Aprendizajes prácticos: `POST/GET/DELETE` scoped al propio coachee (rechaza si el recurso no está en su biblioteca), `GET` de solo lectura para el coach.
- [x] Migración `AddRecursos` generada y corrida contra dev + `coaching_test`.
- [x] Tests unitarios: `RecursosService` (validación por tipo, parseo de etiquetas, asignación/toggle, autoasignación con rechazo de quitar lo asignado por el coach, biblioteca personal, búsqueda+filtro combinados) y `AprendizajesRecursoService` (ownership).
- [x] e2e (`test/recursos.e2e-spec.ts`): sube recurso link + recurso archivo (subida real) → busca y filtra → coach asigna → coachee ve su biblioteca → se autoasigna otro recurso → descarga el archivo real (contenido verificado byte a byte) → un segundo coachee sin acceso recibe 403 → registra un aprendizaje, visible también para el coach → intenta quitar el recurso asignado por el coach (403) → quita su propia autoasignación.

## Bug de concurrencia real encontrado por el propio e2e (no teórico) — mismo patrón del Sprint 5, esta vez en el seed del coach

Al recrear `coaching_test` completamente desde cero (sin ningún dato previo) para correr la suite completa, **6 de 7 suites e2e fallaron** con `duplicate key value violates unique constraint` sobre el email del coach. Causa: `SeedService.onApplicationBootstrap()` hacía `hasAnyWithRole(COACH)` (un `SELECT`) y luego `createUser(...)` (un `INSERT`) — el mismo patrón "verificar y luego insertar" no atómico que ya había causado el bug de concurrencia de `CompetenciasService` en el Sprint 5. Como cada archivo `.e2e-spec.ts` bootstrapea su propia instancia completa de Nest, y Jest corre los 7 archivos en paralelo, todas las instancias vieron "no hay coach todavía" al mismo tiempo y todas intentaron crear el mismo email. **Nunca se había manifestado antes** porque en sesiones anteriores `coaching_test` ya tenía el coach sembrado de corridas previas (nunca se había recreado la base completamente vacía y corrido la suite entera de una sola vez). Corregido de raíz con el mismo patrón que Sprint 5: nuevo método `UsersService.seedCoachIfMissing()` que hace `INSERT ... ON CONFLICT (email) DO NOTHING` de forma atómica, reemplazando el `hasAnyWithRole` + `createUser` en `SeedService`. Re-verificado corriendo la suite completa 2 veces seguidas contra una base recién creada: **7/7 suites** ambas veces.

## Bug de RBAC real encontrado por la propia prueba en navegador

`GET /recursos` (catálogo, con búsqueda y filtro) había quedado con `@Roles(Role.COACH)` únicamente, copiado del resto de endpoints de escritura del mismo controlador. Pero `BibliotecaView.vue` del coachee necesita ese mismo endpoint para mostrar el "Catálogo general" y poder autoasignarse recursos — al probar el flujo completo en el navegador, la pestaña de catálogo del coachee quedó vacía y la consola mostró un 403. Corregido agregando `Role.COACHEE` a los roles permitidos de ese endpoint (de solo lectura; los endpoints de creación/edición/borrado/asignación siguen siendo exclusivos del coach).

## Frontend

- [x] `api/recursos.ts` (CRUD, búsqueda/filtro, asignación, autoasignación, aprendizajes, descarga de archivo vía blob) y `api/coachees.ts` (listado simple para el selector de asignación). `api/client.ts` ganó `apiUpload` (multipart, reutilizando el mismo flujo de refresh-on-401) y `apiDownload` (blob, para descargar el archivo con el Authorization header que un `<a href>` no puede enviar).
- [x] `views/coach/RecursosView.vue`: alta de recurso (link o archivo real), buscador + filtro por etiqueta en tiempo real, lista con checklist expandible de asignación por coachee.
- [x] `views/coachee/BibliotecaView.vue`: dos pestañas ("Mi biblioteca" / "Catálogo general"), autoasignación desde el catálogo, quitar autoasignación propia, aprendizajes prácticos por recurso, descarga de archivos.
- [x] Nav por rol ampliada en `AppShell` (coach: Planes/Recursos; coachee: +Biblioteca); rutas nuevas en `router/index.ts`.
- [x] Tests unitarios: `RecursosView` (formulario condicional por tipo, checklist de asignación) y `BibliotecaView` (separación correcta entre biblioteca propia y catálogo completo).

## Verificación

- Backend: `npm run lint` (limpio), `npm test` → **117/117** tests, `npm run test:e2e` contra `coaching_test` recreada desde cero → **7/7 suites** (verificado dos veces tras el fix del seed).
- Frontend: `npm run lint` (limpio), `npm test` (vitest) → **15/15** tests, `npm run build` sin errores de tipos.
- `docker compose up --build` completo, con volumen nuevo `resource_uploads` montado en `/app/uploads` del backend para persistir archivos subidos entre recreaciones del contenedor (mismo patrón que `postgres_data`).
- Verificación real en navegador con Playwright: coach sube un recurso link y un recurso archivo (subida real de un `.txt`) → busca por título y filtra por etiqueta (ambos acotan la lista correctamente) → asigna el recurso link a un coachee de prueba → coachee ve ese recurso en "Mi biblioteca" → en "Catálogo general" se autoasigna el recurso archivo → ambos aparecen en su biblioteca → descarga el archivo real y el contenido descargado coincide byte a byte con el original → registra un aprendizaje práctico, visible también para el coach. La primera corrida expuso el bug de RBAC (catálogo vacío + 403 en consola); tras corregirlo, la segunda corrida completa pasó sin errores.
- Stack bajado con `docker compose down` al terminar.

## Revisión

Sprint 8 completo y verificado end-to-end, con dos bugs reales encontrados y corregidos: uno de concurrencia en el seed del coach (mismo patrón ya visto en Sprint 5, esta vez descubierto por primera vez al correr la suite e2e completa contra una base verdaderamente vacía) y uno de RBAC en el catálogo de recursos (encontrado por la prueba real en navegador, no por los tests automatizados — ningún test unitario o e2e ejercitaba el acceso del coachee a `GET /recursos` porque los tests de recursos fueron escritos asumiendo el rol correcto de antemano). Próximo paso: Sprint 9 (Ciclos e informes, backend) o Sprint 10 (su contraparte de frontend), ya que E6 y E7 (sus dependencias) están satisfechas.

---

# Sprint 9 (E9) — Ciclos e informes, backend — 2026-07-16

## Contexto

Ejecución de E9 de `docs/jira-plan.md` (11pt/60h, depende de E6 y E7, ya satisfechas). A diferencia de los Sprints 6-8, esta épica está explícitamente etiquetada como "backend" en el plan (su contraparte de frontend es el Sprint 10), así que se ejecutó **solo backend**, verificado con tests unitarios, e2e y `curl` manual — mismo patrón que el Sprint 5. Elegir el camino más eficiente: E9 desbloquea tanto a E10 (frontend) como a E11 (panel de negocio), así que era el sprint con más apalancamiento sobre el resto del backlog.

## Modelo de datos

- [x] Entidad `CicloCoaching` (coacheeId, totalSesiones, fechaApertura, fechaCierre nullable, resultado enum `logrado`/`medianamente_logrado`/`no_logrado` nullable, resumenReunionInicial, informeFinal, informePdfNombre/Path). Solo puede haber **un ciclo abierto a la vez** por coachee (rechazo 409 al intentar abrir un segundo mientras el primero sigue abierto); una vez cerrado, se puede abrir uno nuevo para el mismo coachee (re-procesos).
- [x] `Sesion` gana `cicloId` (FK nullable, `ON DELETE SET NULL`): cada sesión se vincula automáticamente al ciclo abierto del coachee en el momento de crearla (si existe), sin exigir que exista un ciclo para poder agendar — mantiene compatibilidad con el flujo de Sprint 4.
- [x] Estado computado por ciclo (no persistido, calculado en cada lectura): `sesionesRealizadas` (sesiones vinculadas con `fechaHora` ya pasada), `sesionesRestantes` (`totalSesiones - sesionesRealizadas`, con piso en 0), `alertaPorVencer` (ciclo abierto y `sesionesRestantes` ≤ 2 — story "Alerta de ciclo por vencer").

## Endpoints

- [x] `POST /ciclos` (Coach) abre un ciclo; `POST /ciclos/:id/cerrar` (Coach) lo cierra con `resultado` obligatorio (rechaza cerrar dos veces).
- [x] `PATCH /ciclos/:id/resumen-reunion-inicial` (Coach) — historia "solo coach edita, empresa solo lee": el rol Empresa ni siquiera está en la lista de roles permitidos del endpoint, así que cualquier intento suyo es 403 automático vía `RolesGuard`, sin lógica adicional que mantener.
- [x] `GET /ciclos/me`, `GET /ciclos/me/actual` (Coachee); `GET /ciclos/coachee/:coacheeId`, `GET /ciclos/coachee/:coacheeId/actual` (Coach y Empresa, con el mismo scoping ya probado de `CoacheesService.findOneForActor`) — mismo número de `alertaPorVencer` visible en las 3 vistas, coherente con el patrón de `avanceRealDe` del Sprint 7.
- [x] `POST /ciclos/:id/generar-borrador-informe` (Coach): arma un texto desde el plan de desarrollo del coachee (objetivo general + objetivos específicos, o "sin plan definido" si no existe todavía), el conteo real de sesiones realizadas del ciclo, y el avance general (reutilizando `SeguimientoService.avanceGeneralForCoachee` del Sprint 7 sin duplicar lógica). Lo guarda en `informeFinal`. `PATCH /ciclos/:id/informe-final` permite editarlo a mano después.
- [x] `POST /ciclos/:id/informe-pdf` (Coach, subida real a disco local, mismo patrón que `recursos/` del Sprint 8) y `GET /ciclos/:id/informe-pdf` (descarga protegida: coach siempre, coachee solo si es dueño del ciclo, empresa con el scoping ya probado).
- [x] Migración `AddCiclosCoaching` (tabla nueva + columna `ciclo_id` en `sesiones`) generada y corrida contra dev + `coaching_test`.
- [x] Tests unitarios de `CiclosService` (apertura con rechazo de doble apertura, cierre con rechazo de doble cierre, cálculo de `alertaPorVencer` en ciclo abierto vs. cerrado, generador de informe con y sin plan de desarrollo, RBAC de descarga para los 3 roles) y de `SesionesService.create` (vinculación automática al ciclo abierto).
- [x] e2e (`test/ciclos.e2e-spec.ts`): abrir ciclo → segundo intento rechazado (409) → 2 sesiones pasadas se vinculan solas → alerta activa (2 de 3 sesiones) → visible igual para coach, coachee y empresa → empresa no puede editar el resumen (403) → generar borrador de informe → editarlo a mano → subir PDF real → descargar (coach y coachee, contenido idéntico byte a byte) → un coachee ajeno no puede descargar (403) → cerrar con resultado → alerta se apaga → cierre doble rechazado (409) → historial del coachee → se puede abrir un ciclo nuevo tras cerrar el anterior.

## Verificación

- `npm run lint` (limpio), `npm test` → **131/131** tests, `npm run test:e2e` contra `coaching_test` recreada desde cero → **8/8 suites**.
- `docker compose up --build` completo; verificación manual con `curl` del flujo completo (abrir → sesión se vincula → alerta → generar informe → subir/descargar PDF real → cerrar), sin bugs nuevos encontrados esta vez (a diferencia de los últimos 3 sprints).
- Frontend: sin cambios este sprint (E9 es explícitamente backend); se confirmó igualmente que `npm run build` sigue limpio, ya que el campo nuevo `cicloId` en `Sesion` no rompe la interfaz TS del frontend (los campos extra en JSON no afectan el tipado estructural existente).
- Stack bajado con `docker compose down` al terminar.

## Revisión

Sprint 9 completo y verificado end-to-end (backend), sin bugs nuevos — el diseño reutilizó deliberadamente los mecanismos ya endurecidos en sprints anteriores (`assignDefined` no fue necesario aquí porque los updates son de un solo campo requerido, no parciales; el scoping de Empresa y el patrón de subida a disco local se reusaron tal cual). Próximo paso natural: Sprint 10 (Ciclos e informes, frontend — certificado descargable, UI de informe final, resumen de reunión inicial de solo lectura para empresa) o Sprint 11 (Panel de negocio, que también depende de E9 y ya quedó satisfecho).

---

# Sprint 10 (E10) — Ciclos e informes, frontend — 2026-07-17

## Contexto

Ejecución de E10 de `docs/jira-plan.md` (10pt/60h, depende de E9, satisfecha en el Sprint 9). Frontend puro sobre el backend de ciclos ya construido. Esta es la primera vez que el rol **Empresa** deja de ser un placeholder ("Todavía no disponible") y pasa a tener vistas reales — dos de las cinco historias de esta épica son explícitamente de solo lectura para Empresa (resumen de reunión inicial, resultado del proceso), así que no tenía sentido seguir posponiéndolo.

## Vistas nuevas

- [x] `views/coach/CicloView.vue`: si el coachee no tiene ciclo abierto, formulario para abrir uno (sesiones contratadas + resumen inicial opcional). Si tiene uno abierto: badge de alerta por vencer, resumen de reunión inicial editable, generador de borrador de informe + edición manual + guardar, subida de PDF, y cierre con selector de resultado (Logrado/Medianamente logrado/No logrado). Enlazada desde `CoacheeSeguimientoView` ("Ver ciclo").
- [x] `components/HistorialCiclos.vue`: lista expandible de ciclos cerrados (fecha de apertura/cierre, badge de resultado, resumen, informe final, descarga de PDF) — **compartida entre la vista del coach y la de empresa**, ya que el historial es de solo lectura en ambos casos por igual; evita duplicar la lógica de "solo lectura" en dos componentes.
- [x] `views/coachee/CertificadoView.vue`: certificado imprimible (sin librería de PDF — usa `window.print()` con CSS `print:` de Tailwind para ocultar los controles y estilizar el borde al imprimir) con nombre del coachee, objetivo general del plan, resultado y fechas del ciclo. Solo se genera para ciclos cerrados con resultado. Enlazado desde una nueva sección "Certificados" en `ProgresoView.vue`.
- [x] `views/empresa/CoacheesView.vue` (nueva página de inicio para Empresa) y `views/empresa/CicloView.vue`: lista de coachees de la empresa (ya scoped en el backend desde el Sprint 3) → ciclo actual de solo lectura (resumen de reunión inicial, sesiones, alerta) + `HistorialCiclos` reutilizado. **Se eliminó `NotAvailableView.vue`** (el placeholder de Empresa) y se limpió la redirección duplicada `homeFor()` que existía tanto en `LoginView.vue` como en el guard del router.
- [x] `api/ciclos.ts` (abrir/cerrar/resumen/informe/generar borrador/PDF/historial/actual) y extensión de `api/coachees.ts` con `getMyCoachee`/`getCoachee` (antes solo existía el listado).
- [x] Nav ampliada en `AppShell` para los 3 roles (Empresa nunca había tenido nav real).
- [x] Tests unitarios de `HistorialCiclos` (estado vacío vs. expandir para revelar el informe) y `CicloView` del coach (formulario de apertura vs. panel de gestión con ciclo abierto).

## Bug real encontrado por la propia prueba en navegador (no por los tests automatizados)

`CicloView.vue` (coach) y, se descubrió al revisar el mismo patrón, también `CoacheeSeguimientoView.vue` del **Sprint 7**, usaban `getPlanByCoachee(coacheeId)` únicamente para leer el nombre del coachee en el título de la página. Ese endpoint devuelve 404 si el coachee todavía no tiene un Plan de Desarrollo creado — algo que solo ocurre automáticamente cuando el coachee visita su propio `/coachee/plan` por primera vez. Como ambas vistas cargaban los datos con `Promise.all(...)` sin ningún `try/catch`, el 404 hacía que **la promesa combinada rechazara entera**, la vista se quedaba congelada en "Cargando…" para siempre, y ningún otro dato (ciclo, avance, sesiones) llegaba a mostrarse — un fallo silencioso, sin mensaje de error visible. Se reprodujo exactamente así: un coachee de prueba recién creado, con un ciclo abierto pero que nunca había entrado a ver su plan, hacía que la pantalla de "Ciclo de coaching" del coach quedara en blanco indefinidamente. Corregido de raíz reemplazando `getPlanByCoachee()` por `getCoachee(coacheeId)` (ya existente para la vista de Empresa, sin ninguna dependencia de que exista un plan) en ambos archivos — el nombre del coachee no debería depender de un dato completamente ajeno a lo que la pantalla necesita mostrar.

## Verificación

- `npm run lint` (limpio), `npm test` (vitest) → **19/19** tests, `npm run build` (`vue-tsc -b` + vite) sin errores de tipos.
- `docker compose up --build` (sin migraciones nuevas, Sprint 10 es 100% frontend).
- Verificación real en navegador con Playwright, de punta a punta: coach abre un ciclo (2 sesiones contratadas) → ve la alerta por vencer activa (recién abierto) → genera el borrador de informe automático → lo edita a mano → sube un PDF real → cierra el ciclo con resultado "Logrado" → el historial expandible lo muestra correctamente. Como coachee: ve el link de "Certificado" en Progreso, lo abre, y el certificado muestra su nombre y el resultado "Logrado". Como empresa (usuario nuevo, primera vez con una vista real): ve al coachee en su lista, entra a su ciclo, confirma que no hay ningún campo editable, y ve el resumen de reunión inicial y el resultado marcado por el coach en el historial. La primera corrida expuso el bug de `getPlanByCoachee`; tras corregirlo, la segunda corrida completa pasó sin errores.
- Stack bajado con `docker compose down` al terminar.

## Revisión

Sprint 10 completo y verificado end-to-end, con un bug real encontrado y corregido — notable porque no era un bug nuevo de este sprint, sino uno latente desde el Sprint 7 que solo se manifestaba con un coachee que nunca hubiera visitado su propio Plan de Desarrollo (exactamente el tipo de caso borde que los flujos de prueba anteriores, siempre creados de punta a punta, nunca habían ejercitado). Con este sprint, los tres roles (Coach, Coachee, Empresa) tienen ahora una experiencia completa y real en la plataforma. Próximo paso: Sprint 11 (Panel de negocio y reportes del Coach, depende de E9 ya satisfecha) o Sprint 12 (Legal, auditoría y búsqueda global, depende solo de E2).

---

# Sprint 11 (E11) — Panel de negocio y reportes, Coach — 2026-07-17

## Contexto

Ejecución de E11 de `docs/jira-plan.md` (13pt/80h, depende de E9, satisfecha en el Sprint 9). Full-stack de punta a punta, como los Sprints 6-8 y 11 no tiene contraparte de frontend separada en el plan. Elegido por ser el sprint de mayor apalancamiento restante tras el Sprint 10 (E12 solo depende de E2, pero E11 ya estaba iniciado en el análisis y no tiene dependencias pendientes).

## Modelo de datos — dos campos nuevos, sin tablas nuevas

- [x] `Empresa` gana `pagada` (boolean, default false — gating de si su ingreso cuenta en el período) y `horasContratadas` (int nullable, presupuesto de horas que el coach define).
- [x] `Coachee` gana `areaGerencia` (varchar nullable, texto libre que el coach asigna, ej. "Comercial", "Operaciones") — no existía ningún concepto de departamento/área en el modelo hasta ahora; se agregó específicamente para la historia de comparativa por área.

## `calcularResumenCobros()` — única fuente de verdad

- [x] Tarifa efectiva por sesión: `coachee.tarifaPropia ?? coachee.empresa?.tarifaHora ?? 0` (reutiliza el campo `tarifaPropia` que ya existía desde el Sprint 3 para independientes, nunca antes consumido en ningún cálculo real).
- [x] Un coachee **independiente** (sin empresa) siempre cuenta hacia el ingreso total, porque le paga directamente al coach; un coachee **de empresa** solo cuenta si esa empresa está marcada `pagada`. Las horas realizadas (métrica de trabajo, no de cobro) se cuentan siempre, independiente del estado de pago.
- [x] Desglose por empresa (horas contratadas/consumidas, ingreso del período/proyectado) + totales generales — una sola función, `GET /negocio/resumen` (Coach) la consume junto con `coacheesActivos` (conteo de ciclos abiertos) y `satisfaccionPromedio` (promedio de `PostSesion.utilidad` publicados, global — reutiliza datos del Sprint 7 sin tabla nueva).
- [x] `CiclosService` gana `findAllAbiertosConEstado()` (y se exporta el módulo), reutilizado tanto por el cálculo de `coacheesActivos` como por el panel de alertas — evita duplicar el cálculo de `alertaPorVencer`/`sesionesRestantes` ya construido en el Sprint 9.

## Panel de alertas y comparativa por área

- [x] `GET /negocio/alertas` (Coach): ciclos con `alertaPorVencer`, coachees activos sin ningún logro en los últimos 30 días, coachees activos sin una sesión futura agendada — las tres iteran solo sobre ciclos **abiertos** (coachees inactivos no generan ruido).
- [x] `GET /negocio/avance-por-area` (Coach): agrupa el avance general (reutiliza `SeguimientoService.avanceGeneralForCoachee` del Sprint 7) por `areaGerencia`, con bucket `"Sin área asignada"` para quienes no la tienen definida — así ningún coachee con datos reales queda fuera del gráfico.
- [x] Migración `AddNegocioFields` generada y corrida contra dev + `coaching_test`.
- [x] Tests unitarios de `NegocioService`: tarifa efectiva con/sin `tarifaPropia`, independientes siempre cuentan, empresa no pagada cuenta horas pero no ingreso, separación período/proyectado, agrupación por alertas y por área.
- [x] e2e (`test/negocio.e2e-spec.ts`): empresa pagada + empresa no pagada + independiente, ciclo que se vence exactamente con la sesión contratada, post-sesión publicado que alimenta avance y satisfacción, verificación de que la empresa no puede ver campos editables en ningún punto ajeno a este sprint. Las cifras verdaderamente globales de la plataforma (`horasRealizadasTotal`, `coacheesActivos`) se comparan por **delta** contra una foto "antes" en vez de valores absolutos, porque otras suites e2e corren en paralelo contra la misma base y también crean sesiones/ciclos del mes en curso — los ingresos sí se verifican exactos, porque ninguna otra suite usa los campos nuevos `pagada`/`tarifaPropia`.

## Frontend

- [x] `views/coach/NegocioView.vue`: 5 tarjetas KPI (horas, ingreso del período, proyectado, coachees activos, satisfacción con ★), panel de alertas de seguimiento (3 columnas, cada coachee clickeable hacia su vista de seguimiento), gráfico de barras de avance por área (SVG inline, mismo patrón sin librería que `ProgresoLineaTiempo`), tabla por empresa con checkbox de "pagada" y horas contratadas editables inline (PATCH inmediato).
- [x] Exportar reporte, 100% client-side y sin integración externa: **PDF** vía `window.print()` (reutiliza el patrón `print:` de Tailwind ya usado en el certificado del Sprint 10 para ocultar nav/botones al imprimir) y **Excel** vía SheetJS (`xlsx`, `XLSX.utils.json_to_sheet` + `XLSX.writeFile`, genera el `.xlsx` en el navegador y dispara la descarga sin ningún llamado a servidor).
- [x] `api/negocio.ts`, `api/empresas.ts` (nuevo, antes no existía ningún cliente frontend para empresas) y `api/coachees.ts` reutilizado.
- [x] Nav ampliada en `AppShell` (coach: +Negocio); ruta `/coach/negocio`.
- [x] Tests unitarios de `NegocioView`: KPIs con formato de moneda CLP, alertas agrupadas, estado editable de la tabla por empresa, gráfico de barras.

## Nota de seguridad — dependencia con vulnerabilidad conocida sin fix

`xlsx@0.18.5` (paquete de npm registry) trae un advisory de severidad alta sin parche disponible (prototype pollution + ReDoS) — pero ambas vulnerabilidades están en la ruta de **parseo** (`XLSX.read`/`readFile`) de archivos `.xlsx` maliciosos. Este proyecto solo **escribe** archivos (`json_to_sheet` + `writeFile`) desde datos propios generados en el cliente — nunca parsea un archivo subido por nadie, en ningún punto de la aplicación — así que la superficie vulnerable no se ejercita nunca. Queda anotado (tarea de sesión) para revisar si en algún sprint futuro se agrega import/parseo de Excel, momento en el cual habría que migrar a la distribución oficial parcheada de SheetJS (se instala desde su propio CDN, no desde el paquete `xlsx` de npm).

## Verificación

- Backend: `npm run lint` (limpio), `npm test` → **140/140** tests, `npm run test:e2e` contra `coaching_test` recreada desde cero → **9/9 suites**.
- Frontend: `npm run lint` (limpio), `npm test` (vitest) → **23/23** tests, `npm run build` sin errores de tipos (el chunk de `NegocioView` pesa ~290KB por incluir SheetJS completo, pero solo se carga al entrar a esa ruta gracias al code-splitting ya existente por ruta).
- `docker compose up --build` completo.
- Verificación real en navegador con Playwright: empresa marcada "pagada" con horas contratadas → coachee con ciclo que se vence en su primera sesión, sin logros ni próxima sesión agendada, autoevaluación publicada (utilidad 5/5, cercanía 9/10) → el panel muestra las 5 tarjetas KPI correctas, las 3 alertas con ese coachee, la barra de "Comercial" en el gráfico de avance, y la fila de la empresa con el ingreso correcto ($35.000) — se edita el checkbox "pagada" y las horas contratadas directamente en la tabla y ambos cambios se guardan sin recargar la página, y se exporta un Excel real (16.8 KB) con un clic. **Sin bugs nuevos encontrados** en esta verificación — primer sprint desde el 7 sin ningún hallazgo real.
- Stack bajado con `docker compose down` al terminar.

## Revisión

Sprint 11 completo y verificado end-to-end, sin bugs nuevos. El diseño se apoyó deliberadamente en construcción ya existente en vez de reinventar cálculos: `tarifaPropia` (Sprint 3, nunca antes usado), `alertaPorVencer`/`sesionesRestantes` (Sprint 9, reexpuesto vía un nuevo método público en `CiclosService`), `avanceGeneralForCoachee` (Sprint 7) y el patrón `print:` para reportes imprimibles (Sprint 10, certificado). Único punto a vigilar a futuro: la dependencia `xlsx` con advisory sin parche (ver nota de seguridad arriba). Próximo paso: Sprint 12 (Legal, auditoría y búsqueda global) o Sprint 13 (Satisfacción y gestión comercial de Empresa, depende de E10 ya satisfecha).

---

# Sprint 12 (E12) — Legal, auditoría y búsqueda global — 2026-07-17

## Contexto

Ejecución de E12 de `docs/jira-plan.md` (8pt/55h, depende solo de E2, satisfecha desde el Sprint 2). Full-stack de punta a punta. La historia de auditoría es explícitamente "UI sobre el log del Sprint 2" — el mecanismo de auditoría (`AuditService`/`audit_logs`) ya existía desde entonces pero solo registraba eventos de autenticación (login/logout/creación de usuario/cambio de contraseña); este sprint lo expone por primera vez con una UI y, además, lo extiende a un pequeño conjunto de acciones del dominio del coaching de alto valor legal (aprobar/solicitar cambios de un plan, cerrar un ciclo), sin intentar auditar retroactivamente cada mutación de la plataforma — eso excede el alcance de 10h de la historia y es más propio del hardening del Sprint 14.

## Modelo de datos — una tabla nueva, dos campos nuevos

- [x] Entidad `DocumentoLegal` (`empresaId`, `tipo` contrato|nda, `estado` firmado|pendiente, `fecha`, `vigencia`) con upsert por el par único (empresa, tipo) — evita duplicados y simplifica el frontend, que siempre puede asumir como máximo un contrato y un NDA por empresa.
- [x] `Coachee` gana `consentimientoInformado` (boolean) y `consentimientoFecha` (se setea automáticamente al pasar a `true` y se limpia al pasar a `false`, vía un endpoint dedicado `PATCH /coachees/:id/consentimiento` en vez de mezclarlo con el PATCH genérico de perfil).

## Contratos/NDA, consentimiento y cumplimiento LPDP

- [x] Módulo `legal/`: `PUT /legal/documentos/:empresaId/:tipo` (Coach, upsert; el parámetro `tipo` se valida con `ParseEnumPipe` para devolver 400 ante un valor inválido en vez de un error crudo de Postgres). `GET /legal/resumen` (Coach): por cada empresa, contrato + NDA (con default "pendiente" si nunca se creó el documento) y el conteo de coachees con consentimiento firmado sobre el total de esa empresa.
- [x] `GET /legal/cumplimiento` (Coach): checklist de 4 medidas — 3 son hechos arquitectónicos ya vigentes desde sprints anteriores (notas privadas nunca visibles para coachee/empresa desde el Sprint 4; contacto autogestionado por el coachee desde el Sprint 3; la empresa solo ve datos agregados, nunca notas de sesión, por diseño desde el Sprint 3) y la cuarta es computada en vivo (% de coachees con consentimiento informado firmado, en toda la plataforma).

## Auditoría real y búsqueda global

- [x] `AuditService` gana `find()` (filtro por `targetId`/`action`, máximo 100 registros) y un controlador nuevo (`GET /audit`, Coach). Se agregó logging real en 2 puntos de alto valor legal: `PlanesDesarrolloController.aprobar()`/`solicitarCambios()` (acción `PLAN_APROBADO`/`PLAN_CAMBIOS_SOLICITADOS`, `targetType: 'Coachee'`) y `CiclosController.cerrar()` (`CICLO_CERRADO`), siguiendo exactamente el mismo patrón ya usado en `UsersController` desde el Sprint 2 — controlador llama al servicio, y solo si la operación tuvo éxito, registra en la auditoría.
- [x] Módulo `busqueda/`: `GET /busqueda?q=` (Coach) — `ILIKE` sobre coachees, empresas, competencias y recursos, 5 resultados por entidad.
- [x] Migración `AddLegalYAuditoria` generada y corrida contra dev + `coaching_test`.
- [x] Tests unitarios de `LegalService` (upsert vs. actualización en el mismo documento, defaults de "pendiente", conteo de consentimiento por empresa, checklist de cumplimiento con/sin el 100% firmado), `BusquedaService` (query en blanco no golpea la base, mapeo de las 4 entidades) y `CoacheesService.setConsentimiento` (fecha se setea/limpia correctamente).
- [x] e2e (`test/legal.e2e-spec.ts`): contrato pendiente por defecto → se marca firmado con fecha/vigencia → tipo inválido rechazado con 400 → consentimiento marcado → el resumen refleja ambos cambios → checklist de cumplimiento → cerrar un ciclo queda en la auditoría, filtrable por coachee y por acción → búsqueda global encuentra la empresa y el coachee recién creados.

## Frontend

- [x] `views/coach/LegalView.vue`: por cada empresa, contrato y NDA editables inline (select de estado + fecha + vigencia, cada campo guarda al cambiar) y la lista de sus propios coachees con checkbox de consentimiento; sección aparte para independientes (sin empresa, pero el consentimiento igual aplica); panel de cumplimiento LPDP al final.
- [x] `views/coach/AuditoriaView.vue`: tabla filtrable por acción y por ID de coachee.
- [x] `components/BusquedaGlobal.vue`: campo de búsqueda fijo en la nav del coach (con debounce simple), resultados agrupados por entidad en un dropdown, navegación directa a coachees/negocio/recursos.
- [x] `api/legal.ts`, `api/audit.ts`, `api/busqueda.ts` nuevos; `api/coachees.ts` extendido con `setConsentimiento` y los campos nuevos en `CoacheeListItem`.
- [x] Nav ampliada en `AppShell` (coach: +Legal, +Auditoría, + buscador).
- [x] Tests unitarios de `LegalView`: estado de contrato/NDA reflejado en los selects, coachees agrupados correctamente por empresa vs. independientes, checklist de cumplimiento renderizado.

## Verificación

- Backend: `npm run lint` (limpio), `npm test` → **152/152** tests, `npm run test:e2e` contra `coaching_test` recreada desde cero → **10/10 suites**.
- Frontend: `npm run lint` (limpio), `npm test` (vitest) → **26/26** tests, `npm run build` sin errores de tipos.
- `docker compose up --build` completo.
- Verificación real en navegador con Playwright: empresa nueva con contrato pendiente por defecto → se marca "Firmado" con fecha desde la UI → se marca el consentimiento informado del coachee (checkbox se actualiza al instante, sin recargar) → el panel de cumplimiento LPDP muestra las 3 medidas arquitectónicas activas más el porcentaje real de consentimientos de toda la plataforma → el historial de auditoría muestra `LOGIN_SUCCESS` del propio login del coach → el buscador global de la nav encuentra tanto la empresa como el coachee recién creados por su nombre. **Sin bugs nuevos encontrados** — segundo sprint consecutivo (después del 11) sin ningún hallazgo real en la verificación de navegador.
- Stack bajado con `docker compose down` al terminar.

## Revisión

Sprint 12 completo y verificado end-to-end, sin bugs nuevos. Alcance deliberadamente contenido en la historia de auditoría: se instrumentaron solo 2 acciones de alto valor legal (aprobar/solicitar cambios de plan, cerrar ciclo) en vez de auditar retroactivamente toda mutación de la plataforma, que es un esfuerzo de mucho mayor alcance más propio del Sprint 14 (hardening). Próximo paso: Sprint 13 (Satisfacción y gestión comercial de Empresa, depende de E10 ya satisfecha) — penúltimo sprint antes del cierre.

---

# Sprint 13 (E13) — Satisfacción y gestión comercial de Empresa — 2026-07-18

## Contexto

Ejecución de E13 de `docs/jira-plan.md` (depende de E10, satisfecha desde el Sprint 9 — ciclos de coaching). Cuatro historias: encuesta de satisfacción respondida por la Empresa, solicitud de un nuevo proceso de coaching (Empresa → Coach), habilitar que el Coach abra un nuevo proceso a partir de uno cerrado, y un panel de KPIs comerciales para la Empresa (procesos terminados/en curso, tasa de asistencia, satisfacción promedio). Encontré un vacío deliberado de sprints anteriores: no existía ningún campo de asistencia real en `Sesion` — se decidió agregar `asistio: boolean | null` en vez de inferirlo de la presencia de `resumenCompartido` (que mide otra cosa: si el coach compartió un resumen, no si el coachee asistió), para no introducir un proxy poco honesto solo para evitarme una migración pequeña.

## Modelo de datos y backend — módulo `satisfaccion/` nuevo

- [x] `Sesion` gana `asistio: boolean | null` (nullable — "sin registrar" es un tercer estado real, no se asume `false`); `UpdateSesionDto`/`SesionesService.update()` extendidos con el mismo patrón condicional (`if (dto.asistio !== undefined)`) usado para todos los demás campos de sesión desde el Sprint 4.
- [x] Entidades nuevas `EncuestaSatisfaccion` (`empresaId`, `calificacion` 1-5, `comentario`) y `SolicitudProceso` (`empresaId`, `nombreSugerido`, `mensaje`, `estado` pendiente|atendida) — ambas con FK cascade a `Empresa`.
- [x] Módulo `satisfaccion/` con `SatisfaccionService`/`SatisfaccionController`: `POST /satisfaccion/encuestas` y `GET /satisfaccion/encuestas/me` (Empresa), `GET /satisfaccion/encuestas/:empresaId` (Coach); `POST /satisfaccion/solicitudes` y `GET /satisfaccion/solicitudes/me` (Empresa), `GET /satisfaccion/solicitudes` (Coach, filtrable por `estado`) y `PATCH /satisfaccion/solicitudes/:id/atender`; `GET /satisfaccion/kpis/me` (Empresa) y `GET /satisfaccion/kpis/:empresaId` (Coach) — rutas `me` declaradas antes que las paramétricas en el controlador para no quedar shadowed (convención del proyecto desde el Sprint 6).
- [x] KPIs calculados en vivo, sin tabla derivada: `procesosTerminados`/`procesosEnCurso` cuentan `CicloCoaching` por `fechaCierre` no nulo/nulo entre los coachees de la empresa; `tasaAsistencia` es el % de sesiones con `asistio` registrado que son `true` (devuelve `null`, no `0`, cuando ninguna sesión tiene asistencia registrada, para distinguir "sin datos" de "0% de asistencia" en la UI); `satisfaccionPromedio` es el promedio de `calificacion` vía `AVG()` en SQL. El módulo inyecta directamente los repositorios de `Coachee`/`CicloCoaching`/`Sesion` (en vez de importar `CoacheesModule`/`CiclosModule`/`SesionesModule` completos) para evitar dependencias circulares, mismo patrón ya usado por `NegocioModule` en el Sprint 11.
- [x] `CiclosService.findAllCerradosConEstado()` (nuevo) y `GET /ciclos/cerrados` (Coach) — lista **toda la plataforma** de ciclos cerrados con su coachee, para la acción "abrir nuevo proceso con [nombre]" del panel comercial del coach. Declarado antes de `GET /ciclos/:id` en el controlador (misma convención de rutas). No hace falta ninguna lógica de "pre-fill" nueva: navegar a `/coach/coachees/:coacheeId/ciclo` para un coachee sin ciclo abierto ya muestra el formulario vacío de "abrir ciclo" desde el Sprint 10 — el botón del coach simplemente enlaza ahí.
- [x] Migración `AddSatisfaccionYAsistencia` generada y corrida contra dev + `coaching_test` recreada desde cero.
- [x] Tests unitarios: `SatisfaccionService` (crear encuesta, marcar solicitud atendida incluyendo `NotFoundException`, KPIs con empresa sin coachees devolviendo ceros/nulls, cálculo de porcentaje de asistencia, `tasaAsistencia: null` cuando no hay sesiones con asistencia registrada) y `CiclosService.findAllCerradosConEstado`.
- [x] e2e (`test/satisfaccion.e2e-spec.ts`): flujo completo con datos propios (empresa/coachee generados con sufijo único) — empresa responde encuesta → envía solicitud → coach la lista como pendiente y la marca atendida → coach registra asistencia en dos sesiones (una `true`, una `false`) → ciclo abierto y cerrado → KPIs de la empresa (vistos tanto por la propia empresa como por el coach) reflejan `procesosTerminados: 1`, `tasaAsistencia: 50`, `satisfaccionPromedio: 5` exactos (seguro por estar scopeados a `empresaId` único del test) → `GET /ciclos/cerrados` (plataforma completa, se verifica por `contains`, no por conteo exacto, porque corre en paralelo con otras suites e2e) incluye el ciclo recién cerrado.

## Frontend

- [x] `api/satisfaccion.ts` nuevo (encuestas, solicitudes, KPIs); `api/ciclos.ts` extendido con `getCiclosCerrados()`; `api/sesiones.ts` extendido con `actualizarAsistencia()` y el campo `asistio` en `Sesion`.
- [x] `views/empresa/SatisfaccionView.vue`: 4 tarjetas KPI, formulario de encuesta (select 1-5 + comentario) con historial de respuestas propias, formulario de solicitud de nuevo proceso con historial y estado (pendiente/atendida).
- [x] `views/coach/GestionComercialView.vue`: lista de solicitudes pendientes con nombre de empresa y botón "Atender" (desaparece de la lista al atenderla, sin recargar), lista de procesos cerrados de toda la plataforma con botón "Abrir nuevo proceso con [nombre]" que navega a la vista de ciclo existente del coachee.
- [x] `views/coach/CoacheeSeguimientoView.vue` extendida con un bloque compacto de "Asistencia a sesiones": lista de sesiones pasadas del coachee con un selector tri-estado (Sin registrar / Asistió / No asistió) que guarda al cambiar — el touchpoint mínimo scopeado a la historia, en vez de construir una vista de gestión de sesiones nueva (que no existe en ningún punto de la app y excede el alcance de E13).
- [x] Rutas nuevas `/empresa/satisfaccion` y `/coach/comercial`; nav ampliada en `AppShell` para ambos roles.
- [x] Tests unitarios: `SatisfaccionView.spec.ts` (tarjetas KPI, historial de encuestas/solicitudes) y `GestionComercialView.spec.ts` (solicitudes con nombre de empresa, la solicitud desaparece de la lista al atenderla, procesos cerrados con el botón de nuevo proceso).

## Bug de entorno encontrado y corregido (no del código de producción)

Al correr `npm run test:e2e` localmente (fuera de Docker) el proceso se colgaba indefinidamente sin ningún error — dos veces, con causas distintas. El `.env` del proyecto está pensado para correr **dentro** de la red de `docker compose` y apunta a los hostnames de servicio (`POSTGRES_HOST=postgres`, `REDIS_HOST=redis`), que no resuelven fuera de esa red. Al no encontrar el host, tanto el cliente de Postgres como el de Redis reintentan de forma indefinida en vez de fallar rápido, así que el proceso nunca terminaba ni mostraba un error claro. Se corrigió pasando `POSTGRES_HOST=localhost POSTGRES_DB=coaching_test REDIS_HOST=localhost` como variables de entorno al invocar Jest directamente (los contenedores `postgres`/`redis` ya exponen esos puertos en `localhost` vía `docker-compose.yml`). No es un bug del código de la aplicación — es un requisito operacional para correr los tests fuera de Docker que no estaba documentado; queda anotado aquí para no volver a perder tiempo diagnosticándolo.

## Limitación del entorno — verificación visual con Playwright no disponible en esta sesión

A diferencia de los Sprints 6-12, no fue posible instalar Playwright en este entorno: tanto `npx playwright install` como `npm install playwright` se cuelgan indefinidamente sin error. Diagnóstico: una petición HTTPS simple hecha directamente con el módulo `https` de Node.js a `registry.npmjs.org` responde en ~1.5s (200 OK), y `curl` al mismo host también funciona con normalidad — pero tanto `npm view`, `npm install` como `npx` (que hacen múltiples peticiones concurrentes para resolver el árbol de dependencias) se cuelgan sin ningún error ni timeout. Esto apunta a una restricción del sandbox de esta sesión sobre las conexiones salientes concurrentes de Node/npm, no a un problema de red genérico ni del proyecto.

Como respaldo, se hizo una **verificación funcional completa vía `curl` contra el stack real** (`docker compose up --build -d` con los 5 contenedores healthy, datos sembrados con IDs únicos vía la propia API): login de empresa → responder encuesta (calificación 5) → enviar solicitud de nuevo proceso → verificar que ambas aparecen en las listas de la propia empresa → login de coach → ver la solicitud pendiente con el nombre de la empresa → atenderla → confirmar que desaparece de pendientes → `GET /ciclos/cerrados` confirma que el coachee de prueba aparece con `coachee.nombre` poblado (el campo que consume el botón "Abrir nuevo proceso con [nombre]" en el frontend) → `PATCH /sesiones/:id` con `asistio: true` → `GET /satisfaccion/kpis/:empresaId` recalculado correctamente en ambos lados (`procesosTerminados: 1`, `tasaAsistencia` pasó de `null` a `100`, `satisfaccionPromedio: 5`). También se confirmó que nginx sirve correctamente las rutas nuevas del SPA (`/empresa/satisfaccion`, `/coach/comercial` devuelven 200 con el `index.html` del bundle, vía el `try_files` ya configurado). Esto verifica el contrato de datos real que consume cada vista nueva, pero **no sustituye una verificación visual real en navegador** (renderizado de los selects/formularios, que el selector de asistencia persista tras recargar, que el botón de "abrir nuevo proceso" navegue correctamente en el DOM). Queda pendiente para una sesión con acceso de descarga de binarios sin restricciones.

## Verificación

- Backend: `npm run lint` (limpio), `npm test` → **159/159** tests, `npm run test:e2e` contra `coaching_test` recreada desde cero → **11/11 suites**.
- Frontend: `npm run lint` (limpio), `npm test` (vitest) → **31/31** tests (12 archivos), `npm run build` sin errores de tipos (`vue-tsc -b`).
- `docker compose up --build` completo, 5/5 contenedores healthy/up.
- Verificación funcional end-to-end vía `curl` contra el stack real (ver limitación de entorno arriba) — **sin bugs de producción encontrados**; el único hallazgo de esta verificación fue el problema de entorno (`.env` apuntando a hostnames de Docker) al correr Jest localmente, ya documentado arriba y sin impacto en Docker ni en producción.
- Stack bajado con `docker compose down` al terminar.

## Revisión

Sprint 13 completo. Backend verificado con la misma rigurosidad de siempre (unit + e2e contra base recreada desde cero) y frontend verificado funcionalmente de punta a punta vía `curl` contra el stack real en Docker, ante la imposibilidad de instalar Playwright en este entorno concreto (limitación de sandbox, no del proyecto — documentada arriba con su diagnóstico). El diseño reutilizó deliberadamente construcción existente en vez de reinventar: el patrón de inyección directa de repositorios cruzados (`NegocioModule`, Sprint 11), la convención de rutas estáticas antes que paramétricas (Sprint 6), y la vista de "abrir ciclo" ya existente (Sprint 10) para la acción de "nuevo proceso" sin necesitar ningún estado de pre-fill nuevo. Próximo paso: Sprint 14 (hardening — revisión de headers de seguridad, cookies `httpOnly` para los JWT en vez de `localStorage`, ver la nota del Sprint 6, y auditoría retroactiva de mutaciones si el alcance lo justifica), último sprint antes del cierre del plan de `docs/jira-plan.md`. Recomendado: en la próxima sesión con este entorno, intentar de nuevo la instalación de Playwright (podría ser una restricción temporal del sandbox) para cerrar la brecha de verificación visual de este sprint y confirmar en navegador real el flujo completo documentado arriba.

---

# Sprint 14 (E14) — Hardening, calidad y cierre — 2026-07-18

## Contexto

Último sprint de `docs/jira-plan.md` (18pt/100h, el más grande, depende de todas las épicas anteriores). Seis historias transversales: backups automáticos de Postgres, suite e2e Playwright de los 3 roles corriendo en CI, revisión de headers de seguridad/puertos/variables de entorno, densidad para celular (375px), onboarding y estados vacíos, y validación de formularios.

Al auditar la historia de validación de formularios (teléfono, email, montos, enlaces) descubrí un hallazgo mucho más grande que el alcance original: **no existía ninguna pantalla en el frontend para crear empresas, coachees ni sesiones** — en las 13 sesiones/sprints anteriores, todos esos datos se sembraron siempre vía `curl` directo a la API, nunca desde la UI real, a pesar de que los endpoints (`POST /empresas`, `POST /coachees`, `POST /users`, `POST /sesiones`) existen desde los Sprints 2-4. Consulté con el usuario el alcance de este hallazgo; pidió construir los mantenedores necesarios, enmarcándolo como la razón original detrás de un pedido suyo anterior de un "rol superadmin". Al revisar el RBAC existente encontré que **no hace falta ningún rol nuevo**: los cuatro controladores (`EmpresasController`, `CoacheesController.create`, `UsersController.create`, `SesionesController.create`) ya son `@Roles(Role.COACH)` en su totalidad — el Coach ya tenía permiso backend completo desde el principio. Construir un rol "superadmin" paralelo habría sido una duplicación sin ningún beneficio funcional; el único gap real era la UI faltante.

## Mantenedores (Administración) — el hallazgo más grande del sprint

- [x] `views/coach/AdministracionView.vue` (nueva): alta de empresas (nombre + tarifa/hora), alta de coachees (nombre, email, empresa opcional, jefe directo, objetivo, tarifa propia, área/gerencia) con la credencial temporal mostrada en pantalla tras crear — cumple por primera vez el criterio de aceptación de E2 "El coach genera una credencial temporal visible en pantalla para compartir manualmente", escrito desde el Sprint 2 pero nunca antes expuesto en ninguna vista. También alta de cuentas Empresa (email + empresa) con su propia credencial temporal, y listado de todas las cuentas con botón de "Restablecer contraseña".
- [x] Backend: `UsersService.findAll()` + `GET /users` (Role.COACH) nuevo — no existía ningún endpoint para listar cuentas; necesario para el botón de restablecer contraseña. `passwordHash` sigue protegido por el `@Exclude()` + `ClassSerializerInterceptor` global ya vigente desde el Sprint 2, sin cambios adicionales.
- [x] `views/coach/CoacheeSeguimientoView.vue` extendida con "Próximas sesiones" + formulario "Agendar sesión" (fecha/hora + link opcional) — mismo gap: `POST /sesiones` existía desde el Sprint 4 sin ningún formulario que lo consumiera.
- [x] `api/empresas.ts` (+`createEmpresa`), `api/coachees.ts` (+`createCoachee`, `CoacheeListItem` ahora incluye `empresa`), `api/users.ts` (nuevo: `listUsers`, `createEmpresaUser`, `resetPassword`), `api/sesiones.ts` (+`agendarSesion`).
- [x] Ruta `/coach/administracion` + nav; tests unitarios (`AdministracionView.spec.ts`): listas, alta de empresa, credencial temporal tras crear coachee y tras crear usuario Empresa.

## Backups automáticos de Postgres

- [x] Servicio `postgres-backup` en `docker-compose.yml` (imagen madura de un solo propósito, `prodrigestivill/postgres-backup-local`, en vez de un script `pg_dump`+cron hecho a mano) — `SCHEDULE: "@daily"`, retención 7 diarios/4 semanales/6 mensuales, volumen `postgres_backups`.
- [x] Verificado de extremo a extremo, no solo configurado: se disparó un backup manual (`docker exec ... /backup.sh`), se restauró en una base `coaching_restore_test` separada y se confirmó por conteo de filas (`users`: 32 en ambas) que la restauración es íntegra.
- [x] `docs/ops-backups.md`: procedimiento de backup manual y restauración documentado con los comandos reales ya verificados.

## Puertos, headers de seguridad y variables de entorno

- [x] `docker-compose.yml` (base, la que se usaría en producción) ya **no publica** los puertos de `postgres`/`redis` al host — solo nginx (80) queda expuesto. Un `docker-compose.override.yml` nuevo (se fusiona automáticamente en local, sin flags) reexpone esos dos puertos únicamente para tooling de desarrollo (migraciones, tests, `psql` directos desde la máquina), con un comentario explícito de que nunca debe existir en producción. Confirmado con `docker compose config` (base vs. base+override) que solo el puerto 80 queda publicado sin el override.
- [x] Confirmado (sin cambios de código, ya vigente desde el Sprint 2): headers OWASP completos vía `helmet()` (CSP, HSTS, X-Frame-Options, etc.), CORS restringido a `FRONTEND_URL`, rate-limit en `/auth/login` (corta en el 6to intento dentro de la ventana). `.env` nunca trackeado en git; `.env.example` solo tiene placeholders.

## Validación de formularios

- [x] `linkVideollamada` (`CreateSesionDto`/`UpdateSesionDto`): de `@IsString()` a `@IsUrl()`.
- [x] `telefono`/`emailContacto` (`UpdateContactoDto`, usado por `PATCH /coachees/me/contact`): de `@IsString()` sin validar a formato real. `emailContacto` → `@IsEmail()`. `telefono` inicialmente implementado con `@IsPhoneNumber('CL')`, pero se encontró un bug real: esa validación usa `libphonenumber-js/max`, que valida contra rangos de numeración realmente asignados en Chile, no solo la forma del número — rechazaba con 400 el número `+56 9 1234 5678` (formato perfectamente válido, usado en el e2e desde el Sprint 3) simplemente porque esa secuencia de dígitos no corresponde a un rango real asignado. Corregido reemplazándolo por un `@Matches()` con una regex de formato (dígitos, espacios, `+`, `-`, paréntesis, 7-20 caracteres) — valida la forma, que es lo que pide el criterio de aceptación ("rechaza formatos inválidos"), sin rechazar números plausibles por reglas de numeración demasiado específicas.
- [x] Montos (`tarifaHora`, `tarifaPropia`, `horasContratadas`) ya tenían `@IsInt() @Min(0)` desde sprints anteriores — confirmado sin cambios.

## Onboarding y estados vacíos

- [x] Auditoría de las vistas existentes: la gran mayoría ya tenía estados vacíos bien manejados desde sprints anteriores (mensajes "Todavía no hay…"/"Aún no…" en `CoacheesView`, `BibliotecaView`, `SesionesView`, `GestionComercialView`, `SatisfaccionView`, `CicloView` de empresa, etc.) — no se encontraron pantallas rotas o en blanco.
- [x] `views/coach/PlanesListView.vue` (la landing page real del coach tras login) mejorada: si la plataforma no tiene ningún coachee todavía, muestra un banner de bienvenida con enlace directo a Administración, en vez del genérico "No hay planes con este filtro" (confuso en un despliegue nuevo, sin pistas de qué hacer).
- [x] `AdministracionView.vue`: mensajes explícitos "Todavía no hay empresas/coachees/cuentas creadas" en cada sección cuando la lista está vacía (antes solo mostraba el formulario sin ningún texto guía).

## Densidad para celular (375px)

Auditoría estática (no pude confirmar visualmente por la misma limitación de Playwright, ver más abajo) buscando los patrones que típicamente causan scroll horizontal:
- [x] Dos `<table>` sin contenedor de scroll propio (`AuditoriaView.vue`, `NegocioView.vue` — 6 columnas) envueltas en `<div class="overflow-x-auto">`, siguiendo la regla de que el contenido ancho debe scrollear dentro de su propio contenedor, nunca la página completa.
- [x] Fila de "Procesos cerrados" en `GestionComercialView.vue`: el botón "Abrir nuevo proceso con [nombre]" es un `shrink-0` de texto dinámico (puede ser largo) dentro de un `flex` sin `flex-wrap` — a 375px podía forzar overflow horizontal. Corregido agregando `flex-wrap` al contenedor. Mismo ajuste preventivo en la fila de usuarios de `AdministracionView.vue` (email + botón "Restablecer contraseña").
- [x] Sin otros hallazgos: sin anchos fijos en píxeles fuera de rango, sin `grid-cols-N` sin breakpoint responsivo, sin estilos `width` arbitrarios salvo la barra de progreso (porcentual, sin riesgo).

## Suite e2e Playwright (3 roles) + CI

- [x] Nuevo paquete npm **separado** `e2e/` (no dentro de `frontend/`) a propósito: así una instalación fallida de Playwright nunca compromete el `package-lock.json` ni el `npm ci` reproducible de `frontend`/`backend`, que llevan 14 sprints funcionando sin fricción.
- [x] `e2e/tests/coach.spec.ts` (login → crear empresa desde Administración), `coachee.spec.ts` (siembra empresa+coachee vía API → login → registra un logro en Mi progreso), `empresa.spec.ts` (siembra cuenta Empresa vía API → login → responde una encuesta de satisfacción) — un flujo por rol, login + acción principal, tal como pide el criterio de aceptación.
- [x] Job `e2e` nuevo en `.github/workflows/ci.yml`: levanta el stack completo (`docker compose up --build`), espera `/api/health`, instala Playwright + Chromium, corre la suite, sube el reporte HTML como artifact solo si falla, y baja el stack siempre al final.
- [x] `docs/e2e` → `e2e/README.md` con instrucciones de ejecución local.

## Bugs reales encontrados y su causa raíz

1. **`@IsPhoneNumber('CL')` demasiado estricto** (detallado arriba en "Validación de formularios") — usa `libphonenumber-js/max` que valida rangos de numeración reales, no solo forma. Corregido con `@Matches()` sobre una regex de formato.
2. **Error de tipos preexistente en `ciclos.service.spec.ts`** (del Sprint 13, no detectado entonces): el mock `coachee: { nombre: 'Coachee Uno' }` no satisface el tipo completo `Coachee` en `npx tsc --noEmit` (aunque `nest build` no lo detecta porque `tsconfig.build.json` excluye `*.spec.ts`). Corregido con un cast explícito `as CicloCoaching['coachee']`.
3. **Cuelgue de entorno al ejecutar tests localmente** (mismo patrón que Sprint 13, reconfirmado): `npm run test:e2e` fuera de Docker requiere `POSTGRES_HOST=localhost POSTGRES_DB=coaching_test REDIS_HOST=localhost` explícitos — sin `REDIS_HOST=localhost`, Redis también se cuelga intentando resolver el hostname `redis` del compose.

## Limitación del entorno — Playwright sigue sin poder instalarse en este sandbox

Igual que en el Sprint 13, `npm install`/`npx playwright` se cuelgan indefinidamente en esta sesión (confirmado de nuevo: conexiones HTTPS simples con el módulo `https` de Node funcionan en ~1.5s, pero `npm`/`npx` — que hacen resolución concurrente de dependencias — no). Esto bloqueó tanto la verificación visual manual como la ejecución local de la nueva suite `e2e/`. Mitigación real, no solo documentación del problema: en vez de solo anotar la limitación, se construyó la suite Playwright completa como paquete separado y se validó exhaustivamente por otras vías — sintaxis TypeScript verificada con `tsc --noEmit` (usando el compilador ya instalado en `backend/node_modules`, sin necesitar el paquete `@playwright/test` en sí), YAML del job de CI parseado y verificado con `js-yaml` (dependencia transitiva ya presente), y cada selector del DOM (`getByLabel`, `getByRole`, `getByPlaceholder`) verificado contra el markup real de las vistas ya leídas en esta misma sesión. La suite está lista para correr en GitHub Actions, que sí tiene acceso de red completo para descargar Playwright y Chromium, a diferencia de este sandbox local.

## Verificación

- Backend: `npm run lint` (limpio), `npm test` → **160/160** tests (incluye el nuevo `UsersService.findAll`), `npm run test:e2e` contra `coaching_test` recreada desde cero → **11/11 suites**. `npx tsc --noEmit` limpio salvo los 2 errores preexistentes ya documentados en `users.service.spec.ts` (no tocados, fuera de alcance).
- Frontend: `npm run lint` (limpio), `npm test` (vitest) → **35/35** tests (13 archivos, incluye el nuevo `AdministracionView.spec.ts`), `npm run build` sin errores de tipos (`vue-tsc -b`).
- `docker compose up --build` completo, **6/6 contenedores** healthy/up (los 5 de siempre + `postgres-backup` nuevo).
- Verificación funcional end-to-end vía `curl` contra el stack real (Playwright no disponible, ver limitación arriba): crear empresa → crear coachee (confirma `temporaryPassword` en la respuesta) → `GET /coachees` incluye la relación `empresa` → crear cuenta Empresa vía `POST /users` → `GET /users` lista sin exponer `passwordHash` → login exitoso con la credencial recién generada → `PATCH /coachees/me/contact` acepta `+56 9 1234 5678` (200) y rechaza `abc` (400) → `POST /sesiones` acepta un link válido (201) y rechaza `no-es-url` (400) → `GET /ciclos/cerrados` sigue funcionando → nginx sirve `/coach/administracion` (200, SPA fallback correcto).
- Backup real generado y restaurado en una base de prueba separada, verificado por conteo de filas.
- Stack bajado con `docker compose down` al terminar.

## Revisión

Sprint 14 completo — cierre del plan de `docs/jira-plan.md`. El hallazgo más significativo no estaba en ninguna historia escrita: 13 sprints de verificación habían sembrado datos siempre vía `curl`, ocultando que jamás existió una UI real para las operaciones más básicas de alta (empresas, coachees, sesiones). Se resolvió con la solución más simple y correcta — exponer en el frontend los endpoints que el Coach ya podía usar desde el backend — en vez de construir un rol "superadmin" paralelo y redundante que el usuario pidió inicialmente sin conocer aún esta causa raíz. El resto de las historias de hardening (backups, puertos, validación, onboarding, densidad celular, e2e/CI) se completaron y verificaron con la misma rigurosidad de siempre, con dos bugs reales encontrados y corregidos en el camino (validación de teléfono demasiado estricta, error de tipos preexistente). Única brecha real: la verificación visual con Playwright, bloqueada por una restricción de red de este sandbox — mitigada construyendo una suite real y verificándola exhaustivamente por vías alternativas (tsc, YAML parsing, revisión manual contra el markup real), lista para correr en CI sin intervención adicional. Con este sprint se cierran las 14 épicas planificadas para el MVP de Coach Fernando Ramos.

---

# Vistas del coachee — de "formulario serio" a interfaz con personalidad — 2026-08-16

Plan completo en `/Users/richardmunoz/.claude/plans/greedy-tumbling-dawn.md`. Checklist:

- [x] `components/EmptyState.vue` (+ spec)
- [x] `components/SectionCard.vue` (+ spec)
- [x] Iconos nuevos (objetivo, lista, habito, formacion, diario, trofeo) en `NavIcon.vue`
- [x] Clases utilitarias de transición fade+slight-rise en `styles.css`
- [x] `ProgresoView.vue`: EmptyState en autoevaluación/diario, icono spark en Logros, TransitionGroup, SectionCard en las 5 cards
- [x] `SesionesView.vue`: EmptyState sin sesiones, tratamiento con icono en post-sesión, TransitionGroup en lista, trofeo spark en cercanía alta
- [x] `PlanDesarrolloView.vue` + tabs: EmptyState sin ciclo (en CicloStepper), SectionCard con icono por tab (Definición/Objetivos, Hábito/Ejecución, Formación)
- [x] `BibliotecaView.vue`: EmptyState sin recursos (2 lugares), TransitionGroup en cards de tópico/recursos
- [x] `SesionesView.spec.ts`/`BibliotecaView.spec.ts` verificados, sin roturas (aserciones por texto, no por clase)
- [x] `vitest run` (218/218), `eslint --fix` (0 errores), `vue-tsc --noEmit` + cross-check `tsc -p tsconfig.app.json` (0 errores nuevos, 3 preexistentes sin relación)
- [x] Verificación CDP antes/después en las 4 vistas + tab Formación — confirmado visualmente

---

# Módulo Quiz — sin IA — 2026-08-16

Plan completo en `/Users/richardmunoz/.claude/plans/greedy-tumbling-dawn.md`. Checklist:

- [x] Backend: entidades `Quiz`/`PreguntaQuiz`/`IntentoQuiz`, migración, DTOs, service, controller, module, registro en `app.module.ts`
- [x] `respuestaCorrecta` nunca viaja al coachee antes de responder (verificado por test + smoke real vía curl + captura de pantalla del formulario)
- [x] Guard de eliminación: 409 si el quiz ya tiene intentos registrados
- [x] Migración aplicada a la base de dev y verificada con `POST/GET` reales
- [x] Frontend: `api/quiz.ts`, ícono `quiz` en `NavIcon.vue`, `views/coach/QuizView.vue`, `views/coachee/QuizView.vue`, rutas + nav
- [x] Backend: `jest` 297/297, `tsc --noEmit` sin errores nuevos, `eslint` limpio
- [x] Frontend: `vitest run` 226/226, `eslint --fix` limpio, `vue-tsc` + cross-check `tsc` sin errores nuevos
- [x] Verificación CDP: coach crea quiz + agrega preguntas + ve resultados; coachee responde y ve feedback con puntaje y `--color-spark` en "mejor puntaje"

---

# Módulo Flashcards — sin IA — 2026-08-17

Plan completo en `/Users/richardmunoz/.claude/plans/greedy-tumbling-dawn.md`. Checklist:

- [x] Backend: entidades `Flashcard`/`RepasoFlashcard`, migración, DTOs, service, controller, module, registro en `app.module.ts`
- [x] Repetición espaciada (olvidado+1d/dificil+3d/facil+7d) verificada por test + smoke real vía curl (proximaRevision correcta, debeRepasar pasa a false tras repasar)
- [x] Guard de eliminación: 409 si la flashcard ya tiene repasos registrados
- [x] Migración aplicada a la base de dev
- [x] Frontend: `api/flashcards.ts`, ícono `flashcards` en `NavIcon.vue`, `views/coach/FlashcardsView.vue`, `views/coachee/FlashcardsView.vue` (flip 3D con `styles.css` compartido), rutas + nav
- [x] Backend: `jest` 308/308, `tsc --noEmit` sin errores nuevos, `eslint` limpio
- [x] Frontend: `vitest run` 232/232, `eslint --fix` limpio, `vue-tsc` + cross-check `tsc` sin errores nuevos
- [x] Verificación CDP: coach crea 2 flashcards; coachee hace flip (confirmado visualmente), marca fácil/difícil, ve pantalla "ya repasaste todo por hoy"

---

# Mapa Mental — sin IA — 2026-08-17

Plan completo en `/Users/richardmunoz/.claude/plans/greedy-tumbling-dawn.md`. Checklist:

- [x] Backend: entidades `MapaMental`/`NodoMapa` (autoreferenciada, cascada real), migración, DTOs, service, controller, module, registro en `app.module.ts`
- [x] Sin guard de eliminación (no hay historial del coachee que proteger, a diferencia de Quiz/Flashcards) — confirmado por test
- [x] Migración aplicada a la base de dev; smoke test real vía curl (6 nodos, 2 niveles)
- [x] Frontend: `lib/mapaArbol.ts` (buildArbol + layoutArbol puros, testeados en aislado), `components/MapaCanvas.vue` (renderizado SVG + nodos posicionados, primer lienzo visual real de la app), `api/mapas.ts`, ícono `mapa` en `NavIcon.vue`, `views/coach/MapasView.vue`, `views/coachee/MapasView.vue`, rutas + nav
- [x] Backend: `jest` 316/316, `tsc --noEmit` sin errores nuevos, `eslint` limpio
- [x] Frontend: `vitest run` 244/244, `eslint --fix` limpio, `vue-tsc` + cross-check `tsc` sin errores nuevos
- [x] Verificación CDP: coach arma un mapa de 2 niveles (tema central + 4 ramas + 1 sub-rama) y lo ve renderizado con líneas curvas; clic colapsa/expande (badge "+1"); coachee explora el mismo mapa en modo solo-lectura y ve el detalle del nodo seleccionado

---

# "Mi Aprendizaje" — hub del coachee — 2026-08-17

Plan completo en `/Users/richardmunoz/.claude/plans/greedy-tumbling-dawn.md`. Checklist:

- [x] Backend: `AprendizajesRecursoService.listAllOwn` + `GET /recursos/aprendizajes/me` (junta notas de todos los recursos, antes solo existía por-recurso)
- [x] `lib/miAprendizaje.ts` (resumenAprendizaje, puro) — 7 tests unitarios
- [x] `views/coachee/MiAprendizajeView.vue` — agrega sesiones/biblioteca/quiz/flashcards/mapas/apuntes en un vistazo, primer ítem del nav
- [x] Backend: `jest` 318/318, `tsc --noEmit` sin errores nuevos, `eslint` limpio
- [x] Frontend: `vitest run` 254/254, `eslint --fix` limpio, `vue-tsc` + cross-check `tsc` sin errores nuevos
- [x] Verificación CDP con la cuenta de prueba real (datos acumulados de toda la sesión): contadores correctos (Quiz/Flashcards "Al día" reflejando intentos/repasos reales, Biblioteca "sin apuntes" bajó de 4 a 3 al escribir una nota nueva, aparece en Apuntes recientes sin recargar nada más)

---

# Nav del coachee agrupado — 2026-08-17

- [x] `AppShell.vue`: `coacheeNavGroups` reorganizado en "Mi Aprendizaje" (sin grupo, primero) + "Mi proceso" (Plan/Sesiones/Progreso) + "Estudiar" (Biblioteca/Quiz/Flashcards/Mapas mentales) — mismo criterio que ya usa el coach (Coaching/Trabajo/Administración)
- [x] `vitest run` 254/254, `eslint` limpio, verificado visualmente en CDP

---

# Formación complementaria — de texto libre a contenido derivado — 2026-08-17

Plan completo en `/Users/richardmunoz/.claude/plans/greedy-tumbling-dawn.md`. Checklist:

- [x] Backend: `Recurso.competenciaId` (nullable) + migración + validación en `RecursosService` (`RecursosModule` ahora importa `CompetenciasModule`)
- [x] `RecursosView.vue` (coach): selector de competencia opcional al crear un recurso
- [x] `lib/formacionRecomendada.ts` (puro, filtra recursos/quiz/flashcards/mapas por `competenciaId` del plan) — 3 tests
- [x] `FormacionTab.vue` reescrito: de 5 textareas editables a contenido real derivado, agrupado en 4 `SectionCard`; texto legado (si existía) se muestra de solo lectura en un `<details>`, ya no se pierde ni se edita
- [x] Backend: `jest` 320/320, `tsc --noEmit` sin errores nuevos, `eslint` limpio
- [x] Frontend: `vitest run` 261/261 (arreglados fixtures de `Recurso` en 3 specs preexistentes que ya no tenían `competenciaId`), `eslint --fix` limpio, `vue-tsc` + cross-check `tsc` sin errores nuevos
- [x] Verificación CDP real: tageé el plan y un recurso nuevo con la misma competencia que ya tenían el Quiz/Flashcards/Mapa de pasadas anteriores — la tab Formación los agrupó correctamente a los 4, con links funcionales

---

# Fix: mensaje de vacío confuso en Formación — 2026-08-17

Reportado por el usuario: la tab Formación mostraba "no hay nada" aunque Quiz/Flashcards/Mapas sí tenían contenido. Diagnóstico: no era bug — el contenido existente estaba etiquetado con una competencia distinta a la del plan (confirmado por consulta directa a la base). Mejora de UX real:

- [x] `FormacionTab.vue`: el mensaje de vacío ahora nombra la competencia del plan y distingue "no hay nada en ningún lado" de "sí hay contenido, pero de otras competencias" (nuevo computed `hayContenidoDeOtraCompetencia`)
- [x] `vitest run` 262/262, `eslint`/`vue-tsc`/`tsc` limpios
- [x] Verificado visualmente simulando el mismo desajuste (cuenta de prueba cambiada temporalmente a una competencia sin contenido, restaurada después)
- [ ] Pendiente de decisión del usuario: la cuenta real "Felipe Cortes" tiene su plan en "Impacto e Influencia" pero todo el contenido de prueba creado esta sesión es de "Auto Desarrollo" — no es un bug, pero esa cuenta específica seguirá viendo la tab vacía hasta que se cree/retagueé contenido de esa competencia

---

# Fix: coachee no podía ver el resultado de sus propios ciclos — 2026-08-17

El usuario preguntó "¿sé si aprobé los tópicos?" — auditoría reveló que `HistorialCiclos.vue` (con el resultado Logrado/Medianamente logrado/No logrado por ciclo) solo se usaba en las vistas del coach y de la empresa, nunca en la del coachee, pese a que el dato siempre existió.

- [x] `ProgresoView.vue`: nueva `SectionCard` "Historial de ciclos" reutilizando `HistorialCiclos.vue` sin modificarlo (cero cambios de backend, cero componentes nuevos) — mismo patrón `ciclosCerrados = computed(...)` que ya usa `CicloTab.vue` del coach
- [x] `vitest run` 262/262, `eslint`/`vue-tsc`/`tsc` limpios (mismos 3 errores preexistentes)
- [x] Verificado en navegador real: abrí y cerré un ciclo de prueba con resultado "logrado" para la cuenta qa-paleta-verify, confirmé que aparece con el badge correcto y el detalle expandido (resumen + informe)

Diagnóstico más amplio entregado al usuario (no implementado, pendiente de decisión): Quiz no tiene umbral de aprobado/reprobado (solo puntaje crudo), y el modelo de datos no soporta "varios tópicos trabajados en el tiempo" — el Plan trackea una sola competencia activa a la vez, no un temario tipo curso.

---

# Regla: no cerrar ciclo sin plan aprobado — 2026-08-17

El usuario notó que el ciclo de prueba cerrado (usado para verificar "Historial de ciclos") era incoherente: el coachee nunca había enviado su plan. Confirmó que debía ser una regla obligatoria del backend.

- [x] `CiclosService.cerrar()`: nuevo guard — si el plan del coachee no existe o no está `aprobado`, lanza `ConflictException` con mensaje claro. Reutiliza `PlanesDesarrolloService` ya inyectado en el servicio, sin nuevo módulo/dependencia.
- [x] `ciclos.service.spec.ts`: 2 tests nuevos (rechaza sin plan, rechaza con plan no aprobado) + los 2 tests existentes de `cerrar` actualizados para mockear un plan aprobado
- [x] `jest` 322/322, `tsc`/`eslint` limpios
- [x] Verificado real vía API: intento de cierre sin plan aprobado → 409 con el mensaje correcto; luego de enviar+aprobar el plan de la cuenta de prueba, el mismo cierre funciona (201) — el frontend ya mostraba `ApiError.message` tal cual en `CicloTab.vue`, no necesitó cambios
- [x] Dato de prueba corregido: la cuenta qa-paleta-verify ahora tiene su plan realmente enviado y aprobado, con un objetivo específico — la historia ya es coherente

---

# Cerrar la brecha entre las plantillas reales de Fernando y la app — 2026-08-31

## Contexto

El usuario descargó a `docs/` 7 documentos + 5 imágenes reales de su práctica (Excel de Plan de
Desarrollo de Felipe Cortés/Ferronor, informe de cierre real, pauta de retroalimentación, registro
de sesiones, presupuesto/invitación comerciales, capturas del competidor Winston PAD y de su
landing personal) pidiendo un análisis de qué le falta a la app para agregar valor real. Se comparó
campo por campo contra las entidades reales del backend (3 agentes Explore en paralelo) y se
confirmó que `PlanDesarrollo` ya nació 1:1 de ese Excel. El resto expone contenido que el coach
sigue llevando a mano porque la app no tiene dónde ponerlo. Plan completo (6 fases) en
`~/.claude/plans/parallel-inventing-robin.md`. Decisiones confirmadas con el usuario: la
Retroalimentación de Cierre es entidad nueva (no se toca `EncuestaSatisfaccion` de empresa, que es
otro concepto); los "comportamientos" de competencia solo se enriquecen para las 3 con evidencia
real (Autoconfianza, Trabajo en Equipo, Flexibilidad).

## Pasos de ejecución

- [x] Fase 1 — Gaps rápidos: `AprendizajeRecurso.aplicacion`, `ActividadEjecucion.observaciones`,
      `Logro.situacion`, `Sesion.temaTratado/ejerciciosAplicados/acuerdos` (1 migración combinada)
- [x] Fase 2 — Retroalimentación de Cierre (nueva entidad coachee→ciclo, 18 ítems Likert + 4 abiertas —
      la pauta real tiene 18 afirmaciones en 3 bloques, no 15 como se estimó en el plan inicial)
- [x] Fase 3 — Autoevaluación de Competencias (seed enriquecido de 3 competencias + upsert bootstrap
      + entidad `AutoevaluacionCompetencia` + cruce nivel↔descripción en `DefinicionTab.vue`)
- [x] Fase 4 — Enriquecer `CiclosService.generarBorradorInforme()` con Logros + retroalimentación
      de cierre + estructura narrativa por secciones (sin módulo nuevo, sin migración)
- [x] Fase 5 — Módulo "Ejercicios de comunicación" (Saber-Sentir-Hacer), clon de `quiz/`.
      Bonus: `npm run build` del frontend estaba roto de antes (3 errores de tipos
      pre-existentes, no relacionados) — se corrigieron de paso al descubrirlos.
- [x] Fase 6 — "Perfil del Coach" estático para el rol Empresa

## Verificación

Por fase: migración aplicada, specs existentes verdes, y verificación real solicitada al usuario
en su propio navegador (LAN, `http://192.168.0.2:5173`) — el navegador conectado a esta sesión
resultó estar en otra máquina (Windows remoto), así que no pude tomar capturas CDP yo mismo; el
usuario quedó a cargo de la revisión visual de cada fase mientras yo seguía con la siguiente.

Checks corridos en cada fase, backend y frontend: `npm run lint`, `npm test` (backend, jest),
`npx vue-tsc --noEmit` + `npx tsc -p tsconfig.app.json --noEmit` (cross-check, ver
`project_vue_tsc_spec_blindspot`), `npx vitest run`, y — descubierto a mitad de la Fase 5 como el
chequeo realmente autoritativo — `npm run build` completo (`vue-tsc -b && vite build`), que
encontró 3 errores de tipos que los chequeos rápidos venían pasando por alto (2 pre-existentes en
fixtures de test, 1 real en `SesionesView.vue`), todos corregidos.

## Revisión

**Backend**: 30 test suites / 349 tests (arrancó en 322, cerró en 349). 6 migraciones nuevas
aplicadas contra Postgres local y corridas sin error. Módulos nuevos: `retroalimentacion/`,
`ejercicios/`; módulos ampliados: `recursos`, `planes-desarrollo`, `seguimiento`, `sesiones`,
`competencias`, `ciclos`.

**Frontend**: 63 archivos de test / 295 tests (arrancó en 291). `npm run build` limpio de punta a
punta. 2 vistas nuevas (`coach/EjerciciosView.vue`, `coachee/EjerciciosView.vue`,
`empresa/PerfilCoachView.vue`), 1 ícono nuevo (`ejercicios`), nav de coach/coachee/empresa
actualizado.

**Las 6 fases del plan (`~/.claude/plans/parallel-inventing-robin.md`) quedaron completas**: gaps
rápidos de plantillas reales, retroalimentación de cierre (18 ítems reales, no 15 como se estimó
al leer el documento por arriba), autoevaluación de competencias con contenido real de 3
competencias, informe de cierre enriquecido con logros y retroalimentación, módulo de ejercicios
de comunicación completo, y perfil del coach para empresa.

**Pendiente, fuera de este alcance** (mencionado al usuario, no implementado): los 4 gaps
comerciales identificados el 26-08 (facturación real, ROI, presupuesto por depto, HRIS) y el
contenido de comportamientos para las ~13 competencias restantes del catálogo (falta que el
usuario aporte el framework completo).

---

# Fix: visibilidad de Quiz/Flashcards/Mapas/Ejercicios por competencia — 2026-09-01

## Contexto

Tras el QA funcional + security-review de las 6 fases (ambos sin hallazgos), el usuario preguntó
por trazabilidad real entre roles: ¿ven todos los coachees todo el contenido de Quiz/Flashcards/
Mapas mentales/Ejercicios, sin importar el tópico que están trabajando? Investigación confirmó que
sí — a diferencia de Biblioteca (que tiene `AsignacionRecurso` real), estos 4 módulos solo
filtraban por `activo: true`, sin ningún filtro de competencia ni asignación. La tab "Formación"
ya resolvía esto parcialmente (filtra client-side por competencia del plan) pero solo ahí — el nav
principal de cada módulo seguía sin filtrar. Usuario confirmó vía AskUserQuestion: auto-filtro por
competencia (mismo criterio que ya usa `lib/formacionRecomendada.ts`), sin asignación manual.

## Pasos de ejecución

- [x] Quiz/Flashcards/Mapas: `disponiblesParaCoachee` ahora resuelve la competencia del plan del
      coachee (`PlanesDesarrolloService.getByCoacheeId`) y filtra `WHERE activo AND competenciaId
      = <la del plan>`; sin plan/competencia definida, devuelve `[]` (mismo comportamiento que
      Formación cuando `competenciaId` es `null`).
- [x] Mapas necesitó además: agregar `CoacheesModule` (no lo tenía), y `disponiblesParaCoachee()`
      pasó de no recibir ningún actor a recibir `actorUserId` (`MapasController.disponibles` ahora
      inyecta `@CurrentUser()`) — sin cambio de contrato HTTP, cero cambios de frontend.
- [x] Ejercicios (competenciaId opcional): filtro `competenciaId = <la del plan> OR
      competenciaId IS NULL` — un ejercicio "general" sin tópico asociado se sigue viendo siempre,
      incluso sin plan/competencia definida.
- [x] Los 4 módulos importan `PlanesDesarrolloModule` (sin ciclo — verificado que
      PlanesDesarrolloModule no depende de ninguno de los 4).
- [x] 8 tests nuevos (2 por módulo) + specs existentes actualizados con el mock nuevo.

## Verificación

- `npm run lint` y `npm test` (357/357, +8) limpios.
- `npm run build` + reinicio real del backend: bootstrap sin errores de dependencia circular.
- Verificado con datos reales vía curl (cuenta `qa-paleta-verify`, competencia real "Liderazgo
  situacional"): Quiz 3→1, Flashcards 4→2, Mapas 3→1 (los descartados eran de otras 2
  competencias reales en la base), Ejercicios se mantuvo en 1 (el único existente no tiene
  competencia asociada, correctamente universal).

## Revisión

Corregido un gap de diseño real (no un bug de código, sino una laguna de producto): con solo 1-2
coachees de prueba no se notaba, pero con varios coachees en distintas competencias cada uno
habría visto contenido irrelevante de los demás. Sin migración (no cambia schema). Sin cambios de
frontend (mismos contratos HTTP, mismos response shapes).

---

# Ranking de Quiz (coach) + progreso propio (coachee) — 2026-09-01

## Contexto

El usuario preguntó si el coach sabe quién respondió cada quiz y "quién ganó". Hoy solo había una
lista plana de intentos sin ordenar. Confirmado con el usuario (AskUserQuestion): el ranking es
**solo para el coach** (coherente con la confidencialidad del modelo de coaching 1 a 1, explícita
en la carta real de invitación ya analizada) — el coachee nunca ve el nombre ni el puntaje de otro
coachee, solo su propia nota y progreso en el tiempo.

## Pasos de ejecución

- [x] Sin cambios de backend — `listIntentosDeQuiz` (coach) y `misIntentos` (coachee) ya
      devolvían todo lo necesario.
- [x] `frontend/src/lib/quizRanking.ts` (puro, testeado): agrupa intentos por coachee, se queda
      con el mejor puntaje de cada uno, desempata por quién lo logró primero, ordena descendente.
- [x] `views/coach/QuizView.vue`: sección "Resultados" → "Ranking" — posición numerada, medalla/
      trofeo para el 1er lugar, cantidad de intentos si hubo más de uno.
- [x] `views/coachee/QuizView.vue`: nueva sección "Tu progreso en este quiz" — SOLO sus propios
      intentos (filtrados de `misIntentos()` por `quizId`), con indicador ↑/↓ vs. el intento
      anterior y el mejor puntaje destacado. Nunca nombres ni puntajes de otros coachees.

## Verificación

- `npm run lint`, `npm run build` (autoritativo), `npx vitest run` → 301/301 (+6) limpios.
- Backend sin cambios, no requirió reinicio.

## Revisión

Feature completa sin tocar backend — ambos endpoints ya exponían los datos, solo faltaba
presentarlos bien. Diseño verificado contra el modelo de confidencialidad real del negocio antes
de construir, no asumido.

---

# Módulo "Test de Estilo" (opción forzada A/B, perfil por categoría) — 2026-09-01

## Contexto

Usuario mostró `thomas-kilmann.vercel.app` (réplica del Thomas-Kilmann Conflict Mode Instrument,
instrumento comercial con copyright de CPP/Wiley) y preguntó qué agrega valor ahora. Se descartó
copiar sus 30 preguntas reales (violación de copyright) — en su lugar, se construyó la mecánica
GENÉRICA (opción forzada A/B, categorías configurables por el coach, perfil por conteo), mismo
patrón "coach autora su propio contenido" que Quiz/Flashcards/Mapas/Ejercicios. Fernando carga sus
propias preguntas con la fuente que tenga derecho a usar.

## Pasos de ejecución

- [x] Backend `test-estilo/` (clon del patrón de `quiz/`): `TestEstilo` (competenciaId opcional,
      igual que Ejercicios), `PreguntaEstilo` (opcionA/categoriaA/opcionB/categoriaB —
      categoriaA/B con `@Exclude()`, igual mecanismo que `respuestaCorrecta` de Quiz, para no
      sesgar la respuesta del coachee mostrando la categoría de antemano), `IntentoEstilo`
      (respuestas ['A'|'B'], resultado {categoria: conteo}, categoriaDominante — empates se
      juntan con " / ").
  - [x] Mismo auto-filtro por competencia que Quiz/Flashcards/Mapas/Ejercicios (`disponibles`).
  - [x] `remove()` bloqueado si ya tiene intentos (mismo guard que Quiz/Ejercicios).
  - [x] 10 tests nuevos, migración `TestEstilo1788265028385` aplicada.
- [x] Frontend: `api/testEstilo.ts`, `views/coach/TestEstiloView.vue` (crear test, agregar
      preguntas A/B, "Perfiles de coachees" — SIN ranking, un test de estilo no tiene "mejor
      puntaje", solo el perfil de cada uno con barras por categoría), `views/coachee/
      TestEstiloView.vue` (responder eligiendo A o B, ver su propio perfil + historial de
      intentos anteriores). `lib/testEstiloPerfil.ts` (puro, compartido entre ambas vistas).
  - [x] Ícono nuevo `estilo` (espectro con marcador) en `NavIcon.vue`.
  - [x] Rutas y nav agregados para coach y coachee.

## Verificación

- Backend: `npm run lint`, `npm test` → 367/367 (+10). Migración aplicada, backend reiniciado.
- Frontend: `npm run lint`, `npm run build` (autoritativo), `npx vitest run` → 303/303 (+2).
- Verificado end-to-end con curl real: creé un test de 3 preguntas sin competencia (universal),
  confirmé que el coachee lo ve, que las categorías NO viajan a su respuesta antes de responder,
  respondí (A,B,A) y confirmé el conteo/categoría dominante calculados correctamente, y que el
  coach ve el perfil completo del coachee.

## Revisión

Herramienta reutilizable para cualquier instrumento de autopercepción de opción forzada A/B, no
solo Thomas-Kilmann — el coach puede usarla para ese instrumento (con su propio contenido/
licencia) o cualquier otro del mismo formato.

---

# QA de congruencia cross-rol + fix de las 2 incongruencias encontradas — 2026-09-01

## Contexto

Usuario pidió un QA end-to-end de CONGRUENCIA de información entre roles (coach/coachee/empresa),
no solo "cada feature funciona". Se lanzó un agente dedicado con 8 puntos de verificación,
incluyendo crear una segunda coachee de prueba ("QA Coachee B", competencia distinta) para probar
fugas cross-coachee. Resultado: 7/8 PASS, 1 incongruencia confirmada + 1 hallazgo lateral no
pedido, ambos corregidos.

## Hallazgos y fixes

**1. Autoevaluación de competencias — dato completo en backend, sin ninguna pantalla que lo
muestre.** El coach (y empresa) ya podían pedir `GET /seguimiento/autoevaluaciones/:coacheeId`
(nivel + ejemplo textual), pero ningún `.vue` del proyecto llamaba esa función (confirmado por
grep exhaustivo). Fix: `PlanTab.vue` (coach) ahora carga y muestra las autoevaluaciones del
coachee — fecha, competencia, nivel, descripción del nivel (cruzada con `Competencia.niveles`,
mismo patrón que `DefinicionTab.vue`) y el ejemplo textual.

**2. Informe de cierre arrastraba TODO el historial de logros, no solo los del ciclo.** Un
coachee con 2 ciclos vería en el informe del segundo ciclo también los logros del primero, ya
cerrado. Fix: `CiclosService.generarBorradorInforme()` ahora filtra los logros por `createdAt`
dentro de la ventana `[fechaApertura, fechaCierre ?? ahora]` del ciclo — sin migración, sin
cambio de schema, solo el filtro que faltaba.

## Verificación

- Backend: `npm run lint`, `npm test` → 368/368 (+1: ventana de logros con caso dentro/fuera).
  Rebuild + reinicio real, sin migración (fix 2 no toca schema).
- Frontend: `npm run lint`, `npm run build` (autoritativo), `npx vitest run` → 303/303 (sin
  regresiones; `PlanTab.vue` no tenía spec previo, sin riesgo de ruptura).
- Verificado con datos reales vía curl: los 2 logros existentes de la Coachee A (creados hoy)
  quedan fuera de la ventana de su ciclo de agosto — el informe generado ahora muestra "Sin logros
  registrados durante el proceso" en vez de arrastrarlos incorrectamente.

## Revisión

Las 8 áreas de congruencia cross-rol verificadas por el agente (competencia del plan, auto-filtro
por competencia con 2 coachees reales, sesiones con notas privadas nunca filtradas, logros,
retroalimentación, autoevaluación, ranking/perfiles sin fuga entre coachees, dashboard de empresa)
quedan documentadas como PASS, con las 2 excepciones ya corregidas arriba. Cuenta de prueba nueva
documentada: `qa-coachee-b-verify@test.com` / `Verificacion-CoacheeB-2026!` (competencia "Impacto
e Influencia", sin empresa asociada) — reusable para QA futuro de fugas cross-coachee.

## 2026-09-01 — Skeleton loaders + copy de "Mi Coach" (empresa)

### Contexto

El usuario compartió 9 capturas de X/Twitter (prompts de UX para dashboards/landing pages +
lista de sitios de recursos de diseño + un hilo sobre optimización de tokens en Claude Code).
Se cruzó cada idea contra el código real antes de aplicar nada (mismo criterio que la revisión
del repo de best-practices): de 9 imágenes, solo 2 hallazgos eran reales y de bajo riesgo — el
resto (dark mode, sidebar colapsable, copy de sitios de marketing público, herramientas de
terceros no verificadas para Claude Code) se descartó explícitamente por no aplicar a esta app
(B2B interna autenticada) o no ser un gap real hoy.

### Pasos de ejecución

1. **`SkeletonBlock.vue` (nuevo) + `.skeleton-shimmer`/`@keyframes skeleton-sweep` en
   `styles.css`** (mismo criterio que `.fade-slide-*`/`.flip-card`: animación compartida, no por
   componente; respeta `prefers-reduced-motion`).
2. **Reemplazado el texto plano "Cargando…" en 39 archivos** (grep exhaustivo: 41 vistas/
   componentes lo usaban) por `<SkeletonBlock v-if="..." />` — 33 reemplazos vía script Python
   (patrón idéntico: `<div v-if="loading" class="text-sm text-[var(--color-ink)]/60">Cargando…
   </div>`) + 6 manuales donde la condición tenía otro nombre (`cargandoDetalle`,
   `cargandoContacto`, `vista === 'cargando'`: `MapasView`, `QuizView`, `TestEstiloView`,
   `EjerciciosView` (coach), `AppShell` modal de contacto, `ConsentimientoView` público).
3. **Copy de `PerfilCoachView.vue`**: agregada línea de apertura bajo el título, y sección nueva
   "Contacto directo" con email/teléfono reales del coach (`fernando@saltup.cl`, +56 9 8412 7466)
   — sacados del `Presupuesto_Coaching_ULS.pdf` real, no inventados. Antes la página no tenía
   ninguna vía de contacto directo pese a ser su propósito ("que la empresa conozca a quién está
   contratando").

### Verificación

- `npm run lint` → 0 errores (2 warnings preexistentes, no tocan estos archivos).
- `npm run build` (autoritativo: `vue-tsc -b && vite build`) → limpio.
- `npx vitest run` → 303/303, sin regresiones (`PerfilCoachView` no tenía spec previo).
- Confirmado con grep que no queda ningún "Cargando…" plano fuera del propio componente.

### Revisión

Descartado explícitamente sin implementar: dark mode (cero soporte hoy, rediseño sistémico de
tokens, no es quick win), sidebar colapsable (ya resuelto por `AppShell` nav groups), prompts de
copy para sitios de marketing público (no aplica a un portal B2B autenticado), e instalar
herramientas de terceros no verificadas para reducir tokens en Claude Code (mismo criterio que la
revisión del repo de best-practices: no se adopta nada sin verificar necesidad real primero).

## 2026-09-02 — Agenda del coach: disponibilidad + auto-reserva con aprobación

### Contexto

El usuario preguntó si se podía mejorar el panel de sesiones y si el coachee podía ver las horas
disponibles del coach. Revisando el código real se confirmaron 3 gaps: `SesionesService.create()`/
`update()` no validaban conflicto de horario (dos coachees se podían agendar a la misma hora sin
error), no existía ninguna vista que juntara las sesiones de todos los coachees en un solo
calendario para el coach, y no existía ningún concepto de "disponibilidad" del coach. Vía pregunta
cerrada el usuario eligió el modelo **"Auto-reserva con aprobación"**: el coachee ve horas libres
y pide una, el coach aprueba o rechaza con un clic. Plan formalizado y validado con un subagente
Plan antes de construir (ver `~/.claude/plans/parallel-inventing-robin.md`).

### Hallazgo crítico de zona horaria

El backend corre con `TZ=UTC` (Dockerfile + arranque local), así que `Date.getDay()`/`getHours()`
nativos leen en UTC, no en horario de Chile. Se centralizó la conversión correcta en
`backend/src/sesiones/chile-time.util.ts` (`Intl.DateTimeFormat` con `timeZone: 'America/Santiago'`,
sin hardcodear offset — Chile ha cambiado la ley de horario de verano varias veces), con specs que
fijan casos donde la hora local cruza al día calendario UTC siguiente.

### Backend (`backend/src/sesiones/`)

- `sesiones.constants.ts` (`SESION_DURACION_MINUTOS = 60`, confirmado en el presupuesto real del
  coach), `chile-time.util.ts` (+spec).
- Entidades nuevas: `DisponibilidadCoach` (bloques semanales recurrentes, sin `coachId` — mono-coach)
  y `SolicitudSesion` (enum propio `EstadoSolicitudSesion`, no se reusa `EstadoSolicitud` de
  reagendamiento porque ahí no se distingue aprobado de rechazado).
- `DisponibilidadService` (+spec): CRUD de bloques + `calcularSlotsLibres()` — cruza bloques
  semanales, sesiones ya agendadas (cualquier coachee) y solicitudes pendientes.
- `SolicitudesSesionService` (+spec, calcado de `solicitudes-reagendamiento.service.ts`): crea con
  re-validación de que el slot sigue libre, aprobar llama a `SesionesService.create()` (reusa el
  linkeo a ciclo abierto), notifica+emaila en ambos casos.
- `SesionesService`: conflicto de horario en `create()`/`update()` (`ConflictException`),
  `findTodasConCoachee()` para la agenda global.
- Controllers nuevos `DisponibilidadController`/`SolicitudesSesionController` + `GET /sesiones/todas`
  en el controller existente.
- Notificaciones/email: 2 tipos nuevos (`SOLICITUD_SESION_CREADA`/`RESUELTA`) + 2 métodos nuevos en
  `EmailService`.
- Migración `1788318326845-DisponibilidadYSolicitudesSesion.ts`: 2 tablas, enum nativo nuevo,
  **índice único parcial** `(fecha_hora_propuesta) WHERE estado='pendiente'` — cierra a nivel de
  base de datos la carrera de dos coachees pidiendo el mismo slot casi al mismo tiempo (la
  re-validación en el servicio es solo UX). `ALTER TYPE ... ADD VALUE` sobre el enum de
  notificaciones existente, con `down()` vía el patrón rename-swap estándar de Postgres.

### Frontend

- `api/disponibilidad.ts`, `api/solicitudes-sesion.ts` (nuevos), `api/sesiones.ts` extendido
  (`coachee?: {id, nombre}`, `getTodasLasSesiones()`).
- `WeekCalendar.vue`: prop opcional `mostrarCoachee` (backward-compatible).
- `DisponibilidadCalendar.vue` (nuevo, coachee): grilla semanal de solo horas libres — componente
  separado de `WeekCalendar` a propósito, la interacción de click es distinta (siempre pide un
  horario, nunca abre link ni hace scroll).
- `views/coach/AgendaView.vue` (nuevo, `/coach/agenda`): solicitudes pendientes (aprobar/rechazar
  inline) + calendario global + gestión de bloques de disponibilidad.
- `views/coachee/SesionesView.vue`: bloque "Horas disponibles" + modal "Solicitar esta hora".
- Nav/router: entrada "Mi agenda" en el grupo "Coaching" del coach, reusando el ícono `sesiones`
  ya existente.

### Verificación

- Backend: `npm run lint`, `npm run build`, `npm test` → 398/398 (+30 tests nuevos). Migración
  aplicada y revertida (`migration:run`/`migration:revert`) confirmando `down()` simétrico.
- Frontend: `npm run lint`, `npm run build` (autoritativo), `npx vitest run` → 304/304 sin
  regresiones.
- Smoke test real con curl contra backend+DB locales (`coach@test.com` / `qa-paleta-verify@test.com`,
  `qa-empresa-verify@test.com`): bloque de disponibilidad → slots devueltos en horario de Chile
  correcto (verificado a mano) → solicitud de sesión → segunda solicitud al mismo horario rechazada
  409 → aprobación crea la `Sesion` real → intento de agendar directo al mismo horario rechazado
  409 → agenda global del coach muestra la sesión con el nombre del coachee → coachee la ve en
  `/sesiones/me` → re-aprobar la misma solicitud rechazado 409 → rol EMPRESA sin acceso a ningún
  endpoint nuevo (403 en los 3 probados). Datos de prueba limpiados al terminar.

## 2026-09-02 — Fecha límite en Quiz, Flashcards, Mapas, Ejercicios, Test de Estilo y Recursos

### Contexto

El usuario preguntó si el contenido de estudio/retos tiene fecha de duración. Ninguna de las 6
entidades la tenía — el único control de ciclo de vida era el toggle manual `activo`. Vía pregunta
cerrada se eligió el modelo **"Fecha límite por ítem"**: el coach pone una fecha límite opcional al
crear (o editar) cada ítem; pasada esa fecha, deja de aparecer como disponible para el coachee
automáticamente.

### Hallazgo de diseño reusado

`chile-time.util.ts` (de la feature de agenda) se **relocalizó de `sesiones/` a `common/`** porque
ahora lo usan 6 módulos sin relación entre sí. Se agregó `finDelDiaChileAUtc(fechaSimple)`: una
fecha simple "YYYY-MM-DD" elegida en un `<input type="date">` se interpreta como el **fin de ese
día en horario de Chile** (23:59), no como medianoche UTC — si no, el contenido habría quedado
"vencido" desde la noche anterior en Chile.

### Backend — mismo patrón en 6 módulos (`quiz/`, `flashcards/`, `mapas/`, `ejercicios/`,
`test-estilo/`, `recursos/`)

- Columna `fecha_limite` (timestamptz, nullable) en las 6 entidades.
- `CreateXDto` gana `fechaLimite?: string`. `UpdateXDto` (`PartialType(OmitType(CreateXDto,
  ['fechaLimite']))` + override propio con `@ValidateIf` — mismo patrón ya usado en
  `UpdateCoacheeDto`) acepta además `null` explícito para quitarla.
- `create()`/`update()`: conversión a `Date` vía `finDelDiaChileAUtc()`, separada del
  `assignDefined()` genérico (asignar el string crudo sobre un campo `Date` habría sido un bug).
- `disponiblesParaCoachee()` (o `misRecursos()` en Recursos): filtro adicional en JS —
  `!item.fechaLimite || item.fechaLimite.getTime() >= Date.now()` — sin tocar el filtro de
  competencia ya existente.
- **Recursos es distinto a los otros 5**: no se filtra por competencia sino por
  carpeta-visible/asignación-directa, y ya tenía `AsignacionRecurso.expiraEn` (vencimiento del
  acceso puntual de UN coachee). La `fecha_limite` nueva es un concepto complementario, no
  redundante: cuándo deja de estar disponible el recurso EN GENERAL, para cualquiera.
- Migración única `1788356642011-FechaLimiteContenido.ts` (`ADD COLUMN` en las 6 tablas).

### Frontend

- `lib/fechaLimite.ts` (+spec): `formatearFechaLimite`, `fechaLimiteVencida`, `aInputDate` — este
  último reusa `aFechaLocal()` de `dateRange.ts` (se exportó, antes era privado).
- `components/FechaLimiteEditor.vue` (nuevo, reusado en los 6 módulos): control inline
  poner/cambiar/quitar fecha límite de un ítem ya creado.
- Los 6 `api/*.ts` ganan el campo + parámetro en create/update. `updateRecurso()` es nuevo (no
  existía ninguna función de update para Recursos en el frontend).
- Las 6 vistas de coach ganan el input en el form de creación + `FechaLimiteEditor` en la
  lista/detalle. Las 6 vistas de coachee ganan un badge "Vence: …" cuando está seteada.

### Verificación

- Backend: `npm run lint`, `npm run build`, `npm test` → 421/421 (+30 tests nuevos: chile-time
  relocalizado, create/update/disponibles por cada uno de los 6 módulos).
- Migración aplicada y revertida (`migration:run`/`migration:revert`) confirmando `down()` simétrico.
- Frontend: `npm run lint`, `npm run build` (autoritativo), `npx vitest run` → 311/311 sin
  regresiones (fixtures de 6 specs existentes actualizados con el campo nuevo).
- De paso: se encontró y borró `flashcards.service 2.ts`, un archivo duplicado espurio (permisos
  distintos, sin trackear en git) que rompía `nest build` — mismo tipo de hallazgo que el
  `settings.local 2.json` de antes en esta sesión.
- Smoke test real con curl (`coach@test.com` / `qa-paleta-verify@test.com`): quiz con fecha límite
  de 2020 → no aparece en `disponibles`; quiz con fecha límite de 2027 → sí aparece; quitar la
  fecha límite del vencido → vuelve a aparecer. Confirmado a mano que "2020-01-01" se guardó como
  "2020-01-02T02:59:00Z" (fin del 1 de enero en Chile, no medianoche UTC). Datos de prueba
  limpiados al terminar.

## 2026-09-02 — Rediseño estratégico del Dashboard del Coach

### Contexto

Requerimiento formal del usuario: el dashboard del coach era un panel operativo sin horizonte
temporal claro ("Ingreso del período" era el mes en curso, sin decirlo). Se pidió que el coach
entienda en segundos qué sesiones tiene esta semana, qué contratos vencen en el corto/mediano
plazo, y su proyección económica — "¿esta información le sirve al coach para planificar su
semana y tomar acciones concretas?" como criterio para cada elemento.

Se cruzó el requerimiento contra el modelo real antes de diseñar. Hallazgo crítico confirmado con
el usuario vía pregunta cerrada: `Empresa` no tenía ninguna fecha de contrato — sin eso, "qué
contrato vence este mes" no se podía responder con datos reales (no con un proxy). El usuario
eligió agregar el campo real. El resto de lo pedido **ya existía, construido y probado**, solo
no estaba conectado al dashboard: `NegocioService.resumenComercial()`/`proyeccionMensual()`
(con UI y el componente `ProyeccionIngresosChart.vue` ya en `/coach/negocio`), y
`SesionesService.findTodasConCoachee()` (de la feature de Agenda, esta misma sesión).

### Decisión de scope

"Buscar nuevos prospectos" (empresas que todavía no son clientes) queda fuera — no existe ningún
registro de "leads" en el sistema, y construirlo sería una feature de CRM aparte. Se cubre lo real:
empresas existentes con contrato vencido/por vencer se marcan como que requieren renovar o cerrar.

### Backend

- `Empresa` gana `fechaInicio`/`fechaFin` (tipo Postgres `date`, no `timestamptz` — es una fecha
  calendario de término de contrato, no un instante, así que no hace falta `chile-time.util`).
  `CreateEmpresaDto`/`UpdateEmpresaDto` los aceptan opcionales.
- `NegocioService.carteraEmpresas()` (nuevo): una sola función que cubre "por vencer este
  mes/semestre" y "cartera general" a la vez — por cada empresa activa calcula un `estado`
  (`sin_fecha` / `vencido` / `vence_este_mes` [≤30 días] / `vence_este_semestre` [31-180 días] /
  `vigente`) y reusa `calcularResumenCobros()` para las horas consumidas del mes. Además agrega
  `independientesPorVencer`: coachees sin empresa cuyo ciclo abierto está por vencer (reusa
  `alertasSeguimiento()`/`CiclosService` ya existentes — los independientes no tienen "contrato"
  con fecha, se cubren con la señal de sesiones restantes que ya existía).
- `SesionesService.findEnRangoConCoachee()` (nuevo): sesiones de un rango con coachee **y su
  empresa** cargados (`relations: { coachee: { empresa: true } }` — a diferencia de
  `findTodasConCoachee()` de Agenda, acá hace falta también la empresa).
- Rutas nuevas: `GET /negocio/cartera`, `GET /sesiones/semana?desde&hasta` (ambas COACH).
- Migración `1788359513945-FechaContratoEmpresa.ts` (`ADD COLUMN` simple, sin enum ni conversión).

### Frontend

- `views/coach/DashboardView.vue` reescrito: franja de KPIs (sesiones esta semana, empresas por
  renovar este mes, ingreso esperado del mes, empresas sin fecha de contrato) + "Esta semana"
  (lista compacta agrupada por día, no el grid completo de `/coach/agenda`) + "Cartera de
  empresas" (una sola lista ordenada por urgencia, con badge de estado y acción sugerida) +
  "Proyección económica" (KPIs del mes + `ProyeccionIngresosChart` reusado tal cual) +
  "Coachees que necesitan atención" (el panel operativo de siempre, se mantiene pero baja de
  posición — sigue siendo accionable, a otro nivel).
- `lib/sesionesPorDia.ts` (+spec): agrupa sesiones por día calendario local, nuevo.
  `lib/dateRange.ts` ganó `aFechaLocal` exportado (antes privado, reusado acá).
- `EmpresasView.vue` (coach) gana los 2 inputs de fecha en el form de crear/editar.
- `api/empresas.ts`, `api/negocio.ts` (`getCarteraEmpresas`), `api/sesiones.ts`
  (`getSesionesSemana`) actualizados con los campos/funciones nuevas.

### Verificación

- Backend: `npm run lint`, `npm run build`, `npm test` → 424/424 (+8 tests nuevos:
  `carteraEmpresas()` con los 5 estados + filtro de independientes, `findEnRangoConCoachee()`).
  Migración `migration:run`/`migration:revert` simétrica.
- Frontend: `npm run lint`, `npm run build` (autoritativo), `npx vitest run` → 320/320 (+9 tests
  nuevos en `DashboardView.spec.ts` para "Esta semana"/"Cartera de empresas", +4 en
  `sesionesPorDia.spec.ts`; 6 fixtures de specs existentes actualizados con los campos nuevos de
  `Empresa`).
- Smoke test real con curl (`coach@test.com`): empresa con `fechaFin` a 20 días →
  `estado: 'vence_este_mes'`, `diasParaVencer: 20`; empresa sin fecha → `estado: 'sin_fecha'`;
  `/sesiones/semana` responde con coachee+empresa cargados; rol EMPRESA sin acceso a ninguno de
  los 2 endpoints nuevos (403). Datos de prueba limpiados al terminar.

### Follow-up — renombre a "Panorama" + fecha de término visible en más lugares

- `AppShell.vue`/`DashboardView.vue` (coach): "Dashboard" → **"Panorama"** (título + ítem de
  menú) — se descartó "Resumen" por chocar con la pestaña homónima que ya existe dentro de
  `/coach/negocio` (confirmado con grep antes de proponerlo). Se dejó la URL `/coach/dashboard`
  intacta a propósito, solo cambió el texto visible.
- `views/coach/EmpresasView.vue`: la tabla de mantenedores ganó la columna "Término contrato"
  (antes solo se veía en el formulario de crear/editar) — vacía se muestra en bronce como aviso.
- `views/empresa/DashboardView.vue`: la tarjeta "Mi contrato" ganó una 4ª celda "Término de
  contrato" — la propia empresa cliente ahora también puede ver cuándo vence su contrato, no
  solo el coach.
- Verificación: `npm run lint`, `npm run build`, `npx vitest run` → 322/322 (+3 tests nuevos:
  columna con/sin fecha en la tabla del coach, fecha visible en la tarjeta de la empresa).

## 2026-09-02 — Atención inmediata, gestión de renovación, comparativo y confirmación de sesión

### Contexto

Complemento al rediseño del Panorama ("Propuesta de mejoras — Dashboard del Coach"), 4 bloques
priorizados por el usuario vía pregunta cerrada: **sí** a "quick wins con datos existentes",
**sí** a "historial de gestión por empresa", **sí** a "confirmación de sesión por el coachee";
**"pipeline de prospección" queda explícitamente pendiente/fuera de alcance** (no existe ningún
concepto de "prospecto" en el sistema — sería un sub-sistema tipo CRM aparte).

### Backend

- `GestionRenovacion` (nuevo, módulo `empresas/`): bitácora append-only de gestión de renovación
  por empresa (`nota`, `proximoSeguimiento` fecha opcional) — mismo criterio que `Logro`, no se
  edita ni se borra. `EmpresasService` gana `crearGestion()`, `listGestionDeEmpresa()`,
  `ultimaGestionPorEmpresa()` (agrupado en JS, evita N+1). Rutas `POST/GET /empresas/:id/gestion`.
- `Sesion.confirmada` (nuevo, `default: false`) — la pone el propio coachee (a diferencia de
  `asistio`, que registra el coach después). `SesionesService.confirmar()`, ruta
  `POST /sesiones/:id/confirmar` (COACHEE).
- `chile-time.util.ts` gana `inicioDelDiaChileAUtc()`, `fechaSimpleHoyChile()`,
  `sumarDiasFechaSimple()` — necesarios para calcular "hoy/mañana" y "esta semana" en horario de
  Chile desde un proceso que corre con `TZ=UTC`.
- `NegocioService.carteraEmpresas()` extendido con `ultimaGestion` por empresa (el semáforo de
  color se calcula en el frontend, es presentación). `NegocioService.atencionInmediata()`
  (nuevo): sesiones de hoy/mañana sin confirmar, contratos que vencen en <15 días sin gestión
  vigente (sin gestión, o con `proximoSeguimiento` ya pasado), empresas sin pagar. `NegocioService
  .comparativoYCapacidad()` (nuevo): ingreso mes actual/anterior + variación %, coachings
  iniciados actual/anterior, horas comprometidas de la semana vs. `DisponibilidadCoach` total.
  Rutas `GET /negocio/atencion`, `GET /negocio/comparativo` (COACH).
- Migración `1788362342328-GestionRenovacionYConfirmacionSesion.ts` (`gestiones_renovacion` +
  `sesiones.confirmada`, un archivo con dos bloques).

### Frontend

- `lib/semaforoCartera.ts` (+spec, nuevo): rojo/amarillo/verde combinando `diasParaVencer` +
  `ultimaGestion?.proximoSeguimiento` (mismo criterio de "urgente" que `atencionInmediata()`,
  expresado en 3 niveles).
- `views/coach/DashboardView.vue`: nueva sección **"Atención inmediata" primero en la página**
  (antes que los KPIs, principio de UX del requerimiento) con 3 sub-listas, cada una con su
  acción (Ver coachee / Gestionar / Ver empresa); KPI "Sesiones esta semana" pasa a mostrar horas
  (`X/Y hrs`); filas de "Esta semana" ganan badge "Sin confirmar"; filas de "Cartera de empresas"
  ganan el punto de color del semáforo y un modal "Gestionar" (historial + form de nueva entrada,
  reusado desde ambas secciones); "Proyección económica" gana la variación vs. mes anterior junto
  a "Ingreso del mes".
- `views/coachee/SesionesView.vue`: botón "Confirmar asistencia" en el bloque de sesión futura
  (junto a "Solicitar reagendamiento"); una vez confirmada se reemplaza por "✓ Confirmada".
- `api/empresas.ts` (`GestionRenovacion`, `crearGestion`, `getGestionDeEmpresa`), `api/negocio.ts`
  (`getAtencionInmediata`, `getComparativo`, tipos nuevos), `api/sesiones.ts` (`confirmarSesion`,
  `Sesion.confirmada`).

### Verificación

- Backend: `npm run lint`, `npm run build`, `npm test` → 443/443 (+19 tests nuevos: gestión de
  empresa, `confirmar()`, `atencionInmediata()`/`comparativoYCapacidad()` cubriendo urgente-con-
  gestión vs. urgente-sin-gestión vs. gestión-vencida, + 6 de los nuevos helpers de
  `chile-time.util`). Migración `migration:run`/`migration:revert` simétrica.
- Frontend: `npm run lint`, `npm run build` (autoritativo, + cross-check con `tsc -p
  tsconfig.app.json` por el punto ciego de `vue-tsc` en specs), `npx vitest run` → 339/339 (+17
  tests nuevos: `semaforoCartera.spec.ts`, atención inmediata / modal de gestión / badge sin
  confirmar / variación en `DashboardView.spec.ts`, confirmar asistencia en `SesionesView.spec.ts`
  del coachee; fixtures de `Sesion`/`EmpresaCartera` en 4 specs existentes actualizados con los
  campos nuevos).
- Smoke test real con curl (`coach@test.com` + `qa-paleta-verify@test.com`): `POST .../gestion`
  → aparece en `GET .../gestion` y en `ultimaGestion` de `/negocio/cartera`; `POST
  /sesiones/:id/confirmar` como coachee → `confirmada: true` persistido; `/negocio/atencion` y
  `/negocio/comparativo` responden con datos reales de producción. Backend reconstruido y
  reiniciado (`node dist/main`, `TZ=UTC`); frontend dev server sigue corriendo (hot-reload).

## 2026-09-02 — Fix: clic en sesión sin link de videollamada no hacía nada

### Contexto

Reporte del usuario: en su agenda, si una sesión futura no tiene link de videollamada
registrado, hacer clic en el bloque "no abre nada y no dice nada". Causa raíz encontrada en
`WeekCalendar.vue` (componente compartido por `/coach/agenda`, la pestaña "Sesiones" del
detalle de coachee y "Mis sesiones" del coachee): `onClickBloque()` solo abría el link cuando
`esFutura && linkVideollamada`; si faltaba el link, caía a `emit('select', bloque.id)` sin dar
ninguna señal. Ese `emit` además resultaba en un no-op real en `/coach/agenda` (nunca escucha
`@select`) y, incluso en las 2 vistas que sí lo escuchan, solo hace scroll-and-highlight sobre
la lista de **sesiones pasadas** — una sesión futura nunca tiene una fila ahí, así que el clic
tampoco hacía nada en esas vistas tampoco.

### Frontend

- `components/WeekCalendar.vue`: `onClickBloque()` ahora, para una sesión futura sin link,
  muestra `notifyError('Sin enlace de videollamada', …)` en vez de caer al `emit('select', …)`
  silencioso. El `title` del bloque también distingue el caso ("Sin enlace de videollamada
  registrado" vs. "Abrir enlace de la videollamada").
- `components/WeekCalendar.spec.ts` (nuevo — el componente no tenía specs): cubre abrir el link
  cuando existe, mostrar la notificación cuando no existe (sin `emit('select')`), y que una
  sesión pasada sigue emitiendo `select` como antes.

### Verificación

- Frontend: `npm run lint`, `npm run build`, `npx vitest run` → 343/343 (+4 tests nuevos). Vite
  dev server recogió el cambio en caliente (hot-reload), sin reinicio necesario.

## 2026-09-02 — Consolidar Quiz/Flashcards/Mapas/Ejercicios/Test de Estilo en un hub "Estudiar"

### Contexto

El coach tenía 5 ítems de menú casi idénticos apretados en "Trabajo" (7 ítems con Planes/
Recursos). El usuario propuso cards + modal de creación; se analizó la complejidad real de las
5 vistas antes de aceptar el diseño (Mapas usa un canvas interactivo `MapaCanvas.vue`,
Ejercicios tiene versiones+feedback, Quiz tiene preguntas+ranking — ninguna cabe bien en un
`AppModal` `max-w-2xl`, y menos con modal-dentro-de-modal para navegar lista→detalle). Se
reusó en su lugar el patrón `NegocioView.vue`/`LegalView.vue` (pestañas por `?tab=`, ya probado
2 veces en esta misma app) con el selector de pestaña como cards grandes en vez de texto chico,
para acercarse a la idea original del usuario sin los problemas de espacio. Usuario aprobó
("haz lo que indicas").

### Frontend

- Las 5 vistas (`views/coach/{Quiz,Flashcards,Mapas,Ejercicios,TestEstilo}View.vue`) se
  movieron a `views/coach/estudio/*Tab.vue` — contenido idéntico, solo se sacó el wrapper
  `<AppShell>` (cada una ya tenía el mismo esqueleto exacto: lista con card-grid → detalle con
  `StatusToggle`/`Eliminar`/`FechaLimiteEditor`/`SectionCard`, + un `AppModal` de "Nuevo X" que
  no se tocó — ahí es donde el flujo de creación ya funcionaba bien).
- `views/coach/EstudioView.vue` (nuevo): 5 cards grandes (ícono + label + contador en vivo,
  ej. "Quiz (4)", mismo criterio que los tabs de `DashboardView.vue` — "Coachees (3)") como
  selector de pestaña — mismo mecanismo `?tab=` que Negocio/Legal. Los contadores salen de los
  5 `list*()` que ya existían (`listQuizzes`, `listFlashcards`, `listMapas`, `listEjercicios`,
  `listTestsEstilo`), llamados en paralelo al montar.
- `router/index.ts`: 1 ruta nueva `coach-estudio` reemplaza las 5 anteriores; se agregaron 5
  redirects (`/coach/quiz` → `/coach/estudio?tab=quiz`, etc.) con el mismo patrón que ya usaban
  `/coach/auditoria`/`/coach/comercial` — ningún link/bookmark viejo rompe.
- `AppShell.vue`: grupo "Trabajo" baja de 7 a 3 ítems (Planes, Recursos, **Estudiar** — mismo
  label que ya usa el grupo del coachee para este mismo tipo de contenido). El lado coachee no
  se tocó (ahí el flujo es de consumo, no de gestión).
- Specs: `QuizView.spec.ts`/`FlashcardsView.spec.ts`/`MapasView.spec.ts` se movieron a
  `estudio/*Tab.spec.ts` (mismos tests, import actualizado). `EstudioView.spec.ts` (nuevo,
  calcado de `LegalView.spec.ts`): tab por defecto, cambio de tab por click actualiza
  `route.query.tab`, contador en cada card. Ejercicios/Test de Estilo no tenían spec antes de
  este cambio (gap preexistente, no se agregó cobertura nueva — fuera de alcance de un *move*).

### Verificación

- `npm run lint` (con `--fix` para la indentación que quedó de sacar el wrapper `<AppShell>`),
  `npm run build` (vue-tsc + vite) + cross-check con `tsc -p tsconfig.app.json`, `npx vitest
  run` → 348/348 (+5 tests nuevos de `EstudioView.spec.ts`).
- Verificado en Chrome real (headless vía CDP, login `coach@test.com`): `/coach/quiz` viejo
  redirige a `/coach/estudio?tab=quiz`; el menú "Trabajo" ya no tiene los 5 ítems sueltos;
  los 5 contadores de las cards coinciden con los datos reales (Quiz 4, Flashcards 4, Mapas 3,
  Ejercicios 1, Test de Estilo 1); clic en una card cambia de pestaña sin recargar; el detalle
  de un mapa (canvas interactivo `MapaCanvas`) sigue funcionando igual dentro del hub.

## 2026-09-02 — Perfil del coachee: Playground, landing en Mi Aprendizaje, montaña de progreso, tareas pendientes y resumen imprimible

### Contexto

Mismo pedido de consolidación que el coach, aplicado al coachee, más el usuario pidió
explícitamente ponerse "en su rol" y evaluar la experiencia. Auditoría contra el código real
(no supuestos) encontró 6 brechas concretas: Ejercicios/Test de Estilo invisibles en el resumen
de aterrizaje; las actividades del plan de ejecución (las tareas/entregables reales) enterradas
en una pestaña sin aparecer en ningún resumen; nada imprimible para un proceso **en curso**
(solo el Certificado, y solo para ciclos ya cerrados); el avance mostrado como número+barra sin
narrativa de crecimiento pese a tener los datos para una mejor historia; las 5 acciones "Ir a
X →" de Mi Aprendizaje ya eran `<button>` pero estilizadas como texto subrayado; landing
post-login en `/coachee/plan` en vez del resumen pensado para eso. Las 5 mejoras pedidas
atacan directo estas 6 brechas.

### Frontend

- **Playground** (`views/coachee/PlaygroundView.vue`, nuevo): mismo patrón que
  `EstudioView.vue` del coach — 5 cards grandes con contador (`listQuizzesDisponibles` y
  equivalentes, ya existían) como selector `?tab=`. Las 5 vistas
  (`views/coachee/{Quiz,Flashcards,Mapas,Ejercicios,TestEstilo}View.vue`) se movieron a
  `views/coachee/playground/*Tab.vue` (mismo *move* mecánico que el coach). `NavIcon.vue` gana
  el ícono `playground` (un gamepad simple). Menú: grupo "Estudiar" baja de 6 a 2 ítems
  (Biblioteca se queda aparte — es material del coach, no herramienta de práctica; Playground
  reemplaza los 5). `router/index.ts`: 1 ruta + 5 redirects, mismo patrón que el coach.
- **Landing = Mi Aprendizaje**: `homeFor('coachee')` pasa de `/coachee/plan` a
  `/coachee/mi-aprendizaje`.
- **`MiAprendizajeView.vue` + `lib/miAprendizaje.ts`**: las 5 acciones "Ir a X →" pasan de
  texto subrayado a chip/botón real (mismo lenguaje que ya usa el resto de la app). 2
  `SectionCard` nuevas (Ejercicios, Test de Estilo) — `resumenAprendizaje()` gana
  `ejercicios`/`testEstilo` (via `numeroVersiones===0`/`!yaRespondido`, campos que ya existían
  en los DTOs). Nueva `SectionCard "Tareas pendientes"` **primero en la página** (mismo
  principio que "Atención inmediata" del coach) — junta actividades del plan no completadas
  (siempre, el campo de fecha es texto libre tipo "Semana 1", no fecha real) + contenido con
  `fechaLimite` vencida o a ≤7 días de los 5 módulos + recursos (flashcards/mapas quedan fuera:
  son repaso continuo, sin estado binario de "completado"). Nueva `SectionCard "Mi progreso"`
  con la montaña compacta + botón a `/coachee/progreso`.
- **Gráfico de montaña** (`lib/montanaProgreso.ts` + `components/MontanaProgreso.vue`, ambos
  nuevos): reinterpreta `PuntoProgreso[]` (ya existía via `getMiLineaProgreso()`) como una
  senda ascendente — cada sesión un punto, más alto cuanto mayor `cercaniaObjetivo`, SVG a mano
  (mismo criterio que `DonutChart`/`MapaCanvas`). Usado en Mi Aprendizaje (compacto) y en
  `ProgresoView.vue` (completo, reemplaza la barra plana de "Avance general" — renombrada "Tu
  camino de crecimiento"; `ProgresoLineaTiempo` se mantiene tal cual debajo, da el detalle por
  sesión que la montaña no da). Nota de implementación: el SVG usa
  `preserveAspectRatio="none"` para verse panorámico, lo que distorsiona cualquier `<text>`
  interno — el mensaje de estado vacío se resolvió como HTML superpuesto, no `<text>` de SVG.
- **Resumen imprimible** (`views/coachee/EstadoProcesoView.vue` +
  `components/EstadoProcesoContenido.vue`, nuevos): mismo patrón que
  `CertificadoView.vue`/`CertificadoContenido.vue` (`window.print()`, clases `print:`), pero
  para un proceso **en curso** — objetivo, competencia, inicio del ciclo, avance %, próxima
  sesión, actividades pendientes/completadas, logros recientes. Ruta `/coachee/resumen`, botón
  "Imprimir resumen" en Mi Aprendizaje y en Progreso. `CertificadoView.vue` no se tocó — sigue
  siendo específicamente el certificado de cierre.

### Verificación

- `npm run lint` (con `--fix`), `npm run build` (vue-tsc + vite) + cross-check `tsc -p
  tsconfig.app.json`, `npx vitest run` → 369/369 (+21 tests nuevos: `PlaygroundView.spec.ts`,
  `montanaProgreso.spec.ts`, +8 en `miAprendizaje.spec.ts` para ejercicios/testEstilo/
  tareasPendientes, +2 en `MiAprendizajeView.spec.ts`).
- Real en Chrome (headless vía CDP, login `qa-paleta-verify@test.com`): login aterriza en Mi
  Aprendizaje; tarjeta "Tareas pendientes" muestra una actividad real del plan; "Mi progreso"
  muestra la montaña (estado vacío correcto, sin autoevaluación aún); `/coachee/quiz` viejo
  redirige a `/coachee/playground?tab=quiz`; Playground con datos reales (Quiz 1, Flashcards 2,
  Mapas 1, Ejercicios 1, Test de Estilo 1), clic en "Ejercicios" cambia de pestaña y muestra el
  ejercicio real con feedback; `/coachee/resumen` genera el resumen imprimible con datos reales
  (objetivo, inicio 15-ago-2026, 0 actividades completadas/1 pendiente, 2 logros); se corrigió
  en vivo un bug de texto distorsionado en la montaña antes de dar por terminada la tarea.

## 2026-09-02 — Fix: gráfico de progreso confuso/mal aprovechado (seguimiento a lo anterior)

### Contexto

3 rondas de feedback del usuario sobre `MontanaProgreso.vue` (recién construido): (1) se veía
"pixeleado" — causa real: viewBox cuadrado estirado con `preserveAspectRatio="none"` dentro de
una caja mucho más ancha que alta, escala no uniforme; (2) tras el fix, quedaba angosto con un
hueco en blanco al lado — el modo `compact` limitaba el ancho a `max-w-sm` dentro de una card
de ancho completo; (3) "¿qué significa cada montaña?" — ninguna, eran decorativas, sin dato
real detrás, y el usuario pidió buscar "un gráfico representativo" preguntando si hacía falta
una librería. Se confirmó que **ninguna** — todos los gráficos de la app (`DonutChart`,
`MapaCanvas`, `ProgresoLineaTiempo`, `ProyeccionIngresosChart`) son SVG/CSS a mano, sin
librería, y el patrón más simple (`ProyeccionIngresosChart`: barras con altura=valor, sin
metáfora) es justo lo que la montaña no tenía.

### Frontend

- `lib/montanaProgreso.ts` → `lib/graficoProgreso.ts` (+ `components/MontanaProgreso.vue` →
  `GraficoProgreso.vue`): se reemplazó la silueta decorativa por un gráfico de línea/área real
  — eje Y con grilla en 0/25/50/75/100% (etiqueta solo en 0/50/100, sin recargar), área rellena
  bajo la línea, puntos coloreados por nivel (mismo `nivelProgreso`/`coloresNivel` de siempre),
  fechas de primera/última sesión como caption. Mismo viewBox panorámico (`aspect-[10/3]`)
  calcado por el contenedor que ya se había corregido para evitar la distorsión — pero esta vez
  las etiquetas de texto llevan un tamaño de fuente calibrado para esa escala (el primer intento
  con `font-size` en unidades del viewBox salió gigante).
- `views/coachee/ProgresoView.vue`: "Tu camino de crecimiento" y "Línea de tiempo" (antes 2
  `SectionCard` apiladas a todo el ancho) se fusionaron en una sola, con `ProgresoLineaTiempo`
  (el detalle por sesión, sin tocar) y `GraficoProgreso` (la tendencia) lado a lado en
  `grid lg:grid-cols-2` — a mitad de ancho el gráfico de tendencia se ve proporcionado, no
  estirado.
- `views/coachee/MiAprendizajeView.vue`: se sacó el prop `compact` (ya no existe) de su uso de
  `GraficoProgreso`.

### Verificación

- `npm run lint`, `npm run build`, `npx vitest run` → 372/372 (specs de la lib movidos y
  actualizados a los nuevos nombres de función/export, +3 tests nuevos: grilla del eje Y y
  cierre del polígono de área).
- Verificado con una página HTML aislada (mismos valores de fuente/trazo que el componente) en
  Chrome real: etiquetas de eje legibles a tamaño normal, sin gigantismo ni distorsión, a ancho
  completo y a la mitad.

## 2026-09-03 — Perfil del coach: LinkedIn, CV, certificaciones y foto (visible para coachee y empresa)

### Contexto

`views/empresa/PerfilCoachView.vue` tenía la identidad del coach ("Coach Fernando Ramos", bio,
metodología) **hardcodeada**, sin backend — el propio archivo lo dejaba anotado como pendiente.
El coachee no tenía ninguna pantalla equivalente. El usuario pidió que el coach pueda cargar su
LinkedIn, CV y certificados (confirmó **lista estructurada**: nombre + entidad emisora + archivo
propio por certificación, no un cajón de documentos sueltos), y en un segundo pedido agregó foto
de perfil / avatar.

### Backend

- Módulo nuevo `perfil-coach/`: entidades `PerfilCoach` (una fila por coach, atada a
  `coachUserId` — sin FK formal a `User` para no acoplar módulos) y `CertificacionCoach` (FK
  `ON DELETE CASCADE`). Mismo patrón "1-a-1, crear-si-no-existe" que `PlanDesarrollo`.
  `PerfilCoachService.obtenerDelCoach()` resuelve el único `Role.COACH` de la tabla `User` — no
  existía ningún precedente de "resolver el coach" en el proyecto, se agregó desde cero.
- `PerfilCoachController`: `GET/PATCH /perfil-coach/me` + `POST me/foto` + `POST me/cv` (COACH,
  editable), `POST/DELETE me/certificaciones[/:id]` (COACH), `GET /perfil-coach` +
  `/foto`/`/cv`/`/certificaciones/:id/archivo` (COACH+COACHEE+EMPRESA, solo lectura). Mismo
  patrón `FileInterceptor`+`diskStorage`+`UPLOADS_DIR` compartido que `recursos`/`ciclos`/`legal`.
- `common/file-type-filter.util.ts`: `MIMETYPES_IMAGEN` (nuevo, para la foto) y
  `MIMETYPES_PDF_O_IMAGEN` (certificaciones — acepta el PDF escaneado o una foto del diploma).
- Migración `1788462867393-PerfilCoach.ts`: `perfiles_coach` + `certificaciones_coach`.

### Frontend

- `api/perfilCoach.ts` (nuevo): tipos + `getMiPerfil`/`updateMiPerfil`/`subirFoto`/`subirCv`/
  `agregarCertificacion`/`eliminarCertificacion`/`getPerfilCoach` (solo lectura) +
  `obtenerUrlFoto` (blob→object URL para `<img>` inline, no lanza — devuelve `null` en 404).
- `views/coach/PerfilView.vue` (nuevo, ruta `/coach/perfil`): formulario editable completo —
  foto con upload inmediato al seleccionar archivo, datos de texto con botón Guardar, CV con
  reemplazo inmediato, certificaciones con alta (nombre + entidad + fecha + archivo opcional) y
  baja.
- `components/PerfilCoachContenido.vue` (nuevo, **compartido** entre empresa y coachee): bloque
  de solo lectura — foto/nombre/bio, metodología, certificaciones+CV, contacto (LinkedIn/email/
  teléfono), con estados vacíos legibles para el perfil recién creado.
- `views/empresa/PerfilCoachView.vue` reescrito (de contenido hardcodeado a `getPerfilCoach()` +
  `<PerfilCoachContenido>`); `views/coachee/MiCoachView.vue` nuevo (mismo patrón, ruta
  `/coachee/mi-coach`, primera vez que el coachee tiene esta pantalla).
- `AppShell.vue`: "Mi perfil" en Administración (coach), "Mi Coach" en Mi proceso (coachee); y el
  avatar del header (botón + panel de cuenta) ahora muestra la foto real del coach vía
  `obtenerUrlFoto()` cuando `auth.user.role === 'coach'`, con fallback a las iniciales de
  siempre — coachee y empresa no se tocan, siguen solo con iniciales.

### Verificación

- Backend: 10 tests nuevos en `perfil-coach.service.spec.ts` (crear-si-no-existe, resolver el
  único coach, merge parcial, reemplazo de foto sin fallar si el archivo viejo no existe en
  disco, alta/baja de certificación con validación de pertenencia) + 453/453 del total,
  `npm run lint`/`build` limpios, `migration:run`/`revert`/`run` simétrico.
- Frontend: `npm run lint`, `npm run build` (vue-tsc + vite) + cross-check `tsc -p
  tsconfig.app.json`, `npx vitest run` → 384/384 (+13 tests nuevos: `PerfilView.spec.ts`,
  `PerfilCoachContenido.spec.ts`, `MiCoachView.spec.ts`, `PerfilCoachView.spec.ts` de empresa).
- Real en Chrome (headless vía CDP) + curl directo al backend: como `coach@test.com`, PATCH de
  datos + subida real de foto/CV/certificación (con archivo) — todo persiste y se sirve
  correctamente (`GET /perfil-coach/foto`·`/cv`·`/certificaciones/:id/archivo` → 200); en
  `/coach/perfil` el formulario carga los datos reales y el avatar del header cambia a la foto
  subida; en `/empresa/coach` y `/coachee/mi-coach` (como `qa-empresa-verify@test.com` y
  `qa-paleta-verify@test.com`) se ve el mismo perfil real —ya no el texto hardcodeado— con
  certificación y CV descargables, y el avatar de esos dos roles se mantiene en iniciales.

## 2026-09-03 — Perfil del coach: sitio web + redes sociales (seguimiento a lo anterior)

Consulta del usuario: "¿el coach puede ingresar sus links de redes sociales?" — hoy solo había
LinkedIn. Se agregaron `sitioWeb`, `instagramUrl`, `facebookUrl`, `youtubeUrl` (elegidas por el
usuario entre las opciones propuestas — no todas las redes, solo las más relevantes para un
coach) al mismo `PerfilCoach` de la entrada anterior: columnas nuevas (migración
`1788468925351-RedesSocialesPerfilCoach.ts`, `ALTER TABLE ADD COLUMN` × 4), campos en
`UpdatePerfilCoachDto` (`@IsUrl()`, igual que `linkedinUrl` — el service no necesitó tocarse,
`assignDefined` ya es genérico), inputs nuevos en el formulario de `PerfilView.vue` y links
condicionales (solo se muestra el que esté seteado) en `PerfilCoachContenido.vue`. Backend
453/453, frontend 386/386 (+2 tests nuevos), migración `revert`/`run` simétrica, verificado en
vivo (curl + Chrome real) que los 5 links se guardan y aparecen correctamente en `/empresa/coach`
y `/coachee/mi-coach`.

## 2026-09-05 — Fix: "Invalid credentials" y otros mensajes de error en inglés

El usuario reportó ver "Invalid credentials" al fallar el login y pidió barrer todo el aplicativo
por frases en inglés. Se auditó el frontend completo (templates Vue, `lib/`, `api/`, `stores/`) —
ya estaba 100% en español, sin hallazgos — y se encontró que el problema estaba concentrado en
mensajes de excepción **hardcodeados en el backend**, que viajan tal cual al frontend porque
`client.ts` muestra `err.message` directo. La validación de DTOs (`class-validator`) ya tenía un
`spanishValidationExceptionFactory` que traduce todo automáticamente (incluye humanización de
campos no listados) — no era la fuente del problema.

- ~90 mensajes `NotFoundException`/`ConflictException`/`BadRequestException` en inglés
  ("Coachee not found", "A user with that email already exists", etc.) traducidos a español en
  23 archivos de servicio, vía script de reemplazo literal (los tests verifican el tipo de
  excepción, no el texto, así que no se rompió ningún test).
- `auth.service.ts`: "Invalid credentials" → "Credenciales inválidas.", "Invalid refresh token" →
  "Token de actualización inválido.", "Refresh token revoked or expired" → traducido.
- 3 `Exception()` sin argumento que usaban el default en inglés de Nest ("Unauthorized"/
  "Forbidden"): `jwt.strategy.ts`, `ciclos.service.ts`, `coachees.service.ts` — ahora con mensaje
  explícito en español.
- Nuevo `common/spanish-throttler.guard.ts`: el `ThrottlerGuard` de `@nestjs/throttler` lanza
  "ThrottlerException: Too Many Requests" de fábrica, sin vía de traducción por config — se
  sobreescribió `throwThrottlingException()` para un mensaje en español, reemplaza a
  `ThrottlerGuard` como `APP_GUARD` en `app.module.ts`.

### Verificación

`npm run build`/`lint`/`test` (453/453) en backend, `npx vitest run` (386/386, sin cambios —
frontend no se tocó) en frontend. Verificado en vivo contra el backend reiniciado: login con
password incorrecta → `"Credenciales inválidas."`; coachee inexistente → `"Coachee no
encontrado."`; refresh token inválido → `"Token de actualización inválido."`; 25 requests
seguidos → `"Demasiadas solicitudes. Intenta de nuevo en un momento."` (antes: en inglés).

## 2026-09-05 — Coachees de empresa: tabs Activos/Cerrados, grilla real, modales, impacto en el negocio

El usuario pidió mejorar `/empresa/coachees` (una sola tarjeta sparse mezclando activos y
cerrados) — se le pidió "analiza, no hagas nada" primero. Del análisis salieron 3 decisiones
confirmadas por el usuario: tabla real (no tarjetas), reemplazar la página aparte por modales, y
agregar un campo estructurado nuevo de "impacto en el negocio" (no existía — el informe de
cierre es un solo bloque de texto libre, sin ese dato separable).

### Backend

- `CicloCoaching.impactoNegocio` (text, nullable) — campo aparte del `informeFinal`, para que
  la empresa lo vea como su propio dato en la grilla, no enterrado en el informe.
- Migración `1788623448884-ImpactoNegocioCiclo.ts`, `PATCH /ciclos/:id/impacto-negocio`
  (Role.COACH), `updateImpactoNegocio()` en el service — mismo patrón que `updateInformeFinal`.

### Frontend — coach (flujo de cierre)

- `CicloTab.vue`: nuevo textarea "Impacto en el negocio" + botón propio "Guardar impacto en el
  negocio", junto al informe pero editable por separado.

### Frontend — empresa (`CoacheesView.vue`, reescrito completo)

- `TabBar` con **Activos**/**Procesos cerrados** (insignia con conteo), separados por el mismo
  `estado` que ya calculaba `resumirCoachee()` — sin lógica nueva de negocio.
- Grilla real (`<table>`) con columnas distintas por tab: Activos → competencia, avance+barra,
  sesiones, próxima sesión; Cerrados → competencia, resultado, fecha de cierre, **impacto en
  el negocio** (columna nueva, truncada con tooltip).
- Botonera por fila que abre modales en vez de navegar a otra página: **Ver progreso**
  (avance + ciclo en curso), **Historial** (reutiliza `HistorialCiclos.vue` tal cual),
  **Certificado** (lista + vista previa inline reutilizando `CertificadoContenido.vue`, sin
  apilar un modal sobre otro).
- Se retiró `/empresa/coachees/:id/ciclo` (`CicloView.vue`, ruta `empresa-ciclo`) — todo lo que
  mostraba ahora vive en los modales de la lista. El link desde "Necesita tu atención" en el
  Resumen (`DashboardView.vue`) y desde `CertificadoView.vue` ahora apunta a
  `/empresa/coachees` con `?coacheeId=` — la lista detecta el query param al montar y abre
  directo el modal de progreso de ese coachee (mismo salto que antes, sin la página aparte).

### Verificación

Backend 457/457 (+2 tests de `updateImpactoNegocio`), migración `revert`/`run` simétrica.
Frontend `npm run build`/`lint`, `npx vitest run` → 398/398 (reescritos los specs de
`CoacheesView`, `CicloTab`, `DashboardView`; eliminado `CicloView.spec.ts` junto con la vista).
Verificado en vivo con datos reales: seteé `impactoNegocio` vía curl en un ciclo real cerrado de
Ferronor/QA Empresa Verify, confirmé en Chrome que aparece en la columna de la grilla, que
"Certificado" lista ambos ciclos cerrados reales con vista previa funcionando (nombre real,
objetivo real, resultado "Logrado"), que "Historial" muestra ambos ciclos, y que el campo
"Impacto en el negocio" del coach se guarda por separado del informe.

## 2026-09-05 — Rediseño UI/UX de Coachees empresa: menos plano, fecha inicio, impacto destacado

Feedback directo del usuario sobre la entrega anterior: se veía "muy plano, muy apagado", el
campo de impacto quedaba cortado, faltaba la fecha de inicio junto a la de cierre, y el
historial mostraba el informe completo como un bloque de texto sin formato.

- **Filas → tarjetas**: se reemplazó la tabla `<table>` densa por tarjetas por coachee (mismo
  contenido, más aire, avatar más grande, hover con sombra) en ambos tabs.
- **Fecha inicio + cierre**: ahora se muestran ambas (antes solo cierre), con formato legible
  ("17 ago 2026" en vez de "17-08-2026").
- **Resultado con color real**: nuevo `resultadoColor` en `lib/resultadoCiclo.ts` (sage/bronze/
  danger según logrado/medianamente/no logrado) — antes el badge era siempre del mismo tono
  neutro sin importar el resultado.
- **"Impacto en el negocio" ya no se corta**: nuevo componente `ImpactoNegocioCallout.vue`
  (reutilizado en la grilla y en el historial) — bloque destacado de ancho completo con su
  propio ícono nuevo (`impacto`, un rayo — matching semántico y visual, no reciclado de otro
  ícono) y su propio color de acento (`--color-spark`, el mismo tono "premium" que ya usa el
  certificado), texto completo sin truncar, y estado vacío explícito ("Sin registrar todavía")
  cuando el coach aún no lo completa.
- **Historial rediseñado**: badge de resultado coloreado, ícono `chevron` (nuevo) para expandir/
  colapsar en vez de una flecha reciclada, el impacto ahora aparece ahí también, el informe
  final ya no es un bloque de texto libre suelto — vive en una caja con `max-h-64
  overflow-y-auto` (ya no se come el modal entero), fechas con el mismo formato legible, y el
  botón de descargar PDF pasó de link subrayado a píldora con ícono.
- **Modal "Ver progreso" con más estructura**: encabezado con avatar, secciones "Avance
  general"/"Ciclo en curso" con ícono + etiqueta (mismo lenguaje visual que el resto de la app),
  resumen de reunión inicial en una caja legible en vez de texto plano.

### Verificación

`npm run build`/`lint`, `npx vitest run` → 400/400 (+2 tests nuevos de
`ImpactoNegocioCallout.spec.ts`). Verificado en Chrome real con datos reales de Ferronor/QA
Empresa Verify: el callout de impacto se ve completo con su ícono y color propios, el resultado
"Logrado" aparece en verde, fecha inicio y cierre ambas visibles, el historial expandido muestra
el impacto + el informe acotado con scroll, y el modal de progreso con datos reales (incluyendo
un ciclo activo nuevo abierto para la prueba) se ve estructurado y legible.

## 2026-09-05 — "Últimos impactos en el negocio" en el Resumen de empresa

El usuario pidió "un gráfico top 5 de los últimos impactos en el negocio". Antes de construirlo
se le explicó por qué un gráfico de barras no aplica: el impacto es texto libre que escribe el
coach al cerrar un ciclo, no un número — no hay "top 5 por magnitud" sin inventar un puntaje
que no existe. Lo real y útil es "los más recientes": una vitrina de resultados concretos.

- `lib/ultimosImpactos.ts` (puro, testeado): junta los ciclos cerrados con `impactoNegocio` de
  todos los coachees de la empresa, ordena por `fechaCierre` descendente, retorna los primeros
  5 (parámetro `limite` configurable).
- `DashboardView.vue` (empresa): nueva `SectionCard` "Últimos impactos en el negocio" (ícono
  `impacto`, el rayo ya usado en la grilla de Coachees) entre "Finanzas" y "Distribución por
  departamento" — sigue el arco costo→valor del dashboard. Cada ítem: coachee + competencia +
  fecha + el impacto completo, mismo lenguaje visual (círculo spark) que `ImpactoNegocioCallout`.
  Se extendió `filas`/`resumenDe()` para retener el `ciclos[]` crudo de cada coachee (antes solo
  se guardaba el resumen derivado).

### Verificación

`npm run build`/`lint`, `npx vitest run` → 405/405 (+3 tests: `ultimosImpactos.spec.ts` y 2
nuevos en `DashboardView.spec.ts`). Verificado en Chrome real con el impacto registrado
anteriormente en QA Empresa Verify — aparece completo, con ícono y fecha, en el Resumen.

## 2026-09-05 — Cerrando la brecha de satisfacción entre coach y empresa

El usuario preguntó cómo funciona hoy la satisfacción desde la vista empresa: quién la llena,
si es el subgerente o los coachees, y cómo se entera el coach del feedback de un ciclo hecho
para una empresa. Se investigó el código (no se asumió nada) y se encontraron dos mecanismos
totalmente separados, con una brecha real en cada dirección:

- **`EncuestaSatisfaccion`**: la llena quien tenga la cuenta de la empresa (el subgerente/
  contacto RRHH) — una calificación 1-5 general del servicio, sin ligar a un coachee o ciclo
  puntual. Alimenta el KPI "Satisfacción promedio" del Resumen de empresa. El backend ya tenía
  `GET /satisfaccion/encuestas/:empresaId` (Role.COACH) y el frontend un wrapper
  (`getEncuestasDeEmpresa`) — **pero no existía ninguna pantalla donde el coach la viera**.
- **`RetroalimentacionCierre`**: la llena el coachee al cerrar su ciclo (18 afirmaciones en 3
  bloques + 4 preguntas abiertas) — el coach ya la ve en el detalle del coachee (`CicloTab.vue`).
  El backend ya permitía `Role.EMPRESA` en `GET /retroalimentacion/coachee/:coacheeId` — **pero
  ninguna vista de empresa la usaba**.

Ambos casos eran endpoints ya construidos y nunca conectados a una pantalla — cero cambios de
backend, solo wiring:

- **Coach → `EmpresasView.vue`**: nuevo botón "Ver satisfacción" (ícono ojo) por empresa, abre
  un modal con los KPIs (satisfacción promedio, tasa de asistencia, procesos terminados/en
  curso) y el listado de encuestas respondidas (estrellas + comentario).
- **Empresa → `CoacheesView.vue`**: nuevo botón "Feedback" (solo si el coachee tiene
  retroalimentación registrada) en la pestaña "Procesos cerrados", junto a Historial y
  Certificado — abre un modal con el feedback completo de cierre por ciclo (promedio general,
  promedio por bloque, y las 4 respuestas abiertas), reutilizando `lib/retroalimentacionResumen.ts`
  (ya compartido con `CicloTab.vue`, cero lógica nueva).

### Verificación

`npm run build`/`lint`, `npx vitest run` → 408/408 (+3 tests nuevos: modal de satisfacción del
coach, modal de feedback de la empresa, y el caso sin retroalimentación). Verificado en vivo:
envié una encuesta real como QA Empresa Verify (5★ + comentario) y confirmé que aparece en el
modal del coach; abrí el modal de feedback en la empresa y se ven las dos retroalimentaciones
reales de QA Paleta Verify con sus promedios y respuestas abiertas — dato que antes era
invisible para la empresa pese a existir en la base desde hace semanas.

## 2026-09-05 — Módulo de Configuración (grupo/clave/valor/estado)

Al investigar de dónde salían las 18 afirmaciones de la retroalimentación de cierre, se
encontró que vivían hardcodeadas en `frontend/src/lib/retroalimentacionPreguntas.ts` — ni el
backend las validaba, ni existía ninguna tabla de configuración. El usuario pidió justo eso:
"un módulo de configuración con todos los datos parametrizables, con grupo, clave, valor y
estado".

- **Backend — módulo nuevo `configuracion/`**: entidad `ParametroConfiguracion` (grupo, clave,
  valor, estado) con índice único `(grupo, clave)`. A diferencia del sync siempre-sobrescribe
  de `CompetenciasService` (`ON CONFLICT DO UPDATE`), acá el seed inicial usa `ON CONFLICT DO
  NOTHING` (`.orIgnore()`) — la base manda una vez creado el dato, y un cambio futuro del seed
  en código nunca pisa una edición del coach. Esquema de 2 niveles para el catálogo de
  retroalimentación: el grupo índice `RETROALIMENTACION_BLOQUES` enumera los 3 bloques, y cada
  nombre de bloque es a su vez un grupo con sus afirmaciones en orden — convención reusable
  para cualquier catálogo futuro de 2 niveles. Endpoints: CRUD completo (Role.COACH) +
  `GET /configuracion/retroalimentacion/preguntas` (COACH y COACHEE) que arma el catálogo desde
  la parametrización. Migración `ParametrosConfiguracion`, 9 tests nuevos de servicio.
- **Frontend**: `api/configuracion.ts` (wrapper CRUD + `getPreguntasRetroalimentacion`).
  `ProgresoView.vue` (coachee) migrado de la constante estática a la API — mismo comportamiento
  exacto, ahora editable sin deploy. Nueva pantalla `views/coach/ConfiguracionView.vue`
  (`/coach/configuracion`, grupo "Administración"): tabla agrupada por grupo, filtro por grupo,
  `StatusToggle` para estado, alta/edición vía modal, baja con confirmación — mismo patrón que
  `UsuariosView.vue`. Ícono `configuracion` nuevo (engranaje) en `NavIcon.vue`. Se eliminó
  `lib/retroalimentacionPreguntas.ts`, ya sin consumidores.

### Verificación

Backend: `npm run build`/`lint`, `npm test` → 466/466. Migración `migration:run`/`revert`/`run`
simétrica. Restart real contra Postgres: confirmado el seed de 21 parámetros (3 bloques + 18
afirmaciones) en el log de arranque. Frontend: `npm run build`/`lint`, `npx vitest run` →
413/413 (+5 tests de `ConfiguracionView.spec.ts`). Verificado en Chrome real (headless vía CDP):
como coach, `/coach/configuracion` lista los 21 parámetros agrupados correctamente; creé un
parámetro nuevo, lo desactivé y lo eliminé por API, todo persistiendo contra la base real; como
QA Paleta Verify, el modal de retroalimentación en `/coachee/progreso` sigue mostrando
exactamente los mismos 3 bloques y 18 afirmaciones que antes, ahora servidos por la API.

## 2026-09-05 — Encuesta de satisfacción: ligada a un ciclo, con categorías

El usuario, tras entender cómo funcionaba la encuesta de satisfacción (un rating 1-5 suelto,
sin relación con ningún proceso, que la empresa podía enviar cuantas veces quisiera), pidió las
4 mejoras a la vez: ligarla a un coachee/ciclo, categorías en vez de una sola nota, limitar la
frecuencia, y explicar mejor para qué sirve. Las primeras tres se resuelven con una sola
decisión: la encuesta ahora se responde **por cada ciclo cerrado** (como ya hace la
retroalimentación del coachee) — un registro único por ciclo da el contexto y limita la
frecuencia a la vez, sin inventar una ventana de tiempo arbitraria.

- **Categorías vía `configuracion/`**: 3 nuevas filas `grupo: 'SATISFACCION_CATEGORIAS'` en el
  seed (comunicación, cumplimiento, resultados) — mismo mecanismo ya construido para las
  afirmaciones de retroalimentación, editable sin deploy. Nueva ruta `GET
  /configuracion/satisfaccion/categorias` (COACH, EMPRESA).
- **`EncuestaSatisfaccion`**: gana `cicloId` (FK a `ciclos_coaching`, único — Postgres no
  considera duplicadas las filas viejas con `null`) y `respuestas` (jsonb, `{categoria,
  valor}[]`, igual shape que `RetroalimentacionCierre`). `calificacion` pasa a ser derivada
  (promedio de `respuestas`) en vez de un input directo, así el KPI `AVG(calificacion)` no
  cambia. `SatisfaccionService.crearEncuesta` valida que el ciclo pertenezca a la empresa (vía
  su coachee) y pre-chequea la unicidad antes del insert — mismo patrón que
  `RetroalimentacionService.addOwn`.
- **`views/empresa/SatisfaccionView.vue`**: la sección "Encuesta de satisfacción" pasa de un
  formulario suelto a una lista de "Pendientes de evaluar" (ciclos cerrados de cualquier
  coachee de la empresa sin encuesta aún, cruzando `listCoachees()` + `getCiclosDeCoachee()`
  con `getMisEncuestas()`) + "Respondidas" con el detalle por categoría. Un párrafo explica la
  diferencia con la retroalimentación del coachee. "Solicitar un nuevo proceso" no cambió.
- **`views/coach/EmpresasView.vue`**: el modal "Ver satisfacción" ahora muestra a qué
  coachee/ciclo corresponde cada encuesta y su detalle por categoría; las encuestas viejas sin
  ciclo se siguen mostrando como "Encuesta general (sin ciclo asociado)".

### Verificación

Backend: `satisfaccion.service.spec.ts` (+3 tests: ciclo inexistente, ciclo de otra empresa,
duplicado) y `configuracion.service.spec.ts` (+1 test) → 470/470. `build`/`lint` limpios.
Migración `migration:run`/`revert`/`run` simétrica. Restart real: nuevas rutas mapeadas, 24
parámetros verificados en el log (21 + 3 categorías). Frontend: reescritura de
`SatisfaccionView.spec.ts` (+3 tests) y fixture actualizado en `EmpresasView.spec.ts` → 415/415,
`build`/`lint` limpios. Verificado en Chrome real (headless vía CDP): como QA Empresa Verify,
completé una encuesta real sobre un ciclo cerrado de QA Paleta Verify — el ciclo desapareció de
"Pendientes" y apareció en "Respondidas" con las 3 categorías y el comentario; como coach, el
modal "Ver satisfacción" en Empresas mostró la misma encuesta con el coachee correcto y su
detalle, junto a la encuesta vieja sin ciclo mostrada correctamente como "general".

## 2026-09-05 — Retorno de la inversión en Finanzas (empresa)

Se le pidió al usuario una evaluación honesta del portal de empresa como si fuera el
subgerente que gestiona el programa: ¿tiene lo necesario para tomar decisiones? Confirmó 5
brechas reales, y priorizó cerrar primero la más pedida al justificar presupuesto: puede ver
cuánto gasta (Finanzas) y qué logró (resultado/impacto, en Coachees), pero son dos lugares
separados que hay que cruzar mentalmente.

Sin inventar ningún puntaje (`impactoNegocio` sigue siendo texto libre, decisión ya tomada
para "Últimos impactos" — no hay ROI-en-dólares posible sin fabricar un valor): lo que sí es
real y agregable es el costo (sesiones realizadas × tarifa) y el `resultado` categórico de
cada ciclo cerrado.

- `NegocioService.retornoParaEmpresa(empresaId)` (nuevo): por cada ciclo cerrado de la
  empresa, calcula su costo real sumando las sesiones YA REALIZADAS que tienen ese
  `cicloId` (campo que ya existía en `Sesion`, poblado al crear la sesión con un ciclo
  abierto, nunca antes usado para agregar costos) × `tarifaEfectiva` (mismo cálculo que
  `calcularResumenCobros`). Sin filtro de período — se lista el historial completo de
  procesos cerrados, igual criterio que `HistorialCiclos`. Nueva ruta `GET
  /negocio/empresa/retorno` (Role.EMPRESA).
- `FinanzasView.vue`: nueva sección "Retorno de la inversión" al final — 3 KPIs (invertido en
  procesos cerrados, costo promedio por proceso, % con objetivo logrado) + una tarjeta por
  proceso cerrado (coachee, fecha, costo, badge de resultado reusando
  `resultadoColor`/`resultadoLabel`, e `ImpactoNegocioCallout` cuando existe) — mismo
  tratamiento visual que ya usa la pestaña "Procesos cerrados" de Coachees, cero componentes
  nuevos.

### Verificación

Backend: 3 tests nuevos en `negocio.service.spec.ts` (costo solo cuenta sesiones realizadas,
distribución de resultados, `costoPromedioPorProceso: null` sin procesos) → 473/473.
`build`/`lint` limpios. Frontend: 2 tests nuevos en `FinanzasView.spec.ts` (empty state y KPIs
con detalle) → 417/417, `build`/`lint` limpios. Verificado en Chrome real (headless vía CDP):
como QA Empresa Verify, `/empresa/finanzas` muestra los 3 procesos cerrados de QA Paleta
Verify con su resultado y el impacto real ya registrado; el costo salió $0 en los tres
—verificado contra la base que es correcto: esas sesiones de prueba nunca quedaron ligadas a
un `cicloId`, así que el cálculo está siendo honesto con datos de fixture incompletos, no hay
bug.

## 2026-09-05 — Alerta de riesgo: coachee activo sin próxima sesión agendada

Tercera de las 5 brechas del portal de empresa: "Necesita tu atención" solo avisaba de ciclos
por vencer, no de un proceso que simplemente se estancó — sigue "en curso" pero no tiene
ninguna sesión agendada, y nadie lo nota hasta que ya perdió mucho tiempo. Cien por ciento
frontend: la señal (`cicloActual.sesionesRestantes` + `proximaSesion`) ya la cargaban tanto
`DashboardView.vue` como `CoacheesView.vue` de empresa, ambas vía `resumirCoachee()` — cero
endpoints ni llamadas nuevas al backend.

- `lib/resumenCoacheeEmpresa.ts`: `ResumenCoacheeEmpresa` gana `sinProximaSesion` — `true`
  cuando el ciclo actual tiene sesiones pendientes y no hay ninguna próxima sesión agendada.
- `DashboardView.vue` ("Necesita tu atención") y `CoacheesView.vue` (badge en la tarjeta del
  coachee activo): nuevo badge "Sin sesión agendada" (danger, distinto del bronze de "Ciclo
  por vencer" — es la señal más urgente), puede coexistir con el de "por vencer" si aplican
  ambos.

### Verificación

`lib/resumenCoacheeEmpresa.spec.ts` (+4), `DashboardView.spec.ts` (+2), `CoacheesView.spec.ts`
(+2) → 425/425. `build`/`lint` limpios (sin cambios de backend). Verificado en Chrome real:
abrí un ciclo temporal para QA Paleta Verify sin agendar sesión, confirmé el badge en Resumen y
en Coachees, y lo cerré de nuevo al terminar para no dejar el dato de prueba en un estado raro.

## 2026-09-05 — Tendencia en el tiempo + Informe ejecutivo exportable

Las 2 últimas brechas del portal de empresa, cerradas juntas porque el informe reutiliza la
tendencia como una de sus secciones. Ninguna fabrica datos: se agregan por mes 3 señales que ya
existen — `EncuestaSatisfaccion.calificacion`, `CicloCoaching.resultado`, `Sesion.asistio` —
mismo criterio "cero puntajes inventados" de toda la sesión. El informe no genera un PDF con
una librería nueva: reutiliza `window.print()` + `print:hidden`, patrón que `FinanzasView.vue`
ya usaba y que `AppShell.vue` ya resuelve globalmente (oculta sidebar/header al imprimir).

- **`SatisfaccionService.tendenciaParaEmpresa(empresaId, meses=6)`** (nuevo): ventana rodante
  de 6 meses (más antiguo primero, `rangosMensuales`/`etiquetaMes` propios de este servicio,
  espejo de `NegocioService.cobrosPorMeses` pero hacia atrás). Por mes: promedio de
  satisfacción de las encuestas creadas ese mes, % de ciclos **cerrados ese mes** con
  `resultado=logrado`, y tasa de asistencia de las sesiones de ese mes — cada uno `null`
  (no cero) cuando no hay dato ese mes. Ruta `GET /satisfaccion/tendencia/me` (Role.EMPRESA).
- **`components/TendenciaChart.vue`** (nuevo): 3 filas de mini-barras (Satisfacción /5,
  % Procesos logrados, Asistencia %), normalizadas a su propia escala, con una sola fila de
  etiquetas de mes compartida — mismo cálculo de altura que `ProyeccionGastoChart.vue`.
  Nueva `SectionCard` "Tendencia" en `DashboardView.vue` (empresa), entre Finanzas e Últimos
  impactos.
- **`views/empresa/InformeEjecutivoView.vue`** (nuevo, `/empresa/informe`, nav "Informe"):
  compone en una sola página imprimible — KPIs generales, Tendencia, Retorno de la inversión
  completo (mismas tarjetas que Finanzas), Resumen financiero del período, e Impactos en el
  negocio sin el límite de 5 del widget del Resumen. Cero endpoints nuevos más allá de
  Tendencia — 100% reutilización de `api/*.ts` y componentes ya existentes.

### Verificación

Backend: 3 tests nuevos en `satisfaccion.service.spec.ts` → 476/476. `build`/`lint` limpios.
Frontend: specs nuevos de `TendenciaChart.vue` (3) e `InformeEjecutivoView.vue` (3), +1 en
`DashboardView.spec.ts` → 432/432, `build`/`lint` limpios. Verificado en Chrome real: la
sección Tendencia del Resumen muestra barras reales de los últimos 6 meses (con meses vacíos
en gris, no en cero); `/empresa/informe` arma las 5 secciones con datos reales; emulando el
medio "print" vía CDP se confirmó que el sidebar y el header desaparecen y el contenido queda
listo para imprimir/exportar a PDF desde el navegador.

## 2026-09-05 — Pulido: sin impacto duplicado en el informe, Tendencia rediseñada

El usuario notó dos cosas apenas vio el resultado: el impacto en el negocio salía dos veces en
el informe ejecutivo (en "Retorno de la inversión" y otra vez en una sección aparte de
"Impactos"), y pidió que Tendencia se viera más elegante — las barras planas no comunicaban
bien.

- **`InformeEjecutivoView.vue`**: se eliminó la sección "Impactos en el negocio" completa — el
  dato ya vive en cada tarjeta de "Retorno de la inversión" junto a su costo y resultado, con
  más contexto que una lista aparte. De paso se cae todo el fetch que solo existía para esa
  sección (`listCoachees` + `getPlanByCoachee` + `getCiclosDeCoachee` + `ultimosImpactos`),
  dejando la vista más simple.
- **`TendenciaChart.vue` (rediseño completo)**: de 3 filas de barras planas a 3 tarjetas
  (grid), cada una con el valor actual grande, una variación vs. el dato real anterior (▲/▼,
  sage/danger) y un sparkline SVG suave en vez de barras — la línea solo conecta meses
  *consecutivos* con dato real (un hueco corta la línea, nunca interpola un valor inventado),
  con un punto marcado en cada mes real. Etiquetas de mes reducidas a solo el primero y el
  último (rango), no una por mes — menos ruido visual.

### Verificación

`TendenciaChart.spec.ts` reescrito (5 tests: valor+variación, rango de meses, tramos de línea
que saltan meses sin dato) e `InformeEjecutivoView.spec.ts` simplificado (sin los mocks que ya
no aplican, +1 test que confirma el impacto aparece una sola vez) → 435/435. `build`/`lint`
limpios (sin cambios de backend). Verificado en Chrome real: el informe ahora muestra el texto
del impacto exactamente 1 vez (antes 2) y ya no existe la sección "Impactos en el negocio";
Tendencia se ve como 3 tarjetas limpias con sparkline, tanto en el Resumen como en el Informe.

## 2026-09-05 — Adopción de Apache ECharts en toda la app

Ni siquiera el sparkline rediseñado de Tendencia se entendía — el problema real era la
metodología (bucket mensual con volumen bajísimo de datos), no el dibujo a mano. El usuario
pidió ir más allá: adoptar una librería de gráficos de verdad para **toda** la app, pensando en
el futuro SaaS multi-coach/multi-empresa. Se evaluó primero **ApexCharts** y se descartó al
verificar su LICENSE real (no de memoria): dejó de ser MIT, ahora es dual-license — gratis solo
bajo $2M USD de facturación anual, y pide licencia OEM paga si se embebe en una plataforma que
otros usuarios configuran (exactamente el escenario SaaS descrito). Se optó por **Apache
ECharts** (`echarts`, Apache-2.0) + **vue-echarts** (MIT) — gratis para siempre, sin techo de
facturación, sin cláusula OEM, y con renderer SVG (nítido al imprimir el Informe Ejecutivo, a
diferencia de Chart.js que solo renderiza en canvas).

- **Infraestructura nueva**: `lib/echartsCore.ts` (registro modular vía `echarts/core` — solo
  `BarChart`/`LineChart`/`PieChart`/`GridComponent`/`LegendComponent`/`TooltipComponent`/
  `SVGRenderer`, no `echarts` completo) y `lib/echartsTheme.ts` (`resolveColor()` para
  convertir `var(--color-sage)` a un color real, y `baseOption()` compartida).
- **5 componentes migrados**: `DonutChart`, `GraficoProgreso`, `ProyeccionGastoChart`,
  `ProyeccionIngresosChart`, `TendenciaChart` (reconstruido: barras por métrica, solo meses
  con dato, valor rotulado — resuelve a la vez "usar librería" y "que se entienda"). Mismo
  prop API externo en cada uno — ninguna vista consumidora cambió. `ProgresoLineaTiempo.vue`
  (anillos por sesión, N por lista) quedó **fuera a propósito**: no es un gráfico de
  serie/comparación, y montar una instancia de ECharts por fila de una lista larga pesa más
  de lo que aporta.
- **Bug real encontrado y corregido**: vue-echarts inyecta `x-vue-echarts{height:100%}` como
  CSS **sin cascade layer** — en Tailwind v4 (que sí pone sus utilidades en una layer), CSS
  sin layer siempre gana sobre CSS con layer sin importar la especificidad. Poner una clase
  Tailwind de alto (`h-28`, etc.) directo en `<VChart>` perdía contra esa regla y producía un
  loop de resize sin control (se vio crecer un chart a 22.000px de alto en vivo). Fix: el alto
  real siempre va en un `<div>` contenedor común (no afectado por el selector de vue-echarts),
  `<VChart>` adentro solo recibe `h-full w-full` — mismo patrón que `DonutChart` ya usaba por
  casualidad y por eso nunca mostró el bug.
- **Estrategia de testing nueva**: `happy-dom` no da layout real, así que ECharts no puede
  pintar de verdad en los tests — los specs de gráficos ahora verifican el `option` que cada
  componente arma y le pasa a `<VChart>` (`wrapper.findComponent(VChart).props('option')`), no
  el SVG renderizado. Documentado en el propio spec de `TendenciaChart` para que se repita.
- `lib/graficoProgreso.ts` (+ su spec) se eliminó — quedó sin usar una vez que ECharts calcula
  su propio layout de ejes (antes hacía la matemática de coordenadas a mano solo para el SVG
  manual de `GraficoProgreso.vue`).

### Verificación

`npm audit`: `echarts`/`vue-echarts` no agregan ninguna vulnerabilidad nueva (las 4 existentes
son de devDependencies/xlsx ya presentes, no relacionadas). `npm run build`/`lint` limpios,
`npx vitest run` → 426/426 (specs de los 5 componentes migrados reescritos con la nueva
estrategia, más los de sus vistas consumidoras actualizados donde el comportamiento cambió a
propósito). Bundle: nuevo chunk compartido de ~575 kB (196 kB gzip) para echarts, cargado una
sola vez y reusado por los 5 gráficos (confirmado que no se duplica por componente). Verificado
en Chrome real: Tendencia y Proyección de ingresos/gasto muestran barras reales, rotuladas,
correctamente dimensionadas tras el fix del bug de alto; clic en una barra de Proyección sigue
abriendo el detalle por coachee/empresa; Donut y Distribución por departamento sin cambios
visuales; confirmado que el renderer es 100% SVG (cero `<canvas>`) y se ve nítido emulando el
medio "print".

## 2026-09-05 — Ícono de mostrar/ocultar contraseña en Login

El usuario preguntó por qué el login no tiene el ícono de ojo para ver la contraseña. La
respuesta: nunca se construyó ahí — `LoginView.vue` usaba un `<input type="password">` crudo,
mientras que el resto de los formularios de contraseña de la app (cambio de contraseña, tanto
en `CambiarPasswordView.vue` como en el modal de `AppShell.vue`) ya usan
`components/PasswordField.vue`, que sí tiene el toggle desde antes. No hacía falta construir
nada nuevo, solo reusar lo que ya existía.

- `PasswordField.vue`: nueva prop opcional `inputClass` — cuando se pasa, reemplaza por
  completo la clase del input (el login tiene un estilo propio, fondo marfil + anillo de foco,
  distinto del resto de la app); sin la prop, mantiene exactamente el estilo plano de siempre.
  El caller que use `inputClass` es responsable de incluir `pr-10` (espacio para el botón de
  ojo).
- `LoginView.vue`: el campo de contraseña ahora usa `<PasswordField>` en vez del `<input>`
  crudo, con su estilo original preservado vía `inputClass`.

### Verificación

Specs nuevos: `PasswordField.spec.ts` (4 tests: toggle, `update:modelValue`, `inputClass` vs.
estilo por defecto, borde `invalid`) y `LoginView.spec.ts` (4 tests: toggle visible en el
login, revela el valor real, login exitoso redirige, error se muestra) → 434/434. `build`/
`lint` limpios (sin cambios de backend). Verificado en Chrome real: contraseña enmascarada por
defecto con el mismo estilo ivory de antes, clic en el ojo revela el texto plano y el ícono
cambia a ojo tachado.

## 2026-09-05 — Dona de distribución de resultados en Retorno de la inversión

El usuario preguntó si solo íbamos a usar gráficos de barra para todo — la respuesta honesta
fue que no (Donut para composición, línea para progreso continuo, barra para montos por
período), pero se identificó una oportunidad real: "Retorno de la inversión" mostraba el
desglose de resultados como un solo número ("% con objetivo logrado"), escondiendo cuántos
procesos quedaron parciales o sin lograr — el mismo tipo de dato (parte-del-todo) que
`DonutChart` ya resuelve bien en "Distribución por departamento".

- `lib/distribucionResultados.ts` (nuevo, puro): arma los segmentos logrado/medianamente_logrado/
  no_logrado con su conteo y %, excluyendo los que están en cero (una dona con un segmento en
  0% no aporta) — mismo criterio de "no rellenar con datos vacíos" del resto de la sesión.
- `FinanzasView.vue` e `InformeEjecutivoView.vue`: el KPI de texto "Procesos con objetivo
  logrado" se reemplazó por un `DonutChart` (reutilizado tal cual, sin cambios) con los 3
  segmentos coloreados con `resultadoColor` — mismo componente que ya usa Distribución por
  departamento/Competencias trabajadas, cero componentes nuevos de UI.

### Verificación

`distribucionResultados.spec.ts` (3 tests) + assertions nuevas sobre las props del `DonutChart`
en `FinanzasView.spec.ts` e `InformeEjecutivoView.spec.ts` → 437/437. `build`/`lint` limpios
(sin cambios de backend). Verificado en Chrome real: con los 4 procesos cerrados reales de QA
Empresa Verify (todos "Logrado"), la dona muestra "4 procesos" en el centro y el segmento único
correcto en la leyenda.
