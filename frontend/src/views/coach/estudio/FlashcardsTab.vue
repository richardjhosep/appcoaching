<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppModal from '../../../components/AppModal.vue'
import EmptyState from '../../../components/EmptyState.vue'
import StatusToggle from '../../../components/StatusToggle.vue'
import SkeletonBlock from '../../../components/SkeletonBlock.vue'
import FechaLimiteEditor from '../../../components/FechaLimiteEditor.vue'
import {
  createFlashcard,
  deleteFlashcard,
  listFlashcards,
  setFlashcardActivo,
  updateFlashcard,
  type Flashcard,
} from '../../../api/flashcards'
import { listCompetencias, type Competencia } from '../../../api/competencias'
import { ApiError } from '../../../api/client'
import { confirmDialog, notifyError, notifySuccess } from '../../../lib/notify'

const loading = ref(true)
const flashcards = ref<Flashcard[]>([])
const competencias = ref<Competencia[]>([])

async function loadAll() {
  loading.value = true
  const [f, c] = await Promise.all([listFlashcards(), listCompetencias()])
  flashcards.value = f
  competencias.value = c
  loading.value = false
}

onMounted(loadAll)

// --- Crear ---

const modalAbierto = ref(false)
const nuevoAnverso = ref('')
const nuevoReverso = ref('')
const nuevaCompetenciaId = ref('')
const nuevaFechaLimite = ref('')
const creando = ref(false)

function abrirModal() {
  nuevoAnverso.value = ''
  nuevoReverso.value = ''
  nuevaCompetenciaId.value = ''
  nuevaFechaLimite.value = ''
  modalAbierto.value = true
}

async function crear() {
  if (!nuevoAnverso.value.trim() || !nuevoReverso.value.trim() || !nuevaCompetenciaId.value) return
  creando.value = true
  try {
    const flashcard = await createFlashcard({
      anverso: nuevoAnverso.value.trim(),
      reverso: nuevoReverso.value.trim(),
      competenciaId: nuevaCompetenciaId.value,
      fechaLimite: nuevaFechaLimite.value || undefined,
    })
    flashcards.value = [flashcard, ...flashcards.value]
    modalAbierto.value = false
    await notifySuccess('Flashcard creada')
  } catch (err) {
    await notifyError(
      'No se pudo crear la flashcard',
      err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.',
    )
  } finally {
    creando.value = false
  }
}

const guardandoFechaLimiteId = ref<string | null>(null)

async function guardarFechaLimite(flashcard: Flashcard, fechaLimite: string | null) {
  guardandoFechaLimiteId.value = flashcard.id
  try {
    const actualizada = await updateFlashcard(flashcard.id, { fechaLimite })
    flashcards.value = flashcards.value.map((f) => (f.id === actualizada.id ? actualizada : f))
  } catch (err) {
    await notifyError(
      'No se pudo actualizar la fecha límite',
      err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.',
    )
  } finally {
    guardandoFechaLimiteId.value = null
  }
}

// --- Activo/inactivo y eliminar ---

async function toggleActivo(flashcard: Flashcard) {
  const actualizada = await setFlashcardActivo(flashcard.id, !flashcard.activo)
  flashcards.value = flashcards.value.map((f) => (f.id === actualizada.id ? actualizada : f))
}

async function eliminar(flashcard: Flashcard) {
  const confirmado = await confirmDialog({
    title: '¿Eliminar esta flashcard?',
    text: 'Esta acción no se puede deshacer.',
    confirmText: 'Eliminar',
    danger: true,
  })
  if (!confirmado) return
  try {
    await deleteFlashcard(flashcard.id)
    flashcards.value = flashcards.value.filter((f) => f.id !== flashcard.id)
    await notifySuccess('Flashcard eliminada')
  } catch (err) {
    await notifyError(
      'No se pudo eliminar',
      err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.',
    )
  }
}
</script>

<template>
  <SkeletonBlock v-if="loading" />

  <template v-else>
    <div class="mb-4 flex items-center justify-between">
      <h1 class="font-[family-name:var(--font-heading)] text-xl font-semibold">
        Flashcards
      </h1>
      <button
        class="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm text-[var(--color-parchment)]"
        @click="abrirModal"
      >
        Nueva flashcard
      </button>
    </div>

    <EmptyState
      v-if="flashcards.length === 0"
      icon="flashcards"
      title="Todavía no has creado ninguna flashcard"
      description="Escribe una pregunta o concepto en el anverso y su respuesta en el reverso — el coachee las repasa a su ritmo."
    />
    <div
      v-else
      class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      <div
        v-for="flashcard in flashcards"
        :key="flashcard.id"
        class="flex flex-col gap-2 rounded-2xl border border-[var(--color-line)] bg-white p-4"
      >
        <p class="text-sm font-medium">
          {{ flashcard.anverso }}
        </p>
        <p class="text-xs text-[var(--color-ink)]/60">
          {{ flashcard.reverso }}
        </p>
        <p
          v-if="flashcard.competencia"
          class="text-xs text-[var(--color-ink)]/40"
        >
          {{ flashcard.competencia.nombre }}
        </p>
        <FechaLimiteEditor
          :fecha-limite="flashcard.fechaLimite"
          :guardando="guardandoFechaLimiteId === flashcard.id"
          @guardar="(f) => guardarFechaLimite(flashcard, f)"
        />
        <div class="mt-2 flex items-center justify-between">
          <StatusToggle
            :active="flashcard.activo"
            @toggle="toggleActivo(flashcard)"
          />
          <button
            class="text-xs text-[var(--color-danger)] hover:underline"
            @click="eliminar(flashcard)"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  </template>

  <AppModal
    v-if="modalAbierto"
    title="Nueva flashcard"
    @close="modalAbierto = false"
  >
    <form
      class="space-y-4"
      @submit.prevent="crear"
    >
      <label class="block text-sm">
        Anverso (pregunta o concepto)
        <textarea
          v-model="nuevoAnverso"
          rows="2"
          class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
        />
      </label>
      <label class="block text-sm">
        Reverso (respuesta)
        <textarea
          v-model="nuevoReverso"
          rows="2"
          class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
        />
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
