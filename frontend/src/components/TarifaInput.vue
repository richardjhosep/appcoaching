<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Moneda } from '../lib/moneda'
import { clpAUf, formatCLP, formatUF, ufAClp } from '../lib/moneda'
import { getUfHoy } from '../api/indicadores'

const props = defineProps<{
  modelValue: number | null
  moneda: Moneda
  label: string
  error?: string | null
}>()
const emit = defineEmits<{
  'update:modelValue': [number | null]
  'update:moneda': [Moneda]
}>()

const valorUf = ref<number | null>(null)
onMounted(async () => {
  valorUf.value = await getUfHoy().then((v) => v.valorUf).catch(() => null)
})

// El equivalente se muestra siempre en la moneda contraria a la que el coach está
// tipeando — es la que no está viendo, y por eso la que necesita como referencia.
const glosa = computed(() => {
  if (props.modelValue === null || valorUf.value === null) return null
  return props.moneda === 'uf'
    ? `≈ ${formatCLP(ufAClp(props.modelValue, valorUf.value))}`
    : `≈ ${formatUF(clpAUf(props.modelValue, valorUf.value))}`
})
</script>

<template>
  <div>
    <label class="block text-sm">
      {{ label }}
      <div class="mt-1 flex gap-2">
        <input
          :value="modelValue"
          type="number"
          min="0"
          :step="moneda === 'uf' ? 0.01 : 1"
          class="w-full rounded-lg border px-3 py-2 text-sm"
          :class="error ? 'border-[var(--color-danger)]' : 'border-[var(--color-line)]'"
          @input="emit('update:modelValue', ($event.target as HTMLInputElement).value === '' ? null : Number(($event.target as HTMLInputElement).value))"
        >
        <select
          :value="moneda"
          class="w-24 shrink-0 rounded-lg border border-[var(--color-line)] px-2 py-2 text-sm"
          @change="emit('update:moneda', ($event.target as HTMLSelectElement).value as Moneda)"
        >
          <option value="clp">
            CLP
          </option>
          <option value="uf">
            UF
          </option>
        </select>
      </div>
    </label>
    <span
      v-if="error"
      class="mt-1 block text-xs text-[var(--color-danger)]"
    >{{ error }}</span>
    <span
      v-else-if="glosa"
      class="mt-1 block text-xs text-[var(--color-ink)]/50"
    >{{ glosa }} al valor UF de hoy</span>
  </div>
</template>
