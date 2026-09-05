<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import AppModal from '../../../components/AppModal.vue'
import SectionCard from '../../../components/SectionCard.vue'
import EmptyState from '../../../components/EmptyState.vue'
import StatusToggle from '../../../components/StatusToggle.vue'
import NavIcon from '../../../components/NavIcon.vue'
import SkeletonBlock from '../../../components/SkeletonBlock.vue'
import FechaLimiteEditor from '../../../components/FechaLimiteEditor.vue'
import { formatearFechaLimite } from '../../../lib/fechaLimite'
import {
  addPregunta,
  createQuiz,
  deletePregunta,
  deleteQuiz,
  getQuizParaCoach,
  listIntentosDeQuiz,
  listQuizzes,
  setQuizActivo,
  updateQuiz,
  type Intento,
  type Pregunta,
  type Quiz,
} from '../../../api/quiz'
import { listCompetencias, type Competencia } from '../../../api/competencias'
import { ApiError } from '../../../api/client'
import { confirmDialog, notifyError, notifySuccess } from '../../../lib/notify'
import { rankingDeIntentos } from '../../../lib/quizRanking'

const loading = ref(true)
const quizzes = ref<Quiz[]>([])
const competencias = ref<Competencia[]>([])

const seleccionadoId = ref<string | null>(null)
const preguntas = ref<Pregunta[]>([])
const intentos = ref<Intento[]>([])
const cargandoDetalle = ref(false)

const ranking = computed(() => rankingDeIntentos(intentos.value))

const quizSeleccionado = computed(() => quizzes.value.find((q) => q.id === seleccionadoId.value) ?? null)

async function loadAll() {
  loading.value = true
  const [q, c] = await Promise.all([listQuizzes(), listCompetencias()])
  quizzes.value = q
  competencias.value = c
  loading.value = false
}

onMounted(loadAll)

async function abrirDetalle(id: string) {
  seleccionadoId.value = id
  cargandoDetalle.value = true
  const [detalle, intentosDelQuiz] = await Promise.all([
    getQuizParaCoach(id),
    listIntentosDeQuiz(id),
  ])
  preguntas.value = detalle.preguntas
  intentos.value = intentosDelQuiz
  cargandoDetalle.value = false
}

function volverALista() {
  seleccionadoId.value = null
}

// --- Crear quiz ---

const modalAbierto = ref(false)
const nuevoTitulo = ref('')
const nuevaCompetenciaId = ref('')
const nuevaFechaLimite = ref('')
const creando = ref(false)

function abrirModal() {
  nuevoTitulo.value = ''
  nuevaCompetenciaId.value = ''
  nuevaFechaLimite.value = ''
  modalAbierto.value = true
}

