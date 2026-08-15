# Learning Companion — Fase 0 · Roadmap de implementación, riesgos y veredicto de plausibilidad

> Documento 4 de 4 de la Fase 0. Responde directamente la pregunta original: **¿es plausible
> hacer esto?** Sí, en un subconjunto acotado y en el orden correcto — no como está escalonado
> literalmente en el plan (Fase 0 → 10 corridas sin pausa), y no sin resolver primero dos piezas
> de infraestructura que hoy no existen.

## Veredicto general

**Plausible para el MUST HAVE del plan (Knowledge Base, RAG, Tutor IA, Quiz, Simulaciones,
Progreso, Dashboard básico, Seguridad/Permisos, Cost control) con un equipo que ya conoce este
codebase**, porque:

- El 70% del trabajo de dominio (catálogo de competencias, biblioteca de contenido, patrón de
  bitácora por coachee, autenticación/autorización, subida y validación de archivos, envío de
  correos, patrón `api/*.ts` + vista por rol) **ya existe y se reutiliza**, no se construye de
  cero — ver `ARCHITECTURE_ANALYSIS.md` y `LEARNING_COMPANION_DESIGN.md`.
- El otro 30% (proveedor de IA, RAG/embeddings, procesamiento asíncrono) es genuinamente nuevo,
  pero es un problema bien resuelto en el ecosistema (no hay que inventar un motor de RAG propio).

**No es plausible ejecutar las Fases 1-10 del plan de corrido sin pausas de validación**, como el
propio plan sugiere al final ("no comenzar implementando todo"). Dos motivos concretos, no
genéricos:

1. **No hay infraestructura de jobs asíncronos hoy** (`ARCHITECTURE_ANALYSIS.md` §7) — Redis se
   usa solo para TTL de refresh tokens. Ingerir un PDF (extraer texto → trocear → generar
   embeddings de cada fragmento) no puede ejecutarse síncronamente dentro de un `POST` como el
   resto de la app. Esto es una pieza de infraestructura real (cola de jobs) que hay que construir
   y probar **antes** de que la Fase 2 del plan tenga sentido, no en paralelo con ella.
2. **`pgvector` no está instalado** (`DATABASE_CHANGES.md` §0) — cambia la imagen de Postgres del
   `docker-compose.yml` real, con impacto en CI y en cualquier entorno ya desplegado. Es un cambio
   de infraestructura que debe probarse aislado, con su propio plan de rollback, no como un efecto
   colateral de la primera migración de contenido.

## Fases propuestas (renumeradas por riesgo real, no por el orden narrativo del plan)

### Fase 1 — Infraestructura habilitante (nueva, no está en el plan original)

Antes de tocar dominio: cola de jobs (recomendado: `BullMQ` sobre el Redis ya existente — no
introduce un componente nuevo de infraestructura, solo una librería sobre lo que ya corre),
extensión `pgvector`, y el `AIProvider` con **una sola** llamada de humo (`chat()` contra Gemini)
para validar credenciales/costos antes de construir nada encima.

- **Riesgo**: bajo técnicamente, pero es el único punto donde un error de configuración
  (`GEMINI_API_KEY` mal puesta, cuota, região) bloquea todo lo demás — por eso va primero y sola.
- **Dependencia**: ninguna.
- **Verificación de salida**: un job de BullMQ visible corriendo en un entorno de prueba, una
  migración de `pgvector` aplicada y revertida limpiamente (`up`/`down`), una llamada real a
  Gemini con respuesta.

### Fase 2 — Knowledge Base (Fase 1-2 del plan original, fusionadas)

`fuente_conocimiento` + `fragmento_conocimiento`, ingesta async vía la cola de la Fase 1, marcar
un `Recurso` existente como fuente utilizable. **Sin UI de tutor/quiz todavía** — el criterio de
salida es que el coach pueda subir un PDF y ver su `status` pasar a `lista` con fragmentos
generados, verificable por query directa antes de exponer nada al coachee.

- **Riesgo real, no cosmético**: extracción de texto de PDF ya tiene infraestructura de
  validación de subida (`validarPdfSubido`), pero **no** de extracción de contenido — se necesita
  una librería nueva (`pdf-parse` o equivalente) no presente hoy. DOCX/PPTX del plan quedan
  **fuera del MVP** de esta fase (COULD HAVE, no MUST) hasta que PDF/TXT/Markdown estén probados
  en producción.
- **Dependencia**: Fase 1.

### Fase 3 — Tutor IA

`ConversacionTutor`/`MensajeTutor`, `KnowledgeService.retrieveContext` + `AIProvider.chat`,
visibilidad del coach sobre las conversaciones (principio de transparencia, ver
`LEARNING_COMPANION_DESIGN.md` §0).

- **Riesgo**: costo por conversación (cada turno = 1 llamada a embeddings de la query + 1 llamada
  de chat con contexto) — necesita un límite duro por coachee/día desde el día 1, no como
  "cost control" añadido después (el plan lo pone en MUST HAVE correctamente).
- **Dependencia**: Fase 2 (necesita fragmentos reales para dar respuestas ancladas).

