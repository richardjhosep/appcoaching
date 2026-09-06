<script setup lang="ts">
import { onMounted, ref } from 'vue'
import NotaPizarraCard from '../../../components/NotaPizarra.vue'
import SkeletonBlock from '../../../components/SkeletonBlock.vue'
import EmptyState from '../../../components/EmptyState.vue'
import { listarNotas, crearNota, actualizarNota, eliminarNota, type NotaPizarra } from '../../../api/pizarra'
import { ApiError } from '../../../api/client'
import { confirmDialog, notifyError } from '../../../lib/notify'

const loading = ref(true)
const notas = ref<NotaPizarra[]>([])

async function load() {
  loading.value = true
  notas.value = await listarNotas()
  loading.value = false
}
onMounted(load)

// Cada nota nueva se corre un poco respecto de la anterior para que no queden todas
// apiladas exactamente en el mismo lugar.
async function agregarNota() {
  const offset = (notas.value.length % 6) * 24
  try {
    const nota = await crearNota({ posX: 24 + offset, posY: 24 + offset })
    notas.value = [...notas.value, nota]
  } catch (err) {
    await notifyError('No se pudo crear la nota', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  }
}

function reemplazar(actualizada: NotaPizarra) {
  notas.value = notas.value.map((n) => (n.id === actualizada.id ? actualizada : n))
}

async function onMover(id: string, posX: number, posY: number) {
  try {
    reemplazar(await actualizarNota(id, { posX, posY }))
  } catch (err) {
    await notifyError('No se pudo mover la nota', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  }
}

async function onTexto(id: string, texto: string) {
  try {
    reemplazar(await actualizarNota(id, { texto }))
  } catch (err) {
    await notifyError('No se pudo guardar la nota', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  }
}

async function onColor(id: string, color: string) {
  try {
    reemplazar(await actualizarNota(id, { color }))
  } catch (err) {
    await notifyError('No se pudo cambiar el color', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  }
}

async function onEliminar(id: string) {
  const confirmado = await confirmDialog({
    title: '¿Eliminar esta nota?',
    text: 'Esta acción no se puede deshacer.',
    confirmText: 'Eliminar',
    danger: true,
  })
  if (!confirmado) return
  await eliminarNota(id)
  notas.value = notas.value.filter((n) => n.id !== id)
}
</script>

<template>
  <div class="mb-4 flex items-center justify-between">
    <div>
      <h2 class="font-[family-name:var(--font-heading)] text-lg font-semibold">
        Mi pizarra
      </h2>
      <p class="text-xs text-[var(--color-ink)]/50">
        Notas para organizar tus ideas al estudiar — solo tú las ves.
      </p>
    </div>
    <button
      type="button"
      class="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm text-[var(--color-parchment)]"
      @click="agregarNota"
    >
      + Nueva nota
    </button>
  </div>

  <SkeletonBlock v-if="loading" />
  <EmptyState
    v-else-if="notas.length === 0"
    icon="mapa"
    title="Tu pizarra está vacía"
    description="Agrega una nota para empezar a organizar tus ideas."
  />
  <div
    v-else
    class="relative h-[70vh] min-h-[500px] overflow-auto rounded-2xl border border-[var(--color-line)] bg-[var(--color-parchment)]/30"
  >
    <NotaPizarraCard
      v-for="nota in notas"
      :key="nota.id"
      :nota="nota"
      @mover="onMover"
      @texto="onTexto"
      @color="onColor"
      @eliminar="onEliminar"
    />
  </div>
</template>
