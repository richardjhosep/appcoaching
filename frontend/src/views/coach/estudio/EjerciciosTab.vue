<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppModal from '../../../components/AppModal.vue'
import SectionCard from '../../../components/SectionCard.vue'
import EmptyState from '../../../components/EmptyState.vue'
import StatusToggle from '../../../components/StatusToggle.vue'
import SkeletonBlock from '../../../components/SkeletonBlock.vue'
import FechaLimiteEditor from '../../../components/FechaLimiteEditor.vue'
import { formatearFechaLimite } from '../../../lib/fechaLimite'
import {
  createEjercicio,
  deleteEjercicio,
  dejarFeedback,
  getEjercicioParaCoach,
  listEjercicios,
  setEjercicioActivo,
  updateEjercicio,
  type Ejercicio,
  type VersionEjercicio,
} from '../../../api/ejercicios'
import { listCompetencias, type Competencia } from '../../../api/competencias'
import { ApiError } from '../../../api/client'
import { confirmDialog, notifyError, notifySuccess } from '../../../lib/notify'

const loading = ref(true)
const ejercicios = ref<Ejercicio[]>([])
const competencias = ref<Competencia[]>([])

const seleccionadoId = ref<string | null>(null)
const versiones = ref<VersionEjercicio[]>([])
const cargandoDetalle = ref(false)

const ejercicioSeleccionado = computed(
  () => ejercicios.value.find((e) => e.id === seleccionadoId.value) ?? null,
)

async function loadAll() {
  loading.value = true
  const [e, c] = await Promise.all([listEjercicios(), listCompetencias()])
  ejercicios.value = e
  competencias.value = c
  loading.value = false
}

onMounted(loadAll)

async function abrirDetalle(id: string) {
  seleccionadoId.value = id
  cargandoDetalle.value = true
  const detalle = await getEjercicioParaCoach(id)
  versiones.value = detalle.versiones
  feedbackEdit.value = Object.fromEntries(
    detalle.versiones.map((v) => [v.id, v.comentarioCoach ?? '']),
  )
  cargandoDetalle.value = false
}

function volverALista() {
  seleccionadoId.value = null
}

// --- Crear ejercicio ---

const modalAbierto = ref(false)
const nuevoTitulo = ref('')
const nuevaConsigna = ref('')
const nuevaCompetenciaId = ref('')
const nuevaFechaLimite = ref('')
const creando = ref(false)

function abrirModal() {
  nuevoTitulo.value = ''
  nuevaConsigna.value = ''
  nuevaCompetenciaId.value = ''
  nuevaFechaLimite.value = ''
  modalAbierto.value = true
}

