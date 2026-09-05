<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppModal from '../../../components/AppModal.vue'
import EmptyState from '../../../components/EmptyState.vue'
import SectionCard from '../../../components/SectionCard.vue'
import StatusToggle from '../../../components/StatusToggle.vue'
import MapaCanvas from '../../../components/MapaCanvas.vue'
import SkeletonBlock from '../../../components/SkeletonBlock.vue'
import FechaLimiteEditor from '../../../components/FechaLimiteEditor.vue'
import {
  addNodo,
  createMapa,
  deleteMapa,
  deleteNodo,
  getMapa,
  listMapas,
  setMapaActivo,
  updateMapa,
  updateNodo,
  type Mapa,
  type MapaConNodos,
  type NodoMapa,
} from '../../../api/mapas'
import { listCompetencias, type Competencia } from '../../../api/competencias'
import { ApiError } from '../../../api/client'
import { confirmDialog, notifyError, notifySuccess } from '../../../lib/notify'

const loading = ref(true)
const mapas = ref<Mapa[]>([])
const competencias = ref<Competencia[]>([])

async function loadAll() {
  loading.value = true
  const [m, c] = await Promise.all([listMapas(), listCompetencias()])
  mapas.value = m
  competencias.value = c
  loading.value = false
}

onMounted(loadAll)

// --- Detalle ---

const mapaAbierto = ref<MapaConNodos | null>(null)
const cargandoDetalle = ref(false)
const seleccionadoId = ref<string | null>(null)

const nodoSeleccionado = computed<NodoMapa | null>(
  () => mapaAbierto.value?.nodos.find((n) => n.id === seleccionadoId.value) ?? null,
)

async function abrirDetalle(id: string) {
  cargandoDetalle.value = true
  seleccionadoId.value = null
  mapaAbierto.value = await getMapa(id)
  cargandoDetalle.value = false
}

function volverALista() {
  mapaAbierto.value = null
}

function descendientesDe(nodoId: string): number {
  if (!mapaAbierto.value) return 0
  const hijosPorPadre = new Map<string, string[]>()
  for (const n of mapaAbierto.value.nodos) {
    if (!n.parentId) continue
    if (!hijosPorPadre.has(n.parentId)) hijosPorPadre.set(n.parentId, [])
    hijosPorPadre.get(n.parentId)!.push(n.id)
  }
  let total = 0
  const pila = [nodoId]
  while (pila.length) {
    const actual = pila.pop()!
    for (const hijoId of hijosPorPadre.get(actual) ?? []) {
      total += 1
      pila.push(hijoId)
    }
  }
  return total
}

// --- Crear mapa ---

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
    const mapa = await createMapa({
      titulo: nuevoTitulo.value.trim(),
      competenciaId: nuevaCompetenciaId.value,
      fechaLimite: nuevaFechaLimite.value || undefined,
    })
    mapas.value = [mapa, ...mapas.value]
    modalAbierto.value = false
    await abrirDetalle(mapa.id)
  } catch (err) {
    await notifyError('No se pudo crear el mapa', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  } finally {
    creando.value = false
  }
}

// --- Activo/inactivo y eliminar mapa ---

async function toggleActivo(mapa: Mapa) {
  const actualizado = await setMapaActivo(mapa.id, !mapa.activo)
  mapas.value = mapas.value.map((m) => (m.id === actualizado.id ? actualizado : m))
  if (mapaAbierto.value?.id === actualizado.id) mapaAbierto.value = { ...mapaAbierto.value, ...actualizado }
}

const guardandoFechaLimite = ref(false)

async function guardarFechaLimite(mapa: Mapa, fechaLimite: string | null) {
  guardandoFechaLimite.value = true
  try {
    const actualizado = await updateMapa(mapa.id, { fechaLimite })
    mapas.value = mapas.value.map((m) => (m.id === actualizado.id ? actualizado : m))
    if (mapaAbierto.value?.id === actualizado.id) {
      mapaAbierto.value = { ...mapaAbierto.value, ...actualizado }
    }
  } catch (err) {
    await notifyError(
      'No se pudo actualizar la fecha límite',
      err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.',
    )
  } finally {
    guardandoFechaLimite.value = false
  }
}

