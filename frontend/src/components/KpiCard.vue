<script setup lang="ts">
import { computed } from 'vue'

// Tarjeta de indicador (etiqueta + cifra + ayuda opcional). `tone` colorea la cifra con la
// misma semántica que nivelProgreso. Reemplaza el bloque copiado en los dashboards/informes.
const props = withDefaults(defineProps<{
  label: string
  value: string | number
  hint?: string
  tone?: 'sage' | 'bronze' | 'danger' | 'neutral'
}>(), { hint: undefined, tone: 'neutral' })

const valueClass = computed(() => ({
  sage: 'text-[var(--color-sage)]',
  bronze: 'text-[var(--color-bronze)]',
  danger: 'text-[var(--color-danger)]',
  neutral: 'text-[var(--color-ink)]',
}[props.tone]))
</script>

<template>
  <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4 print:break-inside-avoid">
    <p class="text-xs text-[var(--color-muted)]">
      {{ label }}
    </p>
    <p
      class="mt-1 font-[family-name:var(--font-mono)] text-2xl font-semibold"
      :class="valueClass"
    >
      {{ value }}
    </p>
    <p
      v-if="hint"
      class="mt-1 text-xs text-[var(--color-subtle)]"
    >
      {{ hint }}
    </p>
  </div>
</template>
