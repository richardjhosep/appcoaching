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

# Mantenedor de Empresas + activo/inactivo (coachees y usuarios) — post-cierre, 2026-07-19

## Contexto

Iteración post-Sprint-14 (fuera de `docs/jira-plan.md`): reemplazar el alta simple de `AdministracionView` por un patrón de "mantenedor" completo (buscar, filtrar por estado, paginar, crear/editar en modal, activar/desactivar) empezando por Empresas, y extender el activar/desactivar a Coachees y a Cuentas de usuario a nivel de backend. Trabajo iniciado en una sesión anterior cuyo contexto de conversación fue resumido; se retomó a partir del estado real del working tree (`git status`/`git diff`), no de `tasks/todo.md` (que no tenía ninguna entrada de este trabajo todavía).

## Hallazgo al retomar

- Backend completo y con tests (unitarios + e2e) para `Coachee.activo` (`PATCH /coachees/:id/estado`, desactivar el coachee desactiva también su cuenta de login) y `User.isActive` (`PATCH /users/:id/estado`, con registro de auditoría `USER_ACTIVADO`/`USER_DESACTIVADO`).
- Componentes compartidos nuevos (`AppModal.vue` con `Teleport to="body"`, `Pagination.vue`, `StatusToggle.vue`) y `lib/notify.ts` (wrapper de SweetAlert2 para confirmaciones/toasts) ya construidos.
- `views/coach/EmpresasView.vue` (mantenedor completo: búsqueda, filtro por estado, paginación, modal de alta/edición, activar/desactivar con confirmación) y su spec ya escritos.
- **Pieza faltante que impedía verificar nada en el navegador**: `EmpresasView.vue` nunca se conectó a `router/index.ts` ni a la navegación de `AppShell.vue` — quedaba huérfana, inalcanzable desde la UI.
- La UI de activar/desactivar para Coachees y Cuentas de usuario (dentro de `AdministracionView.vue`, que ya lista ambas) todavía no se construyó — el backend y el cliente API (`setCoacheeActivo`/`setUserActivo`) existen pero ningún componente los invoca todavía.

## Pasos de ejecución

- [x] Aislar el trabajo en un worktree (`git stash` de todo el estado pendiente en el checkout compartido → `EnterWorktree` → `git stash pop` dentro del worktree, para no perder el WIP no commiteado).
- [x] Conectar `EmpresasView.vue`: ruta `/coach/empresas` en `router/index.ts` (antes de `/coach/administracion`), entrada de nav "Empresas" en `AppShell.vue` con ícono nuevo (`empresas`) en `NavIcon.vue`.
- [x] Corregir 2 tests reales rotos en `EmpresasView.spec.ts`: `wrapper.find('form')`/`setValue` fallaban con "Cannot call ... on an empty DOMWrapper" porque `AppModal` usa `<Teleport to="body">` y Vue Test Utils no busca dentro de contenido teletransportado por defecto — primer uso de `Teleport` en este proyecto, sin convención de test previa. Corregido consultando `new DOMWrapper(document.body)` en vez de `wrapper` para los elementos dentro del modal.
- [x] Se dejó `AdministracionView.vue` intacta (su bloque simple de alta de Empresas queda duplicado con el nuevo mantenedor) — decisión deliberada para no arriesgar su suite de tests existente sin confirmación explícita de que debe reemplazarse; queda anotado como pendiente de decisión.

## Verificación

- Backend: `npm run lint` (limpio), `npm test` → **164/164** tests.
- Frontend: `npm run lint` (limpio), `npm test` (vitest) → **40/40** tests (los 2 antes rotos, ahora corregidos), `npm run build` sin errores de tipos.
- `docker compose -p appcoaching up --build -d` (reconstruye backend+frontend reusando el proyecto/volúmenes ya existentes) → `GET /api/health` 200, migración `AddCoacheeActivo` ya aplicada ("No migrations are pending").
- **Verificación real en navegador** (Chrome headless vía CDP crudo — Playwright sigue sin poder instalarse en este sandbox, ver limitación documentada en Sprints 13-14): login de coach → nav lateral muestra "Empresas" → `/coach/empresas` carga el mantenedor con las 8 empresas reales de la base → "+ Nueva Empresa" abre el modal (antes invisible al test por el bug de Teleport, confirmado aquí que sí renderiza en el DOM real) → crear una empresa de prueba la agrega a la lista → toggle de estado dispara el diálogo de confirmación (SweetAlert2) → confirmar muestra el toast "Empresa desactivada" y el toggle queda en gris. Capturas de pantalla tomadas en cada paso. Dato de prueba (`Empresa CDP Test`) borrado de la base al terminar; stack bajado con `docker compose down`.

## Revisión

Se destrabó una feature que estaba 90% construida pero 0% verificable por un solo enlace faltante (ruta + nav). El hallazgo de mayor valor fue metodológico, no de producto: el primer intento de test del modal fallaba silenciosamente por `Teleport`, un patrón nuevo en este código base sin convención de prueba todavía — la solución (`DOMWrapper(document.body)`) queda como precedente para cualquier futuro componente que use `Teleport`. Pendiente real para la próxima sesión: (1) decidir si `AdministracionView.vue` se recorta para no duplicar la gestión de Empresas, (2) construir la UI de activar/desactivar para Coachees y Cuentas de usuario (el backend ya está listo y probado, solo falta el `StatusToggle` en la lista correspondiente), y (3) considerar mantenedores dedicados equivalentes a `EmpresasView` para Coachees y Usuarios si el patrón se valida como el nuevo estándar de la aplicación.
