<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import AppModal from '../../../components/AppModal.vue'
import SectionCard from '../../../components/SectionCard.vue'
import EmptyState from '../../../components/EmptyState.vue'
import StatusToggle from '../../../components/StatusToggle.vue'
import SkeletonBlock from '../../../components/SkeletonBlock.vue'
import FechaLimiteEditor from '../../../components/FechaLimiteEditor.vue'
import { formatearFechaLimite } from '../../../lib/fechaLimite'
import {
  addPreguntaEstilo,
  createTestEstilo,
  deletePreguntaEstilo,
  deleteTestEstilo,
  getTestEstiloParaCoach,
  listIntentosDeTestEstilo,
  listTestsEstilo,
  setTestEstiloActivo,
  updateTestEstilo,
  type IntentoEstilo,
  type PreguntaEstilo,
  type TestEstilo,
} from '../../../api/testEstilo'
import { listCompetencias, type Competencia } from '../../../api/competencias'
import { ApiError } from '../../../api/client'
import { confirmDialog, notifyError, notifySuccess } from '../../../lib/notify'
import { categoriasDe } from '../../../lib/testEstiloPerfil'

const loading = ref(true)
const tests = ref<TestEstilo[]>([])
const competencias = ref<Competencia[]>([])

const seleccionadoId = ref<string | null>(null)
const preguntas = ref<PreguntaEstilo[]>([])
const intentos = ref<IntentoEstilo[]>([])
const cargandoDetalle = ref(false)

const testSeleccionado = computed(() => tests.value.find((t) => t.id === seleccionadoId.value) ?? null)

async function loadAll() {
  loading.value = true
  const [t, c] = await Promise.all([listTestsEstilo(), listCompetencias()])
  tests.value = t
  competencias.value = c
  loading.value = false
}

onMounted(loadAll)

async function abrirDetalle(id: string) {
  seleccionadoId.value = id
  cargandoDetalle.value = true
  const [detalle, intentosDelTest] = await Promise.all([
    getTestEstiloParaCoach(id),
    listIntentosDeTestEstilo(id),
  ])
  preguntas.value = detalle.preguntas
  intentos.value = intentosDelTest
  cargandoDetalle.value = false
}

function volverALista() {
  seleccionadoId.value = null
}

// --- Crear test ---

const modalAbierto = ref(false)
const nuevoTitulo = ref('')
const nuevaDescripcion = ref('')
const nuevaCompetenciaId = ref('')
const nuevaFechaLimite = ref('')
const creando = ref(false)

function abrirModal() {
  nuevoTitulo.value = ''
  nuevaDescripcion.value = ''
  nuevaCompetenciaId.value = ''
  nuevaFechaLimite.value = ''
  modalAbierto.value = true
}

