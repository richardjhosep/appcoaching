# Learning Companion — Fase 0 · Análisis de arquitectura actual

> Documento 1 de 4 de la Fase 0 (análisis, sin código funcional). Verificado directamente contra
> el repositorio en `main` (commit `30e5fc1`) el 2026-08-16, no contra lo que asume el plan
> original — cada afirmación de este documento fue comprobada con grep/lectura de código, no
> inferida.

## 1. Corrección de la asunción más importante del plan: no hay multi-tenancy de coach

El plan (`COACHOS_LEARNING_COMPANION_PLAN.md`, secciones 7 y 9) asume un modelo **multi-coach /
multi-organización**, con cada fuente de conocimiento etiquetada `coachId` + `organizationId`, y
un aislamiento de datos "nunca buscar entre documentos de coaches u organizaciones distintas".

**Eso no existe en CoachNexus.** Verificación exhaustiva:

```
grep -rn "coachId" backend/src --include="*.entity.ts"   →  0 resultados
```

- El rol `Role` es exactamente `COACH | COACHEE | EMPRESA` (`backend/src/auth/enums/role.enum.ts`)
  — no hay `ADMIN` ni ningún concepto de "organización dueña de la cuenta del coach".
  `AuthenticatedUser` es `{id, email, role, empresaId}`.
- **`COACH` es un rol global sin scoping**: todo controlador `@Roles(Role.COACH)` opera sobre
  la base completa (todas las `Empresa`, todos los `Coachee`, todos los `Recurso`, etc.). No hay
  ninguna columna `coachId` en ninguna entidad porque la aplicación es de **un solo coach**
  (Fernando Ramos) gestionando su propia práctica — no un SaaS multi-coach.
- `empresaId` sí es un scoping real, pero significa algo distinto: es la empresa **cliente** del
  coach (la organización que contrató servicios de coaching para sus empleados), no un tenant que
  posea la cuenta del coach. `EMPRESA` se scopea a sí misma; `COACHEE` se scopea a sí mismo.

**Impacto en el diseño de Learning Companion**: cualquier tabla de conocimiento (`fuentes`,
`fragmentos`, conversaciones del tutor, intentos de quiz, etc.) **no necesita `coachId` ni
`organizationId`** — hay un solo coach y aislar "entre coaches" no es un problema real del
dominio actual. El aislamiento que sí importa, y que hay que preservar con el mismo rigor que el
resto de la app, es:

- **Coachee → coachee**: un coachee jamás debe ver contenido/conversaciones/resultados de otro
  coachee (igual que hoy con `EntradaDiario`, `AprendizajeRecurso`, etc., todos scopeados por
  `coacheeId` resuelto desde `req.user`, nunca desde un parámetro de URL confiable a ciegas).
  Ver `backend/src/seguimiento/seguimiento.controller.ts` como referencia del patrón ya vigente.
- **Empresa → empresa**: si en el futuro una fuente de conocimiento se asocia a una `Empresa`
  (ej. "material propio de la política de liderazgo de Empresa X"), debe respetar el mismo
  `empresaId`-scoping que ya usa `NegocioService`/`LegalService` para el rol `EMPRESA`.
- Si el negocio evoluciona a **múltiples coaches** en el futuro, ese es un cambio estructural
  mucho más grande que Learning Companion por sí solo (afecta toda la app, no solo este módulo) y
  queda fuera de alcance de este análisis — no debe resolverse "de paso" agregando `coachId` a las
  tablas nuevas sin agregarlo también a `Coachee`, `Empresa`, `Recurso`, etc.

Si se agrega `coachId`/`organizationId` a las tablas nuevas de Learning Companion "por si acaso",
sería la única parte de la base de datos con ese concepto — inconsistente con el resto del schema
y sin ningún consumidor real que lo necesite hoy. **Recomendación: no agregarlo.**

## 2. Inventario de módulos backend (NestJS)

`backend/src/` — 21 módulos de dominio, cada uno con la forma `*.module.ts` + `*.controller.ts` +
`*.service.ts` + `entities/*.entity.ts` + `dto/*.dto.ts` + specs co-localizados:

```
audit · auth · busqueda · ciclos · coachees · competencias · config · database · email ·
empresas · health · legal · negocio · notificaciones · planes-desarrollo · recursos · redis ·
satisfaccion · seed · seguimiento · sesiones · users
```

Convención confirmada en múltiples módulos: `@UseGuards(JwtAuthGuard, RolesGuard)` +
`@Roles(Role.X)` a nivel de método (no de controlador), `@CurrentUser()` decorator para resolver
el usuario autenticado, DTOs con `class-validator`, `AuditService.record(...)` para las
mutaciones sensibles (ya usado en legal, planes, usuarios).

