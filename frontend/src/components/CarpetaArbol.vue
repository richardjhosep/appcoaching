<script setup lang="ts">
import type { CarpetaNode } from '../lib/carpetaArbol'

withDefaults(
  defineProps<{
    nodos: CarpetaNode[]
    seleccionadaId: string | null
    profundidad?: number
  }>(),
  { profundidad: 0 },
)

const emit = defineEmits<{ select: [id: string] }>()
const expandidas = defineModel<Set<string>>('expandidas', { required: true })

function toggle(id: string, event: Event) {
  event.stopPropagation()
  const next = new Set(expandidas.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandidas.value = next
}
</script>

<template>
  <ul class="space-y-0.5">
    <li
      v-for="n in nodos"
      :key="n.id"
    >
      <div
        class="flex cursor-pointer items-center gap-1.5 rounded-lg py-1.5 pr-2 text-sm transition-colors"
        :class="n.id === seleccionadaId
          ? 'bg-[var(--color-ink)] text-[var(--color-parchment)]'
          : 'hover:bg-[var(--color-parchment)]/70'"
        :style="{ paddingLeft: `${8 + profundidad * 16}px` }"
        @click="emit('select', n.id)"
      >
        <button
          v-if="n.hijos.length"
          type="button"
          class="shrink-0 rounded p-0.5"
          :class="n.id === seleccionadaId ? 'text-[var(--color-parchment)]/80' : 'text-[var(--color-ink)]/40'"
          :aria-label="expandidas.has(n.id) ? 'Contraer' : 'Expandir'"
          @click="toggle(n.id, $event)"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="transition-transform"
            :class="{ 'rotate-90': expandidas.has(n.id) }"
          ><path d="M9 5l7 7-7 7" /></svg>
        </button>
        <span
          v-else
          class="w-3.5 shrink-0"
        />
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="shrink-0 opacity-70"
        ><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
        <span class="min-w-0 flex-1 truncate">{{ n.nombre }}</span>
        <svg
          v-if="!n.publica"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="shrink-0 opacity-50"
          aria-label="Privada"
        ><rect
          x="5"
          y="11"
          width="14"
          height="9"
          rx="2"
        /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
      </div>
      <CarpetaArbol
        v-if="n.hijos.length && expandidas.has(n.id)"
        v-model:expandidas="expandidas"
        :nodos="n.hijos"
        :seleccionada-id="seleccionadaId"
        :profundidad="profundidad + 1"
        @select="emit('select', $event)"
      />
    </li>
  </ul>
</template>