async function crear() {
  if (!nuevoTitulo.value.trim()) return
  creando.value = true
  try {
    const test = await createTestEstilo({
      titulo: nuevoTitulo.value.trim(),
      descripcion: nuevaDescripcion.value.trim() || undefined,
      competenciaId: nuevaCompetenciaId.value || undefined,
      fechaLimite: nuevaFechaLimite.value || undefined,
    })
    tests.value = [test, ...tests.value]
    modalAbierto.value = false
    await abrirDetalle(test.id)
  } catch (err) {
    await notifyError('No se pudo crear el test', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  } finally {
    creando.value = false
  }
}

const guardandoFechaLimite = ref(false)

async function guardarFechaLimite(fechaLimite: string | null) {
  if (!testSeleccionado.value) return
  guardandoFechaLimite.value = true
  try {
    const actualizado = await updateTestEstilo(testSeleccionado.value.id, { fechaLimite })
    tests.value = tests.value.map((t) => (t.id === actualizado.id ? actualizado : t))
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

async function toggleActivo(test: TestEstilo) {
  const actualizado = await setTestEstiloActivo(test.id, !test.activo)
  tests.value = tests.value.map((t) => (t.id === actualizado.id ? actualizado : t))
}

async function eliminar(test: TestEstilo) {
  const confirmado = await confirmDialog({
    title: `¿Eliminar "${test.titulo}"?`,
    text: 'Esta acción no se puede deshacer.',
    confirmText: 'Eliminar',
    danger: true,
  })
  if (!confirmado) return
  try {
    await deleteTestEstilo(test.id)
    tests.value = tests.value.filter((t) => t.id !== test.id)
    if (seleccionadoId.value === test.id) seleccionadoId.value = null
    await notifySuccess('Test eliminado')
  } catch (err) {
    await notifyError(
      'No se pudo eliminar',
      err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.',
    )
  }
}

// --- Preguntas ---

const nuevaPregunta = reactive({ opcionA: '', categoriaA: '', opcionB: '', categoriaB: '' })
const guardandoPregunta = ref(false)

async function guardarPregunta() {
  if (
    !nuevaPregunta.opcionA.trim() ||
    !nuevaPregunta.categoriaA.trim() ||
    !nuevaPregunta.opcionB.trim() ||
    !nuevaPregunta.categoriaB.trim() ||
    !seleccionadoId.value
  ) {
    return
  }
  guardandoPregunta.value = true
  try {
    const pregunta = await addPreguntaEstilo(seleccionadoId.value, {
      opcionA: nuevaPregunta.opcionA.trim(),
      categoriaA: nuevaPregunta.categoriaA.trim(),
      opcionB: nuevaPregunta.opcionB.trim(),
      categoriaB: nuevaPregunta.categoriaB.trim(),
    })
    preguntas.value = [...preguntas.value, pregunta]
    nuevaPregunta.opcionA = ''
    nuevaPregunta.categoriaA = ''
    nuevaPregunta.opcionB = ''
    nuevaPregunta.categoriaB = ''
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
  await deletePreguntaEstilo(preguntaId)
  preguntas.value = preguntas.value.filter((p) => p.id !== preguntaId)
}

// Perfil por coachee — NO es un ranking: un test de estilo no tiene "mejor puntaje"
// (categoriasDe viene de lib/testEstiloPerfil.ts, compartida con la vista del coachee).
</script>

<template>
  <SkeletonBlock v-if="loading" />

  <template v-else-if="!testSeleccionado">
    <div class="mb-4 flex items-center justify-between">
      <h1 class="font-[family-name:var(--font-heading)] text-xl font-semibold">
        Test de Estilo
      </h1>
      <button
        class="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm text-[var(--color-parchment)]"
        @click="abrirModal"
      >
        Nuevo test
      </button>
    </div>

    <EmptyState
      v-if="tests.length === 0"
      icon="estilo"
      title="Todavía no has creado ningún test de estilo"
      description="Un test de estilo le presenta al coachee pares de afirmaciones (A/B) y arma un perfil por categoría — ideal para instrumentos de autopercepción como manejo de conflicto."
    />
    <div
      v-else
      class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      <button
        v-for="test in tests"
        :key="test.id"
        class="flex flex-col items-start gap-2 rounded-2xl border border-[var(--color-line)] bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--color-sage)] hover:shadow-md"
        @click="abrirDetalle(test.id)"
      >
        <span
          class="rounded-full px-2 py-0.5 text-xs font-semibold"
          :class="test.activo ? 'bg-[var(--color-sage)]/15 text-[var(--color-sage)]' : 'bg-[var(--color-ink)]/5 text-[var(--color-ink)]/50'"
        >
          {{ test.activo ? 'Activo' : 'Inactivo' }}
        </span>
        <p class="text-sm font-medium">
          {{ test.titulo }}
        </p>
        <p
          v-if="test.competencia"
          class="text-xs text-[var(--color-ink)]/50"
        >
          {{ test.competencia.nombre }}
        </p>
        <p
          v-if="formatearFechaLimite(test.fechaLimite)"
          class="text-xs text-[var(--color-bronze)]"
        >
          {{ formatearFechaLimite(test.fechaLimite) }}
        </p>
      </button>
    </div>
  </template>

  <template v-else>
    <button
      class="mb-4 text-sm text-[var(--color-ink)]/60 hover:text-[var(--color-ink)] hover:underline"
      @click="volverALista"
    >
      ← Volver a Test de Estilo
    </button>

    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="font-[family-name:var(--font-heading)] text-xl font-semibold">
          {{ testSeleccionado.titulo }}
        </h1>
        <p
          v-if="testSeleccionado.competencia"
          class="text-sm text-[var(--color-ink)]/60"
        >
          {{ testSeleccionado.competencia.nombre }}
        </p>
      </div>
      <div class="flex items-center gap-3">
        <StatusToggle
          :active="testSeleccionado.activo"
          @toggle="toggleActivo(testSeleccionado)"
        />
        <button
          class="rounded-lg border border-[var(--color-danger)]/40 px-3 py-2 text-xs text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
          @click="eliminar(testSeleccionado)"
        >
          Eliminar
        </button>
      </div>
    </div>

    <FechaLimiteEditor
      class="mb-4"
      :fecha-limite="testSeleccionado.fechaLimite"
      :guardando="guardandoFechaLimite"
      @guardar="guardarFechaLimite"
    />

    <SkeletonBlock v-if="cargandoDetalle" />
    <div
      v-else
      class="space-y-4"
    >
      <SectionCard
        title="Preguntas (pares A/B)"
        icon="lista"
      >
        <ul class="mb-4 space-y-2">
          <li
            v-for="pregunta in preguntas"
            :key="pregunta.id"
            class="rounded-xl border border-[var(--color-line)]/60 p-3 text-sm"
          >
            <div class="mb-1 flex items-start justify-between gap-2">
              <div class="space-y-1">
                <p><span class="font-semibold text-[var(--color-ink)]/50">A —</span> {{ pregunta.opcionA }} <span class="text-xs text-[var(--color-ink)]/40">({{ pregunta.categoriaA }})</span></p>
                <p><span class="font-semibold text-[var(--color-ink)]/50">B —</span> {{ pregunta.opcionB }} <span class="text-xs text-[var(--color-ink)]/40">({{ pregunta.categoriaB }})</span></p>
              </div>
              <button
                class="shrink-0 text-xs text-[var(--color-bronze)] hover:underline"
                @click="borrarPregunta(pregunta.id)"
              >
                Quitar
              </button>
            </div>
          </li>
        </ul>

        <div class="space-y-2 rounded-xl border border-[var(--color-line)]/60 bg-[var(--color-parchment)]/30 p-4">
          <div class="grid gap-2 sm:grid-cols-2">
            <input
              v-model="nuevaPregunta.opcionA"
              type="text"
              placeholder="Opción A"
              class="rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
            >
            <input
              v-model="nuevaPregunta.categoriaA"
              type="text"
              placeholder="Categoría de A (ej. Competir)"
              class="rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
            >
            <input
              v-model="nuevaPregunta.opcionB"
              type="text"
              placeholder="Opción B"
              class="rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
            >
            <input
              v-model="nuevaPregunta.categoriaB"
              type="text"
              placeholder="Categoría de B (ej. Colaborar)"
              class="rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
            >
          </div>
          <div class="flex justify-end pt-1">
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
        title="Perfiles de coachees"
        icon="trofeo"
      >
        <p
          v-if="intentos.length === 0"
          class="text-sm text-[var(--color-ink)]/50"
        >
          Todavía ningún coachee ha respondido este test.
        </p>
        <ul
          v-else
          class="space-y-4 text-sm"
        >
          <li
            v-for="intento in intentos"
            :key="intento.id"
            class="rounded-xl border border-[var(--color-line)]/60 p-3"
          >
            <p class="mb-2 font-medium">
              {{ intento.coachee?.nombre ?? 'Coachee' }}
              <span class="font-normal text-[var(--color-ink)]/50">— {{ intento.categoriaDominante }}</span>
            </p>
            <div class="space-y-1">
              <div
                v-for="fila in categoriasDe(intento.resultado)"
                :key="fila.categoria"
                class="flex items-center gap-2 text-xs"
              >
                <span class="w-28 shrink-0 truncate text-[var(--color-ink)]/60">{{ fila.categoria }}</span>
                <div class="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-parchment)]">
                  <div
                    class="h-full rounded-full bg-[var(--color-sage)]"
                    :style="{ width: `${(fila.conteo / fila.max) * 100}%` }"
                  />
                </div>
                <span class="w-4 shrink-0 text-right font-[family-name:var(--font-mono)] text-[var(--color-ink)]/60">{{ fila.conteo }}</span>
              </div>
            </div>
          </li>
        </ul>
      </SectionCard>
    </div>
  </template>

  <AppModal
    v-if="modalAbierto"
    title="Nuevo test de estilo"
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
        Descripción/instrucciones (opcional)
        <textarea
          v-model="nuevaDescripcion"
          rows="2"
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
