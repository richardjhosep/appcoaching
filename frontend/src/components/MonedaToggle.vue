<script setup lang="ts">
import type { Moneda } from '../lib/moneda'
import { formatCLP, formatoFechaCorta } from '../lib/moneda'

defineProps<{
  modelValue: Moneda
  valorUf: number | null
  fecha: string | null
  desactualizado: boolean
  /** Si getUfHoy() falló por completo (nunca hubo ningún valor cacheado). */
  error?: string | null
}>()
defineEmits<{ 'update:modelValue': [Moneda] }>()
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <div class="inline-flex rounded-full border border-[var(--color-line)] p-0.5 text-xs">
      <button
        type="button"
        class="rounded-full px-3 py-1"
        :class="modelValue === 'clp' ? 'bg-[var(--color-ink)] text-[var(--color-parchment)]' : 'hover:bg-[var(--color-parchment)]/50'"
        @click="$emit('update:modelValue', 'clp')"
      >
        CLP
      </button>
      <button
        type="button"
        class="rounded-full px-3 py-1"
        :class="modelValue === 'uf' ? 'bg-[var(--color-ink)] text-[var(--color-parchment)]' : 'hover:bg-[var(--color-parchment)]/50'"
        @click="$emit('update:modelValue', 'uf')"
      >
        UF
      </button>
    </div>

    <p
      v-if="error"
      class="text-xs text-[var(--color-danger)]"
    >
      {{ error }}
    </p>
    <p
      v-else-if="valorUf !== null && fecha"
      class="text-xs text-[var(--color-muted)]"
    >
      UF {{ formatoFechaCorta(fecha) }}: {{ formatCLP(valorUf) }}
      <span
        v-if="desactualizado"
        class="text-[var(--color-bronze)]"
      >(no actualizado hoy)</span>
    </p>
  </div>
</template>
