<script setup lang="ts">
import { computed } from 'vue'
import type { Recurso } from '../api/recursos'
import { tipoIconoDe, type TipoIcono } from '../lib/tipoRecurso'

const props = defineProps<{ recurso: Recurso; size?: 'xs' | 'sm' | 'lg' }>()

const tipo = computed(() => tipoIconoDe(props.recurso))

const estilos: Record<TipoIcono, { bg: string; fg: string }> = {
  pdf: { bg: 'color-mix(in srgb, var(--color-danger) 15%, white)', fg: 'var(--color-danger)' },
  word: { bg: 'color-mix(in srgb, var(--color-saltup) 15%, white)', fg: 'var(--color-saltup)' },
  excel: { bg: 'color-mix(in srgb, var(--color-sage) 15%, white)', fg: 'var(--color-sage)' },
  video: { bg: 'color-mix(in srgb, var(--color-danger) 15%, white)', fg: 'var(--color-danger)' },
  link: { bg: 'color-mix(in srgb, var(--color-saltup) 15%, white)', fg: 'var(--color-saltup)' },
  archivo: { bg: 'var(--color-parchment)', fg: 'var(--color-ink)' },
}

const etiqueta: Record<TipoIcono, string> = {
  pdf: 'PDF',
  word: 'Word',
  excel: 'Excel',
  video: 'Video',
  link: 'Link',
  archivo: 'Archivo',
}
</script>

<template>
  <div
    class="flex shrink-0 items-center justify-center"
    :class="{
      'h-14 w-14 rounded-xl': size === 'lg',
      'h-10 w-10 rounded-xl': size === 'sm' || !size,
      'h-7 w-7 rounded-lg': size === 'xs',
    }"
    :style="{ backgroundColor: estilos[tipo].bg, color: estilos[tipo].fg }"
    :title="etiqueta[tipo]"
  >
    <svg
      :width="size === 'lg' ? 26 : size === 'xs' ? 13 : 18"
      :height="size === 'lg' ? 26 : size === 'xs' ? 13 : 18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <template v-if="tipo === 'pdf' || tipo === 'word' || tipo === 'excel' || tipo === 'archivo'">
        <path d="M6 3h9l4 4v14H6z" /><path d="M15 3v4h4" />
        <template v-if="tipo === 'excel'">
          <path d="M9.5 13l5 5M14.5 13l-5 5" />
        </template>
        <template v-else-if="tipo === 'word'">
          <path d="M8.5 13l1.3 5 1.7-4 1.7 4 1.3-5" />
        </template>
        <template v-else-if="tipo === 'pdf'">
          <path d="M8 17v-4h1.5a1.5 1.5 0 0 1 0 3H8" /><path d="M13 17v-4h1.8M13 15h1.5" /><path d="M17.5 13v4M17.5 15h1" />
        </template>
      </template>
      <template v-else-if="tipo === 'video'">
        <rect
          x="2.5"
          y="5"
          width="15"
          height="14"
          rx="2.5"
        /><path d="M17.5 10l4-2.5v9l-4-2.5z" />
      </template>
      <template v-else-if="tipo === 'link'">
        <path d="M9.5 14.5l5-5" />
        <path d="M11 8.5l1-1a3 3 0 0 1 4.5 4L15 13" />
        <path d="M13 15.5l-1 1a3 3 0 0 1-4.5-4L9 11" />
      </template>
    </svg>
  </div>
</template>
