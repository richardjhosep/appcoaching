# Learning Companion — Fase 0 · Cambios de base de datos propuestos

> Documento 3 de 4 de la Fase 0. Propuesta de schema, no migraciones escritas todavía (eso es
> implementación funcional, fuera de alcance de Fase 0). Sigue la convención real del repo:
> `backend/src/database/migrations/<epoch-ms>-<PascalCase>.ts`, SQL crudo en `up()`/`down()`, una
> migración por feature (nunca una migración monolítica).

## 0. Requisito de infraestructura previo (no es una tabla, es una extensión)

Ninguna migración existente crea la extensión `pgvector`. Antes de la primera migración de
Learning Companion se necesita una migración de infraestructura pura:

```sql
-- up()
CREATE EXTENSION IF NOT EXISTS vector;
-- down()
DROP EXTENSION IF EXISTS vector;
```

Riesgo real (no cosmético): requiere que la imagen de Postgres usada en `docker-compose.yml`
tenga `pgvector` disponible (la imagen genérica `postgres:*` no lo trae por defecto) — hay que
cambiar a una imagen tipo `pgvector/pgvector:pg<version>` o instalar la extensión en el
Dockerfile de Postgres. Esto afecta también al pipeline de CI (el job que levanta el stack para
la suite `e2e/`) y a cualquier entorno de producción existente. Se detalla como riesgo #1 en
`IMPLEMENTATION_ROADMAP.md`.

## 1. Ninguna tabla nueva lleva `coach_id` ni `organization_id`

Ver justificación completa en `ARCHITECTURE_ANALYSIS.md` §1 — un solo coach, sin ese concepto en
ninguna tabla existente. El scoping real de cada tabla nueva es `coachee_id` (cascada al borrar
el coachee, igual que `entradas_diario`) o, donde aplique, `empresa_id`.

## 2. Tablas propuestas

### `fuente_conocimiento` — extiende `recursos`, no lo reemplaza

```sql
CREATE TABLE fuente_conocimiento (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recurso_id        uuid NOT NULL UNIQUE REFERENCES recursos(id) ON DELETE CASCADE,
  status            varchar NOT NULL DEFAULT 'pendiente', -- pendiente|procesando|lista|error
  error_mensaje     text,
  idioma            varchar,
  dificultad        varchar,
  created_at        timestamp NOT NULL DEFAULT now(),
  updated_at        timestamp NOT NULL DEFAULT now()
);

CREATE TABLE fuente_competencia (          -- N a N, fuente ↔ Competencia existente
  fuente_id         uuid NOT NULL REFERENCES fuente_conocimiento(id) ON DELETE CASCADE,
  competencia_id    uuid NOT NULL REFERENCES competencias(id) ON DELETE CASCADE,
  PRIMARY KEY (fuente_id, competencia_id)
);
```

Relación 1-a-1 con `recursos` (no duplicar título/carpeta/archivo — ya viven ahí) en vez de la
tabla `fuentes` autocontenida que el plan propone en su sección 7.

### `fragmento_conocimiento` — chunks + embeddings

```sql
CREATE TABLE fragmento_conocimiento (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fuente_id         uuid NOT NULL REFERENCES fuente_conocimiento(id) ON DELETE CASCADE,
  orden             int NOT NULL,           -- posición dentro del documento
  contenido         text NOT NULL,
  embedding         vector(768),            -- dimensión según el modelo de embeddings elegido
  created_at        timestamp NOT NULL DEFAULT now()
);

CREATE INDEX fragmento_conocimiento_embedding_idx
  ON fragmento_conocimiento USING hnsw (embedding vector_cosine_ops);
```

### `conversacion_tutor` / `mensaje_tutor`

```sql
CREATE TABLE conversacion_tutor (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coachee_id        uuid NOT NULL REFERENCES coachees(id) ON DELETE CASCADE,
  titulo            varchar,
  created_at        timestamp NOT NULL DEFAULT now()
);

CREATE TABLE mensaje_tutor (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversacion_id   uuid NOT NULL REFERENCES conversacion_tutor(id) ON DELETE CASCADE,
  rol               varchar NOT NULL,       -- 'user' | 'assistant'
  contenido         text NOT NULL,
  fragmentos_citados uuid[],                -- ids de fragmento_conocimiento usados como contexto
  created_at        timestamp NOT NULL DEFAULT now()
);
```