## 3. Entidades reutilizables — ya existen, no se inventan desde cero

### `Competencia` (`backend/src/competencias/entities/competencia.entity.ts`)

```ts
Competencia {
  id: uuid
  nombre: string (unique)
  definicion: text
  niveles: jsonb  // NivelCompetencia[] = { nivel: number, descripcion: string }
}
```

Sin relaciones — 16 competencias ya sembradas al boot (`competencias.seed-data.ts`). Esto es
**exactamente** el catálogo de "competencias" que el plan (secciones de Quiz/Simulaciones/
Dashboard) trata como si hubiera que crearlo desde cero. No hay que crearlo: hay que **relacionar**
las nuevas entidades (quiz, simulación, fragmento de conocimiento) con `Competencia` vía FK, no
duplicar el concepto con una tabla `competencies` paralela como sugiere el plan en su sección 7.

### `Recurso` / `Carpeta` / `AsignacionRecurso` / `AprendizajeRecurso` (biblioteca)

```ts
Recurso { id, titulo, descripcion?, carpetaId → Carpeta, tipo: TipoRecurso, url?,
          archivoNombre?, archivoPath?, createdAt }
```

Ya resuelve: subida de archivo a disco local, filtro de mimetype (`soloPermitir(...)`), organización
en carpetas, asignación coach→coachee, y registro de "aprendizaje" (lectura/consumo) por coachee.
Esta es la base natural para el "Knowledge Base" del plan (sección 7) — **no una tabla nueva
`fuentes_conocimiento` desconectada**, sino una extensión de `Recurso` (o una tabla nueva que lo
referencia 1-a-1, ver `DATABASE_CHANGES.md`) que agrega los campos que el plan pide y `Recurso` no
tiene: `status` de procesamiento, metadata de idioma/dificultad, y el vínculo a fragmentos RAG.

### `EntradaDiario` (`backend/src/seguimiento/entities/entrada-diario.entity.ts`)

```ts
EntradaDiario { id, coacheeId → Coachee (CASCADE), contenido: text, createdAt }
```

Patrón exacto (tabla simple, `coacheeId` + texto + timestamp, cascada al borrar el coachee) que
debería copiarse para conversaciones del tutor, intentos de quiz, repasos de flashcards, etc. — es
el patrón "bitácora del coachee" ya validado en producción, con su propio `SeguimientoModule`.

## 4. Modelo de autenticación y autorización

- JWT access + refresh; refresh token vive en Redis con TTL (`RedisService.setWithTtl`/`get`/
  `delete`) — revocable, no solo firmado.
- `RolesGuard` + `@Roles()` a nivel de método; `mustChangePassword` fuerza cambio de contraseña
  temporal antes de usar la app (relevante si Learning Companion crea cuentas/accesos nuevos — no
  debería, reutiliza las cuentas `COACHEE` existentes).
- Sin rol `ADMIN`. Sin conflicto con el plan siempre que Learning Companion no invente uno.

## 5. Almacenamiento de archivos

- **Disco local únicamente** (`UPLOADS_DIR`), sin S3/GCS/CDN. `file-type-filter.util.ts` ofrece
  dos capas: `soloPermitir(mimetypes)` (multer `fileFilter`, bloquea antes de escribir a disco) y
  `validarPdfSubido(...)` (verifica los primeros 5 bytes = `%PDF-` ya en disco, borra y rechaza si
  no calzan). Ya aplicado a documentos legales, informes de ciclo y recursos de biblioteca.
- El plan pide soportar PDF/DOCX/PPTX/TXT/Markdown/enlaces — la app hoy solo tiene la
  infraestructura de **validación de subida** para PDF con chequeo de magic bytes; DOCX/PPTX no
  tienen validación de contenido, solo de mimetype (`MIMETYPES_RECURSO`). Extraer texto de
  DOCX/PPTX requiere una librería nueva (no presente hoy: sin `pdf-parse`, `mammoth`, ni
  equivalente en `package.json`).

## 6. Búsqueda / IA / vectores — nada de esto existe hoy

Grep exhaustivo, cero resultados:

```
grep -rliE "openai|anthropic|gemini|embedding|vector|langchain|pinecone|weaviate" backend/src frontend/src
```

- `BusquedaModule` existente es búsqueda de texto simple sobre coachees (no full-text search de
  Postgres, no vectorial) — no es una base para RAG, es un módulo distinto sin relación.