### Fase 4 — Quiz

Generación anclada a fragmentos (`AIProvider.generateStructured`), respuesta y feedback.

- **Riesgo**: bajo — es el caso más simple de `generateStructured` (schema fijo de
  pregunta/opciones/respuesta), buen primer caso para validar que la salida estructurada de Gemini
  es confiable antes de usarla en Simulaciones (Fase 6, mucho más compleja).
- **Dependencia**: Fase 2.

### Fase 5 — Flashcards

Generación desde fragmentos + repetición espaciada simple (Leitner/SM-2 básico, no motor de ML).

- **Riesgo**: bajo, es la fase más mecánica del roadmap.
- **Dependencia**: Fase 2.

### Fase 6 — Simulaciones

Escenario + personaje IA + conversación + rúbrica + evaluación.

- **Riesgo alto — la fase más difícil de evaluar bien**, aunque el plan la marque "prioritaria".
  Evaluar una conversación libre contra una rúbrica de forma consistente es un problema de
  ingeniería de prompts no trivial (falsos positivos/negativos en la evaluación son mucho más
  costosos de detectar que en un quiz de opción múltiple). **Recomendación explícita: no
  adelantar esta fase antes que Quiz (Fase 4)** — Quiz valida que `generateStructured` funciona
  bien con schemas simples antes de apostarle a una rúbrica de conversación abierta.
- **Dependencia**: Fase 2, y en la práctica, haber corrido Fase 4 en producción primero.

### Fase 7 — "Mi Aprendizaje" (dashboard coachee) y Fase 8 — Dashboard coach

Vistas de agregación sobre lo ya construido en Fases 3-6 — sin riesgo técnico nuevo, es
composición de datos que ya existe. Es la fase donde el nuevo acento `--color-spark` y el criterio
de "más atractivo, no tan serio" del feedback de cliente tienen más peso de diseño visual.

- **Dependencia**: al menos una de las Fases 3-6 en producción (no hay nada que mostrar antes).

### Fase 9 — Microaprendizaje y Fase 10 — Aprendizaje adaptativo

Se mantienen tal como el plan las describe: **explícitamente pospuestas**. Fase 10 en particular
requiere volumen real de datos de uso de las fases anteriores — diseñarla ahora sería
especulativo, como ya señala `LEARNING_COMPANION_DESIGN.md` §3.

## Riesgos transversales (aplican a todo el roadmap, no a una fase)

1. **Costo de API de IA sin control** — cada fase que llama al `AIProvider` necesita un límite
   (por coachee, por día, por mes) desde su primer commit, no retrofitteado. El plan lo pone
   correctamente en MUST HAVE (sección 42) — este roadmap lo hace explícito por fase en vez de
   dejarlo como una tarea transversal vaga.
2. **`pgvector` en el pipeline de CI** — el job `e2e` en `.github/workflows/ci.yml` levanta el
   stack completo con `docker compose up --build`; cambiar la imagen base de Postgres debe
   probarse ahí antes de fusionar la Fase 1, o el CI completo (no solo Learning Companion) se
   rompe.
3. **Aislamiento coachee↔coachee en cada tabla nueva** — el riesgo de seguridad real de este
   módulo no es "un coach viendo datos de otro coach" (no existe ese escenario, ver
   `ARCHITECTURE_ANALYSIS.md` §1), es que un endpoint mal filtrado deje a un coachee leer la
   conversación/intento de otro coachee vía un id adivinado. Mismo patrón de control que ya usa
   `SeguimientoController` (resolver `coacheeId` desde `req.user`, nunca aceptarlo como parámetro
   de un coachee que llama al endpoint) debe aplicarse sin excepción en `tutor/`, `quiz/`,
   `flashcards/`, `simulaciones/`.
4. **Sin límite de tamaño/duración de conversación** — un tutor conversacional sin tope de turnos
   por sesión es un vector de costo y de abuso; debe decidirse un límite concreto en la Fase 3,
   no dejarse abierto.

## Qué falta para pasar de Fase 0 a Fase 1

Este documento y los otros tres de la Fase 0 completan lo pedido por el plan
(`ARCHITECTURE_ANALYSIS.md`, `LEARNING_COMPANION_DESIGN.md`, `DATABASE_CHANGES.md`,
`IMPLEMENTATION_ROADMAP.md`). Antes de escribir código funcional, según la propia regla del plan
("esperar aprobación de la Fase 0"), falta:

- Aprobación explícita de la corrección de alcance de `coachId`/`organizationId` (§1 de
  `ARCHITECTURE_ANALYSIS.md`) — es la única discrepancia estructural entre el plan y el repo real.
- Decisión de proveedor de IA y presupuesto (Gemini, según sugiere el plan, u otro) — determina
  el `AIProvider` concreto de la Fase 1 de este roadmap.
- Confirmación de que Simulaciones (Fase 6) puede esperar detrás de Quiz (Fase 4) pese a estar
  marcada "prioritaria" en el plan original — recomendación técnica de este documento, no una
  decisión ya tomada.