### `quiz` / `pregunta_quiz` / `intento_quiz`

```sql
CREATE TABLE quiz (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo            varchar NOT NULL,
  competencia_id    uuid REFERENCES competencias(id),
  fuente_id         uuid REFERENCES fuente_conocimiento(id),
  created_at        timestamp NOT NULL DEFAULT now()
);

CREATE TABLE pregunta_quiz (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id           uuid NOT NULL REFERENCES quiz(id) ON DELETE CASCADE,
  enunciado         text NOT NULL,
  opciones          jsonb NOT NULL,         -- string[]
  respuesta_correcta int NOT NULL,          -- índice en `opciones`
  fragmento_origen_id uuid REFERENCES fragmento_conocimiento(id)
);

CREATE TABLE intento_quiz (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id           uuid NOT NULL REFERENCES quiz(id) ON DELETE CASCADE,
  coachee_id        uuid NOT NULL REFERENCES coachees(id) ON DELETE CASCADE,
  respuestas        jsonb NOT NULL,         -- int[] índice elegido por pregunta
  puntaje           int NOT NULL,
  feedback          text,
  created_at        timestamp NOT NULL DEFAULT now()
);
```

### `flashcard` / `repaso_flashcard`

```sql
CREATE TABLE flashcard (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anverso           text NOT NULL,
  reverso           text NOT NULL,
  competencia_id    uuid REFERENCES competencias(id),
  fragmento_origen_id uuid REFERENCES fragmento_conocimiento(id)
);

CREATE TABLE repaso_flashcard (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flashcard_id      uuid NOT NULL REFERENCES flashcard(id) ON DELETE CASCADE,
  coachee_id        uuid NOT NULL REFERENCES coachees(id) ON DELETE CASCADE,
  resultado         varchar NOT NULL,       -- 'facil'|'dificil'|'olvidado' (Leitner/SM-2 simple)
  proxima_revision  date NOT NULL,
  created_at        timestamp NOT NULL DEFAULT now()
);
```

### `escenario_simulacion` / `intento_simulacion`

```sql
CREATE TABLE escenario_simulacion (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo            varchar NOT NULL,
  contexto          text NOT NULL,
  rol_ia            varchar NOT NULL,
  competencia_id    uuid REFERENCES competencias(id),
  rubrica           jsonb NOT NULL          -- mismo formato que Competencia.niveles
);

CREATE TABLE intento_simulacion (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escenario_id      uuid NOT NULL REFERENCES escenario_simulacion(id) ON DELETE CASCADE,
  coachee_id        uuid NOT NULL REFERENCES coachees(id) ON DELETE CASCADE,
  transcripcion     jsonb NOT NULL,         -- turnos {rol, contenido}[]
  evaluacion        jsonb,                  -- resultado por nivel de rúbrica
  feedback          text,
  created_at        timestamp NOT NULL DEFAULT now()
);
```

## 3. Reutilización explícita (no duplicar)

| Concepto del plan | Tabla del plan | Reutiliza en su lugar |
|---|---|---|
| Catálogo de competencias | `competencies` (nueva) | `competencias` (ya existe, 16 sembradas) |
| Fuente de conocimiento | `knowledge_sources` (nueva) | `recursos` + `fuente_conocimiento` (extensión 1-a-1) |
| Carpetas/organización | — (no especificado) | `carpetas` (ya existe) |
| Asignación de contenido a coachee | — (no especificado) | `asignaciones_recurso` (ya existe) |

## 4. Migraciones propuestas (orden, siguiendo la convención de "una por feature")

1. `<epoch>-HabilitarExtensionVector.ts`
2. `<epoch>-FuenteConocimiento.ts` (+ `fuente_competencia`)
3. `<epoch>-FragmentoConocimiento.ts` (+ índice HNSW)
4. `<epoch>-ConversacionYMensajeTutor.ts`
5. `<epoch>-QuizYPreguntaEIntento.ts`
6. `<epoch>-FlashcardYRepaso.ts`
7. `<epoch>-EscenarioEIntentoSimulacion.ts`

Cada una mapea 1-a-1 a una fase del plan (Fase 1-2 → migraciones 1-3; Fase 3 → 4; Fase 4 → 5;
Fase 5 → 6; Fase 6 → 7), consistente con el patrón ya usado en el repo de no adelantar schema de
una feature que todavía no se implementa.