async function crear() {
  if (!nuevoTitulo.value.trim() || !nuevaConsigna.value.trim()) return
  creando.value = true
  try {
    const ejercicio = await createEjercicio({
      titulo: nuevoTitulo.value.trim(),
      consigna: nuevaConsigna.value.trim(),
      competenciaId: nuevaCompetenciaId.value || undefined,
      fechaLimite: nuevaFechaLimite.value || undefined,
    })
    ejercicios.value = [ejercicio, ...ejercicios.value]
    modalAbierto.value = false
    await abrirDetalle(ejercicio.id)
  } catch (err) {
    await notifyError('No se pudo crear el ejercicio', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  } finally {
    creando.value = false
  }
}

const guardandoFechaLimite = ref(false)

async function guardarFechaLimite(fechaLimite: string | null) {
  if (!ejercicioSeleccionado.value) return
  guardandoFechaLimite.value = true
  try {
    const actualizado = await updateEjercicio(ejercicioSeleccionado.value.id, { fechaLimite })
    ejercicios.value = ejercicios.value.map((e) => (e.id === actualizado.id ? actualizado : e))
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

async function toggleActivo(ejercicio: Ejercicio) {
  const actualizado = await setEjercicioActivo(ejercicio.id, !ejercicio.activo)
  ejercicios.value = ejercicios.value.map((e) => (e.id === actualizado.id ? actualizado : e))
}

async function eliminar(ejercicio: Ejercicio) {
  const confirmado = await confirmDialog({
    title: `¿Eliminar "${ejercicio.titulo}"?`,
    text: 'Esta acción no se puede deshacer.',
    confirmText: 'Eliminar',
    danger: true,
  })
  if (!confirmado) return
  try {
    await deleteEjercicio(ejercicio.id)
    ejercicios.value = ejercicios.value.filter((e) => e.id !== ejercicio.id)
    if (seleccionadoId.value === ejercicio.id) seleccionadoId.value = null
    await notifySuccess('Ejercicio eliminado')
  } catch (err) {
    await notifyError(
      'No se pudo eliminar',
      err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.',
    )
  }
}

// --- Feedback por versión ---

const feedbackEdit = ref<Record<string, string>>({})
const guardandoFeedback = ref<string | null>(null)

async function guardarFeedback(version: VersionEjercicio) {
  const comentario = feedbackEdit.value[version.id]?.trim()
  if (!comentario) return
  guardandoFeedback.value = version.id
  try {
    const actualizada = await dejarFeedback(version.id, comentario)
    versiones.value = versiones.value.map((v) => (v.id === actualizada.id ? actualizada : v))
    await notifySuccess('Feedback guardado')
  } catch (err) {
    await notifyError(
      'No se pudo guardar el feedback',
      err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.',
    )
  } finally {
    guardandoFeedback.value = null
  }
}
</script>

<template>
  <SkeletonBlock v-if="loading" />

  <template v-else-if="!ejercicioSeleccionado">
    <div class="mb-4 flex items-center justify-between">
      <h1 class="font-[family-name:var(--font-heading)] text-xl font-semibold">
        Ejercicios de comunicación
      </h1>
      <button
        class="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm text-[var(--color-parchment)]"
        @click="abrirModal"
      >
        Nuevo ejercicio
      </button>
    </div>

    <EmptyState
      v-if="ejercicios.length === 0"
      icon="ejercicios"
      title="Todavía no has creado ningún ejercicio"
      description="Un ejercicio le pide al coachee redactar un mensaje difícil (Sabe/Siente/Haga) y te permite darle feedback por versión."
    />
    <div
      v-else
      class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      <button
        v-for="ejercicio in ejercicios"
        :key="ejercicio.id"
        class="flex flex-col items-start gap-2 rounded-2xl border border-[var(--color-line)] bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--color-sage)] hover:shadow-md"
        @click="abrirDetalle(ejercicio.id)"
      >
        <span
          class="rounded-full px-2 py-0.5 text-xs font-semibold"
          :class="ejercicio.activo ? 'bg-[var(--color-sage)]/15 text-[var(--color-sage)]' : 'bg-[var(--color-ink)]/5 text-[var(--color-ink)]/50'"
        >
          {{ ejercicio.activo ? 'Activo' : 'Inactivo' }}
        </span>
        <p class="text-sm font-medium">
          {{ ejercicio.titulo }}
        </p>
        <p
          v-if="ejercicio.competencia"
          class="text-xs text-[var(--color-ink)]/50"
        >
          {{ ejercicio.competencia.nombre }}
        </p>
        <p
          v-if="formatearFechaLimite(ejercicio.fechaLimite)"
          class="text-xs text-[var(--color-bronze)]"
        >
          {{ formatearFechaLimite(ejercicio.fechaLimite) }}
        </p>
      </button>
    </div>
  </template>

  <template v-else>
    <button
      class="mb-4 text-sm text-[var(--color-ink)]/60 hover:text-[var(--color-ink)] hover:underline"
      @click="volverALista"
    >
      ← Volver a Ejercicios
    </button>

    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="font-[family-name:var(--font-heading)] text-xl font-semibold">
          {{ ejercicioSeleccionado.titulo }}
        </h1>
        <p
          v-if="ejercicioSeleccionado.competencia"
          class="text-sm text-[var(--color-ink)]/60"
        >
          {{ ejercicioSeleccionado.competencia.nombre }}
        </p>
      </div>
      <div class="flex items-center gap-3">
        <StatusToggle
          :active="ejercicioSeleccionado.activo"
          @toggle="toggleActivo(ejercicioSeleccionado)"
        />
        <button
          class="rounded-lg border border-[var(--color-danger)]/40 px-3 py-2 text-xs text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
          @click="eliminar(ejercicioSeleccionado)"
        >
          Eliminar
        </button>
      </div>
    </div>

    <FechaLimiteEditor
      class="mb-4"
      :fecha-limite="ejercicioSeleccionado.fechaLimite"
      :guardando="guardandoFechaLimite"
      @guardar="guardarFechaLimite"
    />

    <SkeletonBlock v-if="cargandoDetalle" />
    <div
      v-else
      class="space-y-4"
    >
      <SectionCard
        title="Consigna"
        icon="ejercicios"
      >
        <p class="text-sm">
          {{ ejercicioSeleccionado.consigna }}
        </p>
      </SectionCard>

      <SectionCard
        title="Versiones recibidas"
        icon="lista"
      >
        <p
          v-if="versiones.length === 0"
          class="text-sm text-[var(--color-ink)]/50"
        >
          Todavía ningún coachee ha enviado una versión.
        </p>
        <ul
          v-else
          class="space-y-3"
        >
          <li
            v-for="version in versiones"
            :key="version.id"
            class="rounded-xl border border-[var(--color-line)]/60 p-3 text-sm"
          >
            <div class="mb-2 flex items-center justify-between gap-2">
              <p class="font-medium">
                {{ version.coachee?.nombre ?? 'Coachee' }} — versión {{ version.numeroVersion }}
              </p>
              <span
                class="rounded-full px-2 py-0.5 text-xs font-semibold"
                :class="version.estado === 'con_feedback' ? 'bg-[var(--color-sage)]/15 text-[var(--color-sage)]' : 'bg-[var(--color-bronze)]/15 text-[var(--color-bronze)]'"
              >
                {{ version.estado === 'con_feedback' ? 'Con feedback' : 'Enviada' }}
              </span>
            </div>
            <dl class="mb-3 space-y-1 text-xs text-[var(--color-ink)]/70">
              <div>
                <dt class="font-semibold">
                  Sabe (qué quiere que sepa)
                </dt>
                <dd>{{ version.sabe }}</dd>
              </div>
              <div>
                <dt class="font-semibold">
                  Siente (qué quiere que sienta)
                </dt>
                <dd>{{ version.siente }}</dd>
              </div>
              <div>
                <dt class="font-semibold">
                  Haga (qué quiere que haga)
                </dt>
                <dd>{{ version.haga }}</dd>
              </div>
            </dl>
            <label class="block text-xs">
              Feedback para el coachee
              <textarea
                v-model="feedbackEdit[version.id]"
                rows="2"
                class="mt-1 w-full rounded border border-[var(--color-line)] px-2 py-1 text-xs"
              />
            </label>
            <button
              class="mt-1 rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs hover:bg-[var(--color-parchment)]/50 disabled:opacity-60"
              :disabled="guardandoFeedback === version.id"
              @click="guardarFeedback(version)"
            >
              {{ guardandoFeedback === version.id ? 'Guardando…' : 'Guardar feedback' }}
            </button>
          </li>
        </ul>
      </SectionCard>
    </div>
  </template>

  <AppModal
    v-if="modalAbierto"
    title="Nuevo ejercicio"
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
        Consigna — el contexto que ve el coachee antes de escribir
        <textarea
          v-model="nuevaConsigna"
          rows="3"
          class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
        />
      </label>
      <label class="block text-sm">
        Competencia (opcional)
        <select
          v-model="nuevaCompetenciaId"
          class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
        >
          <option value="">
            Sin competencia asociada
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
