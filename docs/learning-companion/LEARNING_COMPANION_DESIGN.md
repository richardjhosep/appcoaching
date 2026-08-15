# Learning Companion — Fase 0 · Diseño propuesto

> Documento 2 de 4 de la Fase 0. Traduce las funcionalidades pedidas por el plan a los patrones
> reales de CoachNexus (módulo NestJS por dominio, `api/*.ts` + vista Vue por rol, reutilización
> de `Competencia`/`Recurso`/`EntradaDiario`). No incluye código — solo la forma de cada pieza y
> por qué.

## 0. Principio de diseño

El plan ya lo dice bien en su sección 2 y lo mantenemos como criterio rector: **la IA amplifica al
coach, no lo reemplaza**. En términos de diseño esto se traduce en dos reglas concretas:

1. Todo contenido que la IA genera (quiz, flashcards, simulación) nace **a partir de** una fuente
   que el coach cargó o de una `Competencia` que el coach ya definió — nunca de conocimiento
   genérico del modelo sin anclaje al material del coach. Esto es lo que justifica RAG en vez de
   simplemente "preguntarle a Gemini".
2. El coach siempre puede ver lo que el coachee conversó/practicó con la IA (mismo principio de
   transparencia que ya rige `EntradaDiario` — visible para el coach vía `SeguimientoController`,
   nunca privado del coach).

## 1. Módulos backend nuevos (siguiendo el patrón de 1 carpeta por dominio)

```
backend/src/aprendizaje-ia/
  ├── knowledge-base/        (Fase 1-2 del plan)
  ├── ai-provider/           (Fase 1 — abstracción, no un módulo NestJS de dominio)
  ├── tutor/                 (Fase 3)
  ├── quiz/                  (Fase 4)
  ├── flashcards/            (Fase 5)
  └── simulaciones/          (Fase 6)
```

Se agrupan bajo `aprendizaje-ia/` (en vez de 6 módulos sueltos en `backend/src/`) porque
comparten el `AIProvider` y el `KnowledgeService` — agruparlos evita que cada uno reimplemente el
acceso a Gemini por su cuenta, sin romper la convención de "un módulo NestJS por sub-dominio"
(cada subcarpeta sigue siendo su propio `*.module.ts`).

### 1.1 `ai-provider/` — la única pieza realmente nueva en tipo de infraestructura

El plan pide (sección 8) desacoplar `AIProvider`/`RetrievalProvider`/`EmbeddingProvider` de Gemini
específicamente — correcto y directamente aplicable al estilo del repo, que ya desacopla en otros
lugares (`EmailService` no expone el transporte SMTP a sus consumidores). Interfaz mínima:

```ts
interface AIProvider {
  chat(mensajes: MensajeChat[], contexto: string): Promise<string>
  generateStructured<T>(prompt: string, schema: JsonSchema): Promise<T>
  embed(textos: string[]): Promise<number[][]>
}
```

Una sola implementación inicial (`GeminiAIProvider`), inyectada por token (mismo patrón que
`REDIS_CLIENT` en `redis.service.ts`), configurada vía `ConfigModule` (`GEMINI_API_KEY`,
validada en `validate-env.ts` con el mismo criterio de fail-fast que ya aplica a los secretos JWT).

### 1.2 `knowledge-base/` — extiende `Recurso`, no lo reemplaza

En vez de la tabla `fuentes` desconectada que propone el plan, cada `Recurso` que el coach marca
como "usable por el Tutor IA" gana una fila en `fuente_conocimiento` (1-a-1 con `Recurso`, ver
`DATABASE_CHANGES.md`) con: `status` de procesamiento (`pendiente`/`procesando`/`lista`/`error`),
idioma, dificultad, y las `competenciaId[]` con las que se relaciona. El contenido en sí se
extrae a texto (según `tipo` de `Recurso`) y se trocea en `fragmento_conocimiento` con su embedding.

`KnowledgeService`:

```
ingest(recursoId)       // encola extracción+chunking+embeddings (async, ver Fase 2)
search(query, filtros)  // similarity search sobre fragmentos, filtrado por competenciaId/carpetaId
retrieveContext(query)  // top-k fragmentos + cita de la fuente, listo para pasar al AIProvider
```

### 1.3 `tutor/` — conversación con contexto RAG

`ConversacionTutor` (1 por coachee, o varias por "tema" — a decidir en Fase 3, no en Fase 0) +
`MensajeTutor` (rol `user`/`assistant`, contenido, fragmentos citados). Mismo patrón de cascada al
borrar el coachee que `EntradaDiario`. El coach ve las conversaciones de sus coachees (transparencia,
principio §0.2) vía un endpoint `@Roles(Role.COACH)` de solo lectura — nunca puede escribir en la
conversación del coachee.

