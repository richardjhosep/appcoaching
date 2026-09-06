<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppModal from '../../../components/AppModal.vue'
import EmptyState from '../../../components/EmptyState.vue'
import SectionCard from '../../../components/SectionCard.vue'
import MapaCanvas from '../../../components/MapaCanvas.vue'
import SkeletonBlock from '../../../components/SkeletonBlock.vue'
import {
  addNodoPersonal,
  createMapaPersonal,
  deleteMapaPersonal,
  deleteNodoPersonal,
  getMapaPersonal,
  listMapasPersonales,
  updateNodoPersonal,
  type MapaPersonal,
  type MapaPersonalConNodos,
  type NodoMapaPersonal,
} from '../../../api/mapasPersonales'
import { ApiError } from '../../../api/client'
import { confirmDialog, notifyError, notifySuccess } from '../../../lib/notify'

const loading = ref(true)
const mapas = ref<MapaPersonal[]>([])

async function loadAll() {
  loading.value = true
  mapas.value = await listMapasPersonales()
  loading.value = false
}

onMounted(loadAll)

// --- Detalle ---

const mapaAbierto = ref<MapaPersonalConNodos | null>(null)
const cargandoDetalle = ref(false)
const seleccionadoId = ref<string | null>(null)

const nodoSeleccionado = computed<NodoMapaPersonal | null>(
  () => mapaAbierto.value?.nodos.find((n) => n.id === seleccionadoId.value) ?? null,
)

async function abrirDetalle(id: string) {
  cargandoDetalle.value = true
  seleccionadoId.value = null
  mapaAbierto.value = await getMapaPersonal(id)
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
const creando = ref(false)

function abrirModal() {
  nuevoTitulo.value = ''
  modalAbierto.value = true
}

async function crear() {
  if (!nuevoTitulo.value.trim()) return
  creando.value = true
  try {
    const mapa = await createMapaPersonal(nuevoTitulo.value.trim())
    mapas.value = [mapa, ...mapas.value]
    modalAbierto.value = false
    await abrirDetalle(mapa.id)
  } catch (err) {
    await notifyError('No se pudo crear el mapa', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  } finally {
    creando.value = false
  }
}

// --- Eliminar mapa ---

async function eliminarMapa(mapa: MapaPersonal) {
  const confirmado = await confirmDialog({
    title: `¿Eliminar "${mapa.titulo}"?`,
    text: 'Se eliminan también todos sus nodos. Esta acción no se puede deshacer.',
    confirmText: 'Eliminar',
    danger: true,
  })
  if (!confirmado) return
  await deleteMapaPersonal(mapa.id)
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
    const nodo = await addNodoPersonal(mapaAbierto.value.id, {
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
  const actualizado = await updateNodoPersonal(nodoSeleccionado.value.id, {
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
  await deleteNodoPersonal(nodoSeleccionado.value.id)
  mapaAbierto.value = await getMapaPersonal(mapaAbierto.value.id)
  seleccionadoId.value = null
}
</script>

<template>
  <SkeletonBlock v-if="loading" />

  <template v-else-if="!mapaAbierto">
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h2 class="font-[family-name:var(--font-heading)] text-lg font-semibold">
          Mis mapas mentales
        </h2>
        <p class="text-xs text-[var(--color-ink)]/50">
          Tuyos, para organizar tus propias ideas — nadie más los ve.
        </p>
      </div>
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
      title="Todavía no has creado ningún mapa"
      description="Arma un tema central y ramifícalo en conceptos — solo tú lo vas a ver."
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
        </button>
        <div class="mt-1 flex justify-end">
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
      ← Volver a Mis mapas mentales
    </button>
    <h2 class="mb-3 font-[family-name:var(--font-heading)] text-lg font-semibold">
      {{ mapaAbierto.titulo }}
    </h2>

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
              Detalle (opcional)
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
