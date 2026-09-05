<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import EmptyState from '../../../components/EmptyState.vue'
import NavIcon from '../../../components/NavIcon.vue'
import SkeletonBlock from '../../../components/SkeletonBlock.vue'
import {
  enviarIntento,
  getQuizParaResponder,
  listQuizzesDisponibles,
  misIntentos,
  type Intento,
  type QuizParaResponder,
  type QuizResumen,
  type ResultadoIntento,
} from '../../../api/quiz'
import { ApiError } from '../../../api/client'
import { notifyError } from '../../../lib/notify'
import { formatearFechaLimite } from '../../../lib/fechaLimite'

const loading = ref(true)
const disponibles = ref<QuizResumen[]>([])

const quizAbierto = ref<QuizParaResponder | null>(null)
const respuestas = reactive<Record<string, number | null>>({})
const enviando = ref(false)
const resultado = ref<ResultadoIntento | null>(null)

// Solo el propio historial — nunca el de otros coachees (eso lo ve únicamente el coach,
// como ranking, en su vista de QuizView).
const miHistorial = ref<Intento[]>([])

async function cargarMiHistorial(quizId: string) {
  const todos = await misIntentos()
  miHistorial.value = todos
    .filter((i) => i.quizId === quizId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

async function load() {
  loading.value = true
  disponibles.value = await listQuizzesDisponibles()
  loading.value = false
}

onMounted(load)

async function abrir(id: string) {
  resultado.value = null
  const quiz = await getQuizParaResponder(id)
  quizAbierto.value = quiz
  for (const key of Object.keys(respuestas)) delete respuestas[key]
  for (const pregunta of quiz.preguntas) respuestas[pregunta.id] = null
  await cargarMiHistorial(id)
}

function cerrar() {
  quizAbierto.value = null
  resultado.value = null
  miHistorial.value = []
}

const todasRespondidas = computed(() =>
  quizAbierto.value ? quizAbierto.value.preguntas.every((p) => respuestas[p.id] !== null) : false,
)

async function enviar() {
  if (!quizAbierto.value || !todasRespondidas.value) return
  enviando.value = true
  try {
    const orden = quizAbierto.value.preguntas.map((p) => respuestas[p.id] as number)
    resultado.value = await enviarIntento(quizAbierto.value.id, orden)
    await Promise.all([load(), cargarMiHistorial(quizAbierto.value.id)])
  } catch (err) {
    await notifyError(
      'No se pudo enviar tu respuesta',
      err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.',
    )
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <h1 class="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold">
    Quiz
  </h1>

  <SkeletonBlock v-if="loading" />

  <EmptyState
    v-else-if="!quizAbierto && disponibles.length === 0"
    icon="quiz"
    title="Todavía no tienes quiz disponibles"
    description="Cuando tu coach publique uno, va a aparecer acá."
  />

  <div
    v-else-if="!quizAbierto"
    class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
  >
    <button
      v-for="quiz in disponibles"
      :key="quiz.id"
      class="flex flex-col items-start gap-2 rounded-2xl border border-[var(--color-line)] bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--color-sage)] hover:shadow-md"
      @click="abrir(quiz.id)"
    >
      <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-parchment)] text-[var(--color-bronze)]">
        <NavIcon
          name="quiz"
          :size="20"
        />
      </div>
      <p class="text-sm font-medium">
        {{ quiz.titulo }}
      </p>
      <p
        v-if="quiz.competencia"
        class="text-xs text-[var(--color-ink)]/50"
      >
        {{ quiz.competencia.nombre }} · {{ quiz.totalPreguntas }} pregunta{{ quiz.totalPreguntas === 1 ? '' : 's' }}
      </p>
      <p
        v-if="quiz.mejorPuntaje !== null"
        class="flex items-center gap-1 text-xs font-semibold text-[var(--color-spark)]"
      >
        <NavIcon
          name="trofeo"
          :size="12"
        />
        Mejor puntaje: {{ quiz.mejorPuntaje }}/{{ quiz.totalPreguntas }}
      </p>
      <p
        v-if="formatearFechaLimite(quiz.fechaLimite)"
        class="text-xs text-[var(--color-bronze)]"
      >
        {{ formatearFechaLimite(quiz.fechaLimite) }}
      </p>
    </button>
  </div>

  <div
    v-else
    class="mx-auto max-w-xl"
  >
    <button
      class="mb-4 text-sm text-[var(--color-ink)]/60 hover:text-[var(--color-ink)] hover:underline"
      @click="cerrar"
    >
      ← Volver a Quiz
    </button>

    <div
      v-if="miHistorial.length > 0"
      class="mb-4 rounded-2xl border border-[var(--color-line)] bg-white p-4"
    >
      <h3 class="mb-2 text-sm font-medium">
        Tu progreso en este quiz
      </h3>
      <ul class="space-y-1.5 text-sm">
        <li
          v-for="(intento, i) in miHistorial"
          :key="intento.id"
          class="flex items-center gap-2"
        >
          <span class="font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink)]/40">
            {{ new Date(intento.createdAt).toLocaleDateString('es-CL') }}
          </span>
          <span class="flex-1" />
          <span
            v-if="i > 0"
            class="text-xs"
            :class="intento.puntaje > miHistorial[i - 1].puntaje
              ? 'text-[var(--color-sage)]'
              : intento.puntaje < miHistorial[i - 1].puntaje
                ? 'text-[var(--color-bronze)]'
                : 'text-[var(--color-ink)]/30'"
          >
            {{ intento.puntaje > miHistorial[i - 1].puntaje ? '↑ mejoraste' : intento.puntaje < miHistorial[i - 1].puntaje ? '↓' : '=' }}
          </span>
          <span
            class="font-[family-name:var(--font-mono)] font-semibold"
            :class="intento.puntaje === Math.max(...miHistorial.map((h) => h.puntaje)) ? 'text-[var(--color-spark)]' : 'text-[var(--color-ink)]/70'"
          >
            {{ intento.puntaje }}/{{ intento.totalPreguntas }}
          </span>
        </li>
      </ul>
    </div>

    <div
      v-if="!resultado"
      class="rounded-2xl border border-[var(--color-line)] bg-white p-6"
    >
      <h2 class="mb-4 font-[family-name:var(--font-heading)] text-lg font-semibold">
        {{ quizAbierto.titulo }}
      </h2>
      <div class="space-y-5">
        <div
          v-for="(pregunta, i) in quizAbierto.preguntas"
          :key="pregunta.id"
        >
          <p class="mb-2 text-sm font-medium">
            {{ i + 1 }}. {{ pregunta.enunciado }}
          </p>
          <label
            v-for="(opcion, j) in pregunta.opciones"
            :key="j"
            class="flex items-center gap-2 py-1 text-sm"
          >
            <input
              type="radio"
              :name="`pregunta-${pregunta.id}`"
              :checked="respuestas[pregunta.id] === j"
              @change="respuestas[pregunta.id] = j"
            >
            {{ opcion }}
          </label>
        </div>
      </div>
      <button
        class="mt-5 w-full rounded-lg bg-[var(--color-sage)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        :disabled="!todasRespondidas || enviando"
        @click="enviar"
      >
        {{ enviando ? 'Enviando…' : 'Enviar respuestas' }}
      </button>
    </div>

    <div
      v-else
      class="rounded-2xl border border-[var(--color-line)] bg-white p-6 text-center"
    >
      <div
        class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full"
        :class="resultado.puntaje === resultado.totalPreguntas ? 'bg-[var(--color-spark)]/10 text-[var(--color-spark)]' : 'bg-[var(--color-parchment)] text-[var(--color-bronze)]'"
      >
        <NavIcon
          name="trofeo"
          :size="26"
        />
      </div>
      <p class="mb-1 font-[family-name:var(--font-heading)] text-2xl font-semibold">
        {{ resultado.puntaje }}/{{ resultado.totalPreguntas }}
      </p>
      <p class="mb-5 text-sm text-[var(--color-ink)]/60">
        Respuestas correctas
      </p>
      <ul class="mb-5 space-y-2 text-left text-sm">
        <li
          v-for="(detalle, i) in resultado.detalle"
          :key="detalle.preguntaId"
          class="flex items-start gap-2 rounded-lg border border-[var(--color-line)]/60 p-2"
        >
          <span :class="detalle.correcta ? 'text-[var(--color-sage)]' : 'text-[var(--color-danger)]'">
            {{ detalle.correcta ? '✓' : '✗' }}
          </span>
          <span>Pregunta {{ i + 1 }}{{ !detalle.correcta ? ` — la respuesta correcta era la opción ${detalle.respuestaCorrecta + 1}` : '' }}</span>
        </li>
      </ul>
      <button
        class="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm hover:bg-[var(--color-parchment)]/50"
        @click="cerrar"
      >
        Volver a Quiz
      </button>
    </div>
  </div>
</template>