### 1.4 `quiz/` — generación anclada a fragmentos + `Competencia`

`Quiz` (título, `competenciaId?`, `recursoId?` origen) → `PreguntaQuiz` (enunciado, opciones,
respuesta correcta, `fragmentoOrigenId` — trazabilidad de dónde salió la pregunta, requisito
implícito de "la IA no inventa" del plan) → `IntentoQuiz` (coacheeId, respuestas, puntaje,
feedback generado). Generación: `AIProvider.generateStructured` con el contexto de
`KnowledgeService.retrieveContext`, nunca una llamada libre sin fragmentos.

### 1.5 `flashcards/` — más simple, sin generación estructurada compleja

`Flashcard` (anverso/reverso, `fragmentoOrigenId`, `competenciaId?`) + `RepasoFlashcard`
(coacheeId, fecha, resultado — para spaced repetition simple en Fase 5, algoritmo tipo
Leitner/SM-2 básico, no un motor de ML nuevo).

### 1.6 `simulaciones/` — la pieza de mayor riesgo, ver roadmap

`Escenario` (contexto, rol que interpreta la IA, `competenciaId`, rúbrica en `jsonb` — mismo
patrón que `Competencia.niveles`) → `IntentoSimulacion` (coacheeId, transcripción completa,
evaluación por rúbrica generada por `AIProvider.generateStructured`, feedback). El plan la marca
"funcionalidad prioritaria" (Fase 6) pese a ser la más compleja de evaluar bien — la
`IMPLEMENTATION_ROADMAP.md` la ubica deliberadamente después de Tutor+Quiz, no antes, porque
depende de que RAG y `AIProvider.generateStructured` ya estén probados en producción con casos
más simples.

## 2. Frontend

### 2.1 `api/`

```
api/aprendizaje.ts   → knowledge-base (coach: listar/marcar recurso como fuente, ver status)
api/tutor.ts         → conversación (coachee: enviar mensaje, listar historial)
api/quiz.ts          → generar/responder/ver resultado
api/flashcards.ts    → set de repaso del día, marcar resultado
api/simulaciones.ts  → iniciar escenario, enviar turno, ver evaluación final
```

Todos sobre `apiRequest<T>`/`apiUpload<T>` existente — nada nuevo en `client.ts`.

### 2.2 Vistas

- **Coach**: `views/coach/aprendizaje/` — panel de fuentes (extiende `RecursosView.vue`, no lo
  reemplaza: un recurso ya subido gana un botón "Habilitar para Tutor IA"), y un dashboard de
  avance por coachee (Fase 8 del plan) que reutiliza el patrón de tarjeta-por-persona que
  `DashboardView.vue` ya usa (ver commit `921cba7`) en vez de inventar una tabla nueva.
- **Coachee**: `views/coachee/AprendizajeView.vue` nueva (Fase 7, "Mi Aprendizaje": continuar,
  practicar, progreso, competencias, ruta) — vive junto a `ProgresoView.vue`, que ya cubre
  logros/diario/línea de tiempo; **no fusionar ambas**, son conceptualmente distintas (progreso
  del proceso de coaching vs. progreso de aprendizaje asistido por IA), pero comparten la barra de
  navegación lateral del coachee (`Plan · Sesiones · Progreso · Biblioteca` → se agrega
  `Aprendizaje`).
- Colores: el nuevo acento `--color-spark` (agregado en este mismo trabajo, ver
  `styles.css`) queda reservado exactamente para este tipo de momento — racha de flashcards,
  quiz aprobado, hito de simulación — coherente con el pedido del cliente de que la experiencia
  del coachee sea "más atractiva, no tan seria".

## 3. Qué NO se construye en esta fase (alcance explícitamente fuera)

Siguiendo el propio criterio MUST/SHOULD/COULD del plan (sección 42) y el estado real de la
infraestructura (`ARCHITECTURE_ANALYSIS.md` §6-7):

- **Audio/video generado por IA** (COULD HAVE del plan) — no hay ningún caso de uso que lo
  requiera hoy y multiplica el costo/riesgo sin evidencia de necesidad.
- **`RecommendationEngine` adaptativo** (Fase 10 del plan) — requiere volumen de datos de uso que
  no existirá hasta que Fases 3-6 lleven meses en producción; diseñarlo ahora sería especulativo.
- **XP/Badges/Streak** (COULD HAVE) — cosmético, se evalúa después del MVP funcional, y debe
  convivir con los colores de estado ya reservados (`sage`/`bronze`/`danger`/`saltup`) sin
  inventar una paleta de gamificación paralela.