async function crear() {
  if (!nuevoTitulo.value.trim() || !nuevaCompetenciaId.value) return
  creando.value = true
  try {
    const quiz = await createQuiz({
      titulo: nuevoTitulo.value.trim(),
      competenciaId: nuevaCompetenciaId.value,
      fechaLimite: nuevaFechaLimite.value || undefined,
    })
    quizzes.value = [quiz, ...quizzes.value]
    modalAbierto.value = false
    await abrirDetalle(quiz.id)
  } catch (err) {
    await notifyError('No se pudo crear el quiz', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  } finally {
    creando.value = false
  }
}

const guardandoFechaLimite = ref(false)

async function guardarFechaLimite(fechaLimite: string | null) {
  if (!quizSeleccionado.value) return
  guardandoFechaLimite.value = true
  try {
    const actualizado = await updateQuiz(quizSeleccionado.value.id, { fechaLimite })
    quizzes.value = quizzes.value.map((q) => (q.id === actualizado.id ? actualizado : q))
  } catch (err) {
    await notifyError(
      'No se pudo actualizar la fecha límite',
      err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.',
    )
  } finally {
    guardandoFechaLimite.value = false
  }
}

// --- Activo/inactivo y eliminar ---

async function toggleActivo(quiz: Quiz) {
  const actualizado = await setQuizActivo(quiz.id, !quiz.activo)
  quizzes.value = quizzes.value.map((q) => (q.id === actualizado.id ? actualizado : q))
}

async function eliminar(quiz: Quiz) {
  const confirmado = await confirmDialog({
    title: `¿Eliminar "${quiz.titulo}"?`,
    text: 'Esta acción no se puede deshacer.',
    confirmText: 'Eliminar',
    danger: true,
  })
  if (!confirmado) return
  try {
    await deleteQuiz(quiz.id)
    quizzes.value = quizzes.value.filter((q) => q.id !== quiz.id)
    if (seleccionadoId.value === quiz.id) seleccionadoId.value = null
    await notifySuccess('Quiz eliminado')
  } catch (err) {
    await notifyError(
      'No se pudo eliminar',
      err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.',
    )
  }
}

// --- Preguntas ---

const nuevaPregunta = reactive({
  enunciado: '',
  opciones: ['', ''],
  respuestaCorrecta: 0,
})

function agregarOpcion() {
  if (nuevaPregunta.opciones.length >= 6) return
  nuevaPregunta.opciones.push('')
}

function quitarOpcion(i: number) {
  if (nuevaPregunta.opciones.length <= 2) return
  nuevaPregunta.opciones.splice(i, 1)
  if (nuevaPregunta.respuestaCorrecta >= nuevaPregunta.opciones.length) {
    nuevaPregunta.respuestaCorrecta = 0
  }
}

const guardandoPregunta = ref(false)

async function guardarPregunta() {
  const opciones = nuevaPregunta.opciones.map((o) => o.trim()).filter((o) => o.length > 0)
  if (!nuevaPregunta.enunciado.trim() || opciones.length < 2 || !seleccionadoId.value) return
  guardandoPregunta.value = true
  try {
    const pregunta = await addPregunta(seleccionadoId.value, {
      enunciado: nuevaPregunta.enunciado.trim(),
      opciones,
      respuestaCorrecta: nuevaPregunta.respuestaCorrecta,
    })
    preguntas.value = [...preguntas.value, pregunta]
    nuevaPregunta.enunciado = ''
    nuevaPregunta.opciones = ['', '']
    nuevaPregunta.respuestaCorrecta = 0
  } catch (err) {
    await notifyError(
      'No se pudo agregar la pregunta',
      err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.',
    )
  } finally {
    guardandoPregunta.value = false
  }
}

async function borrarPregunta(preguntaId: string) {
  await deletePregunta(preguntaId)
  preguntas.value = preguntas.value.filter((p) => p.id !== preguntaId)
}
</script>

<template>
  <SkeletonBlock v-if="loading" />

  <template v-else-if="!quizSeleccionado">
    <div class="mb-4 flex items-center justify-between">
      <h1 class="font-[family-name:var(--font-heading)] text-xl font-semibold">
        Quiz
      </h1>
      <button
        class="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm text-[var(--color-parchment)]"
        @click="abrirModal"
      >
        Nuevo quiz
      </button>
    </div>

    <EmptyState
      v-if="quizzes.length === 0"
      icon="quiz"
      title="Todavía no has creado ningún quiz"
      description="Un quiz te sirve para reforzar una competencia con preguntas que tú mismo escribes."
    />
    <div
      v-else
      class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      <button
        v-for="quiz in quizzes"
        :key="quiz.id"
        class="flex flex-col items-start gap-2 rounded-2xl border border-[var(--color-line)] bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--color-sage)] hover:shadow-md"
        @click="abrirDetalle(quiz.id)"
      >
        <span
          class="rounded-full px-2 py-0.5 text-xs font-semibold"
          :class="quiz.activo ? 'bg-[var(--color-sage)]/15 text-[var(--color-sage)]' : 'bg-[var(--color-ink)]/5 text-[var(--color-ink)]/50'"
        >
          {{ quiz.activo ? 'Activo' : 'Inactivo' }}
        </span>
        <p class="text-sm font-medium">
          {{ quiz.titulo }}
        </p>
        <p
          v-if="quiz.competencia"
          class="text-xs text-[var(--color-ink)]/50"
        >
          {{ quiz.competencia.nombre }}
        </p>
        <p
          v-if="formatearFechaLimite(quiz.fechaLimite)"
          class="text-xs text-[var(--color-bronze)]"
        >
          {{ formatearFechaLimite(quiz.fechaLimite) }}
        </p>
      </button>
    </div>
  </template>

  <template v-else>
    <button
      class="mb-4 text-sm text-[var(--color-ink)]/60 hover:text-[var(--color-ink)] hover:underline"
      @click="volverALista"
    >
      ← Volver a Quiz
    </button>

    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="font-[family-name:var(--font-heading)] text-xl font-semibold">
          {{ quizSeleccionado.titulo }}
        </h1>
        <p
          v-if="quizSeleccionado.competencia"
          class="text-sm text-[var(--color-ink)]/60"
        >
          {{ quizSeleccionado.competencia.nombre }}
        </p>
      </div>
      <div class="flex items-center gap-3">
        <StatusToggle
          :active="quizSeleccionado.activo"
          @toggle="toggleActivo(quizSeleccionado)"
        />
        <button
          class="rounded-lg border border-[var(--color-danger)]/40 px-3 py-2 text-xs text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
          @click="eliminar(quizSeleccionado)"
        >
          Eliminar
        </button>
      </div>
    </div>

    <FechaLimiteEditor
      class="mb-4"
      :fecha-limite="quizSeleccionado.fechaLimite"
      :guardando="guardandoFechaLimite"
      @guardar="guardarFechaLimite"
    />

    <SkeletonBlock v-if="cargandoDetalle" />
    <div
      v-else
      class="space-y-4"
    >
      <SectionCard
        title="Preguntas"
        icon="lista"
      >
        <ul class="mb-4 space-y-2">
          <li
            v-for="pregunta in preguntas"
            :key="pregunta.id"
            class="rounded-xl border border-[var(--color-line)]/60 p-3 text-sm"
          >
            <div class="mb-1 flex items-start justify-between gap-2">
              <p class="font-medium">
                {{ pregunta.enunciado }}
              </p>
              <button
                class="shrink-0 text-xs text-[var(--color-bronze)] hover:underline"
                @click="borrarPregunta(pregunta.id)"
              >
                Quitar
              </button>
            </div>
            <ul class="space-y-0.5 text-xs text-[var(--color-ink)]/70">
              <li
                v-for="(opcion, i) in pregunta.opciones"
                :key="i"
                :class="i === pregunta.respuestaCorrecta ? 'font-semibold text-[var(--color-sage)]' : ''"
              >
                {{ i === pregunta.respuestaCorrecta ? '✓ ' : '· ' }}{{ opcion }}
              </li>
            </ul>
          </li>
        </ul>

        <div class="space-y-2 rounded-xl border border-[var(--color-line)]/60 bg-[var(--color-parchment)]/30 p-4">
          <input
            v-model="nuevaPregunta.enunciado"
            type="text"
            placeholder="Enunciado de la pregunta"
            class="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
          >
          <div
            v-for="(_opcion, i) in nuevaPregunta.opciones"
            :key="i"
            class="flex items-center gap-2"
          >
            <input
              type="radio"
              :checked="nuevaPregunta.respuestaCorrecta === i"
              :aria-label="`Opción ${i + 1} es la correcta`"
              @change="nuevaPregunta.respuestaCorrecta = i"
            >
            <input
              v-model="nuevaPregunta.opciones[i]"
              type="text"
              :placeholder="`Opción ${i + 1}`"
              class="flex-1 rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
            >
            <button
              v-if="nuevaPregunta.opciones.length > 2"
              class="shrink-0 text-xs text-[var(--color-bronze)] hover:underline"
              @click="quitarOpcion(i)"
            >
              Quitar
            </button>
          </div>
          <div class="flex items-center justify-between pt-1">
            <button
              v-if="nuevaPregunta.opciones.length < 6"
              class="text-xs text-[var(--color-ink)]/60 hover:underline"
              @click="agregarOpcion"
            >
              + Agregar opción
            </button>
            <button
              class="rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm hover:bg-white disabled:opacity-60"
              :disabled="guardandoPregunta"
              @click="guardarPregunta"
            >
              Agregar pregunta
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Ranking"
        icon="trofeo"
      >
        <p
          v-if="ranking.length === 0"
          class="text-sm text-[var(--color-ink)]/50"
        >
          Todavía ningún coachee ha respondido este quiz.
        </p>
        <ul
          v-else
          class="space-y-2 text-sm"
        >
          <li
            v-for="(fila, i) in ranking"
            :key="fila.coacheeId"
            class="flex items-center gap-3 rounded-xl border border-[var(--color-line)]/60 p-2.5"
            :class="i === 0 ? 'border-[var(--color-spark)]/50 bg-[var(--color-spark)]/5' : ''"
          >
            <span
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-mono)] text-xs font-semibold"
              :class="i === 0
                ? 'bg-[var(--color-spark)]/20 text-[var(--color-spark)]'
                : i === 1
                  ? 'bg-[var(--color-ink)]/10 text-[var(--color-ink)]/70'
                  : i === 2
                    ? 'bg-[var(--color-bronze)]/15 text-[var(--color-bronze)]'
                    : 'bg-[var(--color-parchment)] text-[var(--color-ink)]/40'"
            >
              {{ i + 1 }}
            </span>
            <NavIcon
              v-if="i === 0"
              name="trofeo"
              :size="16"
              class="shrink-0 text-[var(--color-spark)]"
            />
            <span class="flex-1">{{ fila.nombre }}</span>
            <span
              v-if="fila.totalIntentos > 1"
              class="text-xs text-[var(--color-ink)]/40"
            >{{ fila.totalIntentos }} intentos</span>
            <span class="font-[family-name:var(--font-mono)] font-semibold text-[var(--color-ink)]/80">
              {{ fila.mejorPuntaje }}/{{ fila.totalPreguntas }}
            </span>
          </li>
        </ul>
      </SectionCard>
    </div>
  </template>

  <AppModal
    v-if="modalAbierto"
    title="Nuevo quiz"
    @close="modalAbierto = false"
  >
    <form
      class="space-y-4"
      @submit.prevent="crear"
    >
      <label class="block text-sm">
        Título
        <input
          v-model="nuevoTitulo"
          type="text"
          class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
        >
      </label>
      <label class="block text-sm">
        Competencia
        <select
          v-model="nuevaCompetenciaId"
          class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
        >
          <option
            value=""
            disabled
          >
            Elige una competencia
          </option>
          <option
            v-for="c in competencias"
            :key="c.id"
            :value="c.id"
          >
            {{ c.nombre }}
          </option>
        </select>
      </label>
      <label class="block text-sm">
        Fecha límite (opcional)
        <input
          v-model="nuevaFechaLimite"
          type="date"
          class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
        >
      </label>
      <div class="flex justify-end gap-2 pt-2">
        <button
          type="button"
          class="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm"
          @click="modalAbierto = false"
        >
          Cancelar
        </button>
        <button
          type="submit"
          :disabled="creando"
          class="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm text-[var(--color-parchment)] disabled:opacity-60"
        >
          {{ creando ? 'Creando…' : 'Crear' }}
        </button>
      </div>
    </form>
  </AppModal>
</template>