- Postgres no tiene la extensión `pgvector` instalada (no hay ninguna migración que la cree).
- No hay ningún cliente HTTP hacia un proveedor de IA en `package.json` (`^1.1.0` de `typeorm` es
  la única dependencia con semántica "vieja" del repo; nada de `@google/generative-ai`, `openai`,
  etc.).

## 7. Infraestructura de jobs / procesamiento asíncrono — no existe

- Redis se usa **exclusivamente** para el TTL del refresh token (`redis.service.ts` es un wrapper
  de 3 métodos: `setWithTtl`/`get`/`delete`). No hay `BullMQ`, `Bull`, ni ningún cron/queue.
- El plan requiere (implícitamente, secciones 8, Fase 2) procesamiento asíncrono de documentos
  (extracción de texto → chunking → embeddings) que puede tardar segundos/minutos por archivo —
  eso no puede vivir en el ciclo request/response de un `POST` como el resto de la app hace hoy.
  Es una pieza de infraestructura nueva real, no una simplificación cosmética (detallado en
  `IMPLEMENTATION_ROADMAP.md`).

## 8. Frontend

- Vue 3 `<script setup>` + Vite + Tailwind v4 (`@theme` en `styles.css`, sin `tailwind.config.js`)
  + Pinia (un solo store, `stores/auth.ts`).
- Patrón `api/*.ts` — un archivo por dominio backend, funciones delgadas sobre `apiRequest<T>` /
  `apiUpload<T>` (`api/client.ts`), que ya maneja bearer token + retry automático en 401. 19
  archivos hoy (`api/audit.ts` … `api/users.ts`); Learning Companion seguiría el mismo patrón:
  `api/aprendizaje.ts` (o varios, ver `LEARNING_COMPANION_DESIGN.md`).
- Vistas coach (`views/coach/`) y coachee (`views/coachee/`) separadas por rol, cada una con su
  `.spec.ts` co-localizado (Vitest + `happy-dom`). La vista coachee más cercana en espíritu a "Mi
  Aprendizaje" (Fase 7 del plan) es `ProgresoView.vue` (logros, diario, línea de tiempo) —
  candidata natural a extenderse o a vivir junto a una nueva `AprendizajeView.vue`.

## 9. Testing

- Backend: Jest unitario co-localizado + `backend/test/*.e2e-spec.ts` (Supertest) contra una BD
  de test real.
- Frontend: Vitest co-localizado (`happy-dom`).
- **Tercera suite, separada, ya existente y previamente no documentada en `tasks/`**:
  `e2e/` (Playwright, paquete npm independiente de `frontend`/`backend` a propósito — ver
  `e2e/README.md`), con specs por rol (`tests/{coach,coachee,empresa}.spec.ts`) y un job dedicado
  en CI. Cualquier flujo E2E nuevo de Learning Companion (Fase 3 en adelante: tutor, quiz,
  simulación) debería sumarse ahí, no crear una cuarta suite.

## 10. Migraciones

- `backend/src/database/migrations/*.ts`, nombre `<epoch-ms>-<PascalCase>.ts`, SQL crudo en
  `up()`/`down()` vía `queryRunner.query()`. 20 migraciones existentes hoy; las 3 más recientes:
  `AuditLabelsYArchivoLegal`, `AmpliarLegalIndependientesYAdicionales`,
  `SolicitudesConsentimiento` — todas del patrón "una migración por feature", nunca una migración
  gigante por sprint. Las tablas nuevas de Learning Companion deben seguir exactamente esta
  convención (ver `DATABASE_CHANGES.md`).

## 11. Resumen — qué de la Fase 0 del plan es correcto y qué no

| Afirmación del plan | Estado real |
|---|---|
| "CoachOS orientado a Coach/Coachee/Empresas/Procesos/Ciclos/Sesiones" | ✅ correcto |
| Modelo `coachId` + `organizationId` en cada tabla nueva | ❌ no existe ese concepto — un solo coach, corregido en §1 |
| Hay que aislar "entre coaches" | ❌ no aplica; sí aplica aislar entre coachees y entre empresas |
| Reutilizar `Competencia` como catálogo | ✅ ya existe, coincide exactamente con lo que el plan pide crear |
| Reutilizar biblioteca (`Recurso`/`Carpeta`) como base de Knowledge Base | ✅ ya existe, cubre subida/organización/asignación |
| RAG/embeddings/proveedor de IA desacoplado | ❌ nada de esto existe — es 100% nuevo (correcto que el plan lo trate como nuevo) |
| Procesamiento async de documentos | ❌ no hay infraestructura de jobs — riesgo real, no cosmético |
| `pgvector` disponible | ❌ no instalado — requiere migración de infraestructura, no solo de schema |
