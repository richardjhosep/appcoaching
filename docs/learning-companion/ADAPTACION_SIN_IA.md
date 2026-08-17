# Learning Companion — Qué se puede construir ya, sin IA

> Complementa los 4 documentos de Fase 0 (`ARCHITECTURE_ANALYSIS.md`,
> `LEARNING_COMPANION_DESIGN.md`, `DATABASE_CHANGES.md`, `IMPLEMENTATION_ROADMAP.md`). Esos
> asumían el plan completo, con `AIProvider`/RAG como pieza central. Esta pasada responde una
> pregunta distinta: **de las 11 fases del plan, ¿cuáles dependen realmente de un modelo de IA, y
> cuáles son solo "banco de contenido + interacción + puntaje" — construible hoy, con contenido
> que el coach carga a mano en vez de generarlo un modelo?**

## Criterio de clasificación

Cada fase del plan combina hasta 3 cosas distintas, y solo una de ellas necesita IA:

1. **Generación de contenido** (IA escribe preguntas/tarjetas/escenarios a partir de un documento) → sí necesita `AIProvider`.
2. **Autoría de contenido** (el coach lo escribe él mismo en un formulario) → no necesita IA, es un CRUD normal.
3. **Interacción + evaluación mecánica** (mostrar, responder, comparar contra una respuesta correcta, guardar puntaje) → no necesita IA, es lógica de negocio simple.

Si una fase es 100% (2)+(3), es viable ahora con el patrón ya usado en toda la app (entidad +
DTO + controlador `@Roles` + vista coach para crear, vista coachee para consumir). Si depende de
(1) para tener valor, queda pendiente de la Fase de infraestructura de IA del roadmap original.

## Tabla de clasificación, fase por fase

| Fase del plan | ¿Necesita IA? | Viable ahora (sin IA) |
|---|---|---|
| Fase 1 — Knowledge Base | Parcial | El almacenamiento/organización **ya existe** (`Recurso`/`Carpeta`) — no hay nada nuevo que construir. Lo que sí necesita IA es la búsqueda semántica sobre el contenido, no el almacenamiento en sí. |
| Fase 2 — Contenidos (carga/clasificación/asignación) | No | Ya existe (`Recurso`/`AsignacionRecurso`). "Procesamiento RAG" y "consulta semántica" sí necesitan IA — pero nada de esto bloquea Quiz/Flashcards, que no dependen de RAG si el contenido lo escribe el coach. |
| **Fase 4 — Quiz** | **Solo la generación** | **Sí, casi entero.** Generación automática de preguntas desde un PDF necesita IA. Todo lo demás — el coach escribe la pregunta+opciones+respuesta correcta a mano, el coachee responde, se compara y se guarda el puntaje — es CRUD puro. Es la fase que mencionaste, y es la de mejor relación esfuerzo/valor de las 11. |
| **Fase 5 — Flashcards** | **Solo la generación** | **Sí, casi entero.** Mismo patrón que Quiz: el coach escribe anverso/reverso a mano, el coachee repasa y marca fácil/difícil, se calcula la próxima revisión (Leitner/SM-2 simple, es aritmética, no IA). |
| Fase 7 — "Mi Aprendizaje" (dashboard coachee) | No | **Sí, entero.** Es solo agregación de datos que ya existen (o que existirían tras Quiz/Flashcards) — ningún componente de esta fase depende de un modelo de IA. |
| Fase 8 — Dashboard Coach (avance del equipo) | No | **Sí, entero.** Mismo caso que la Fase 7, del lado coach. |
| Fase 9 — Microaprendizaje (3/5/10 min) | No, si se reinterpreta | El plan lo imagina como IA empaquetando contenido en experiencias cortas. Reinterpretado como "el coach etiqueta un recurso/quiz/flashcard-set con una duración estimada", es solo metadata — viable sin IA, aunque más simple que la visión original. |
| Fase 10 — Aprendizaje adaptativo | Parcial | El plan pide un `RecommendationEngine` tipo ML. Una versión honesta sin IA: reglas simples ("recomendar el recurso etiquetado con la competencia donde el coachee tuvo el puntaje de quiz más bajo"). Útil, pero es heurística declarada, no algo que deba presentarse como "IA". |
| Fase 3 — Tutor IA | **Sí, es el núcleo** | No adaptable — una conversación abierta grounded en documentos *es* RAG + LLM por definición. Sin IA no queda un "tutor", queda en el mejor de los casos un buscador de palabras clave sobre `Recurso.titulo`/`descripcion` (ya casi lo tiene `BusquedaModule`, aunque no busca dentro del contenido). |
| Fase 6 — Simulaciones | **Sí, en su forma prevista** | El plan la define por "personaje IA + conversación" — eso requiere IA. Una versión degradada (escenario de ramas fijas escritas a mano, tipo "elige tu propia aventura", evaluado por el propio coach contra la rúbrica de `Competencia.niveles`) es técnicamente viable, pero pierde la interactividad que el plan marca como "funcionalidad prioritaria" — no la recomiendo como sustituto, solo la anoto como opción si en algún momento se quiere algo intermedio. |

## Recomendación concreta

**Empezar por Quiz.** Es la fase más citada por ti, la de menor riesgo técnico de las 11 (cero
infraestructura nueva: ni `pgvector`, ni cola de jobs, ni proveedor de IA — todo lo que ya bloqueaba
al roadmap con IA), y reutiliza exactamente el patrón que ya existe en 21 módulos del backend.

Después de Quiz, **Flashcards** es la siguiente natural (mismo patrón, mismo esfuerzo, se beneficia
de cualquier decisión de diseño ya tomada para Quiz — ej. cómo se vincula a `Competencia`). Los
dashboards (Fases 7-8) tienen más sentido una vez que Quiz/Flashcards generan datos reales que
agregar; construirlos antes sería un dashboard vacío.

**Diseño de Quiz sin IA** (a diferencia de `DATABASE_CHANGES.md`, que asumía generación
automática): mismas tablas (`quiz`, `pregunta_quiz`, `intento_quiz`), pero **sin** `fragmento_origen_id`
(no hay fragmentos RAG de los que provenir) y **sin** `fuente_id` en `quiz` — en su lugar,
`quiz.competenciaId` (obligatorio, reutilizando el catálogo de 16 `Competencia` ya sembradas) y
opcionalmente `quiz.recursoId` si el coach quiere asociarlo a un recurso existente de la
biblioteca como material de apoyo. El coach crea el quiz completo (título + preguntas + opciones +
respuesta correcta) en un formulario, igual que hoy crea un plan de desarrollo o una sesión.

## Qué NO estoy proponiendo

No renombrar esto como "Learning Companion" en el producto ni presentarlo como si tuviera IA
detrás — sería engañoso para el coach y el coachee. Es, con nombre honesto, un módulo de
**evaluaciones/quizzes** del coach hacia sus coachees. Si más adelante se agrega generación por IA
sobre el mismo schema (agregando `fragmentoOrigenId` cuando exista RAG), la migración es aditiva,
no requiere rehacer nada de esta fase.
