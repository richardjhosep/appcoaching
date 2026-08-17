<script setup lang="ts">
import { computed, ref } from 'vue'
import { buildArbol, layoutArbol, aplanar, type NodoArbol, type NodoPosicionado } from '../lib/mapaArbol'
import type { NodoMapa } from '../api/mapas'

const props = defineProps<{
  nodos: NodoMapa[]
  seleccionadoId?: string | null
}>()

const emit = defineEmits<{ select: [nodoId: string] }>()

const SPACING_X = 220
const SPACING_Y = 84
const NODE_WIDTH = 176
const NODE_HEIGHT = 52
const PADDING = 32

const colapsados = ref<Set<string>>(new Set())

const arbol = computed<NodoArbol[]>(() => buildArbol(props.nodos))

const posicionado = computed<NodoPosicionado | null>(() =>
  arbol.value.length ? layoutArbol(arbol.value[0], colapsados.value) : null,
)

const lista = computed(() => (posicionado.value ? aplanar(posicionado.value) : []))

function px(n: NodoPosicionado) {
  return { left: n.x * SPACING_X + PADDING, top: n.y * SPACING_Y + PADDING }
}

const edges = computed(() => {
  const resultado: { key: string; x1: number; y1: number; x2: number; y2: number }[] = []
  function recorrer(n: NodoPosicionado) {
    for (const h of n.hijosPosicionados) {
      const desde = px(n)
      const hasta = px(h)
      resultado.push({
        key: `${n.id}-${h.id}`,
        x1: desde.left + NODE_WIDTH,
        y1: desde.top + NODE_HEIGHT / 2,
        x2: hasta.left,
        y2: hasta.top + NODE_HEIGHT / 2,
      })
      recorrer(h)
    }
  }
  if (posicionado.value) recorrer(posicionado.value)
  return resultado
})

const anchoTotal = computed(() =>
  lista.value.length
    ? Math.max(...lista.value.map((n) => n.x)) * SPACING_X + NODE_WIDTH + PADDING * 2
    : 400,
)
const altoTotal = computed(() =>
  lista.value.length
    ? Math.max(...lista.value.map((n) => n.y)) * SPACING_Y + NODE_HEIGHT + PADDING * 2
    : 200,
)

function tocar(nodo: NodoPosicionado) {
  emit('select', nodo.id)
  if (nodo.hijos.length > 0) {
    const copia = new Set(colapsados.value)
    if (copia.has(nodo.id)) copia.delete(nodo.id)
    else copia.add(nodo.id)
    colapsados.value = copia
  }
}
</script>

<template>
  <div class="max-h-[70vh] overflow-auto rounded-2xl border border-[var(--color-line)] bg-white">
    <div
      class="relative"
      :style="{ width: `${anchoTotal}px`, height: `${altoTotal}px` }"
    >
      <svg
        class="pointer-events-none absolute inset-0"
        :width="anchoTotal"
        :height="altoTotal"
      >
        <path
          v-for="e in edges"
          :key="e.key"
          :d="`M${e.x1},${e.y1} C${e.x1 + 40},${e.y1} ${e.x2 - 40},${e.y2} ${e.x2},${e.y2}`"
          fill="none"
          stroke="var(--color-line)"
          stroke-width="2"
        />
      </svg>

      <button
        v-for="n in lista"
        :key="n.id"
        class="absolute flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-left text-sm shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        :style="{ left: `${px(n).left}px`, top: `${px(n).top}px`, width: `${NODE_WIDTH}px` }"
        :class="[
          n.x === 0
            ? 'border-[var(--color-ink)] bg-[var(--color-ink)] font-semibold text-[var(--color-parchment)]'
            : 'border-[var(--color-line)] bg-white text-[var(--color-ink)]',
          seleccionadoId === n.id && n.x !== 0 ? 'ring-2 ring-[var(--color-sage)]' : '',
        ]"
        @click="tocar(n)"
      >
        <span class="line-clamp-2 flex-1">{{ n.label }}</span>
        <span
          v-if="n.tieneHijosOcultos"
          class="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
          :class="n.x === 0 ? 'bg-white/20' : 'bg-[var(--color-parchment)] text-[var(--color-bronze)]'"
        >+{{ n.hijos.length }}</span>
      </button>
    </div>
  </div>
</template>