async function eliminarMapa(mapa: Mapa) {
  const confirmado = await confirmDialog({
    title: `¿Eliminar "${mapa.titulo}"?`,
    text: 'Se eliminan también todos sus nodos. Esta acción no se puede deshacer.',
    confirmText: 'Eliminar',
    danger: true,
  })
  if (!confirmado) return
  await deleteMapa(mapa.id)
  mapas.value = mapas.value.filter((m) => m.id !== mapa.id)
  if (mapaAbierto.value?.id === mapa.id) mapaAbierto.value = null
  await notifySuccess('Mapa eliminado')
}

// --- Nodos ---

const nuevoLabel = ref('')
const nuevoDetalle = ref('')
const guardandoNodo = ref(false)

async function agregarNodo() {
  if (!nuevoLabel.value.trim() || !mapaAbierto.value) return
  guardandoNodo.value = true
  try {
    const nodo = await addNodo(mapaAbierto.value.id, {
      label: nuevoLabel.value.trim(),
      detalle: nuevoDetalle.value.trim() || undefined,
      parentId: seleccionadoId.value ?? undefined,
    })
    mapaAbierto.value = { ...mapaAbierto.value, nodos: [...mapaAbierto.value.nodos, nodo] }
    nuevoLabel.value = ''
    nuevoDetalle.value = ''
  } catch (err) {
    await notifyError('No se pudo agregar el nodo', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  } finally {
    guardandoNodo.value = false
  }
}

async function guardarEdicionNodo() {
  if (!nodoSeleccionado.value || !mapaAbierto.value) return
  const actualizado = await updateNodo(nodoSeleccionado.value.id, {
    label: nodoSeleccionado.value.label,
    detalle: nodoSeleccionado.value.detalle ?? undefined,
  })
  mapaAbierto.value = {
    ...mapaAbierto.value,
    nodos: mapaAbierto.value.nodos.map((n) => (n.id === actualizado.id ? actualizado : n)),
  }
  await notifySuccess('Nodo actualizado')
}

async function eliminarNodo() {
  if (!nodoSeleccionado.value || !mapaAbierto.value) return
  const hijos = descendientesDe(nodoSeleccionado.value.id)
  const confirmado = await confirmDialog({
    title: `¿Eliminar "${nodoSeleccionado.value.label}"?`,
    text: hijos > 0
      ? `Esto también elimina sus ${hijos} nodo${hijos === 1 ? '' : 's'} descendiente${hijos === 1 ? '' : 's'}.`
      : 'Esta acción no se puede deshacer.',
    confirmText: 'Eliminar',
    danger: true,
  })
  if (!confirmado) return
  await deleteNodo(nodoSeleccionado.value.id)
  const idsBorrados = new Set([nodoSeleccionado.value.id])
  // Refetch simple: recargar el mapa completo evita reconstruir la cascada a mano en el cliente.
  mapaAbierto.value = await getMapa(mapaAbierto.value.id)
  if (idsBorrados.has(seleccionadoId.value ?? '')) seleccionadoId.value = null
}
</script>

<template>
  <SkeletonBlock v-if="loading" />

  <template v-else-if="!mapaAbierto">
    <div class="mb-4 flex items-center justify-between">
      <h1 class="font-[family-name:var(--font-heading)] text-xl font-semibold">
        Mapas mentales
      </h1>
      <button
        class="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm text-[var(--color-parchment)]"
        @click="abrirModal"
      >
        Nuevo mapa
      </button>
    </div>

    <EmptyState
      v-if="mapas.length === 0"
      icon="mapa"
      title="Todavía no has creado ningún mapa mental"
      description="Arma un tema central y ramifícalo en conceptos — el coachee lo explora tocando cada nodo."
    />
    <div
      v-else
      class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      <div
        v-for="mapa in mapas"
        :key="mapa.id"
        class="flex flex-col gap-2 rounded-2xl border border-[var(--color-line)] bg-white p-4"
      >
        <button
          class="text-left"
          @click="abrirDetalle(mapa.id)"
        >
          <p class="text-sm font-medium">
            {{ mapa.titulo }}
          </p>
          <p
            v-if="mapa.competencia"
            class="text-xs text-[var(--color-ink)]/50"
          >
            {{ mapa.competencia.nombre }}
          </p>
        </button>
        <FechaLimiteEditor
          :fecha-limite="mapa.fechaLimite"
          :guardando="guardandoFechaLimite"
          @guardar="(f) => guardarFechaLimite(mapa, f)"
        />
        <div class="mt-1 flex items-center justify-between">
          <StatusToggle
            :active="mapa.activo"
            @toggle="toggleActivo(mapa)"
          />
          <button
            class="text-xs text-[var(--color-danger)] hover:underline"
            @click="eliminarMapa(mapa)"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  </template>

  <template v-else>
    <button
      class="mb-4 text-sm text-[var(--color-ink)]/60 hover:text-[var(--color-ink)] hover:underline"
      @click="volverALista"
    >
      ← Volver a Mapas mentales
    </button>
    <h1 class="mb-1 font-[family-name:var(--font-heading)] text-xl font-semibold">
      {{ mapaAbierto.titulo }}
    </h1>
    <FechaLimiteEditor
      class="mb-4"
      :fecha-limite="mapaAbierto.fechaLimite"
      :guardando="guardandoFechaLimite"
      @guardar="(f) => guardarFechaLimite(mapaAbierto!, f)"
    />

    <SkeletonBlock v-if="cargandoDetalle" />

    <EmptyState
      v-else-if="mapaAbierto.nodos.length === 0"
      icon="mapa"
      title="Agrega el tema central"
      description="Es el primer nodo del mapa — todo lo demás se ramifica desde acá."
    >
      <div class="mx-auto flex max-w-sm flex-col gap-2">
        <input
          v-model="nuevoLabel"
          type="text"
          placeholder="Tema central"
          class="rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
        >
        <button
          class="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm text-[var(--color-parchment)] disabled:opacity-60"
          :disabled="guardandoNodo || !nuevoLabel.trim()"
          @click="agregarNodo"
        >
          Crear tema central
        </button>
      </div>
    </EmptyState>

    <div
      v-else
      class="grid gap-4 lg:grid-cols-[1fr_320px]"
    >
      <MapaCanvas
        :nodos="mapaAbierto.nodos"
        :seleccionado-id="seleccionadoId"
        @select="(id) => (seleccionadoId = id)"
      />

      <SectionCard
        :title="nodoSeleccionado ? nodoSeleccionado.label : 'Selecciona un nodo'"
        icon="mapa"
      >
        <template v-if="nodoSeleccionado">
          <div class="space-y-3">
            <label class="block text-sm">
              Texto del nodo
              <input
                v-model="nodoSeleccionado.label"
                type="text"
                class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
              >
            </label>
            <label class="block text-sm">
              Detalle (opcional, lo ve el coachee al tocar el nodo)
              <textarea
                v-model="nodoSeleccionado.detalle"
                rows="3"
                class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
              />
            </label>
            <button
              class="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm hover:bg-[var(--color-parchment)]/50"
              @click="guardarEdicionNodo"
            >
              Guardar cambios
            </button>
          </div>

          <div class="mt-4 space-y-2 border-t border-[var(--color-line)] pt-4">
            <p class="text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/45">
              Agregar nodo hijo de "{{ nodoSeleccionado.label }}"
            </p>
            <input
              v-model="nuevoLabel"
              type="text"
              placeholder="Texto del nodo hijo"
              class="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
            >
            <input
              v-model="nuevoDetalle"
              type="text"
              placeholder="Detalle (opcional)"
              class="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
            >
            <button
              class="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm hover:bg-[var(--color-parchment)]/50 disabled:opacity-60"
              :disabled="guardandoNodo || !nuevoLabel.trim()"
              @click="agregarNodo"
            >
              Agregar
            </button>
          </div>

          <button
            class="mt-4 w-full rounded-lg border border-[var(--color-danger)]/40 px-3 py-2 text-xs text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
            @click="eliminarNodo"
          >
            Eliminar este nodo
          </button>
        </template>
        <p
          v-else
          class="text-sm text-[var(--color-ink)]/50"
        >
          Toca un nodo del mapa para editarlo o agregarle ramas.
        </p>
      </SectionCard>
    </div>
  </template>

  <AppModal
    v-if="modalAbierto"
    title="Nuevo mapa mental"
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
