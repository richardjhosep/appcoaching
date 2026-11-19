<script setup lang="ts">
import { computed } from 'vue'
// Selector de calificación 1..max con botones (reemplaza <input type="number">): blanco
// táctil de 44px, `aria-pressed` por botón y grupo etiquetado. Volver a pulsar el valor
// elegido lo deja sin valor (null). Se muestra de mayor a menor (max → 1) y, si se pasan
// `leyendas`, cada valor con leyenda explica su significado bajo los botones.
const props = defineProps<{
  modelValue: number | null
  max: number
  label: string
  invalid?: boolean
  leyendas?: Record<number, string>
}>()
const emit = defineEmits<{ 'update:modelValue': [number | null] }>()

const valores = computed(() => Array.from({ length: props.max }, (_, i) => props.max - i))
const leyendasOrdenadas = computed(() =>
  valores.value.filter((v) => props.leyendas?.[v]).map((v) => ({ valor: v, texto: props.leyendas![v]! })),
)

function elegir(valor: number) {
  emit('update:modelValue', props.modelValue === valor ? null : valor)
}
</script>

<template>
  <div>
    <div
    role="group"
    :aria-label="label"
    class="flex flex-wrap gap-1.5"
  >
    <button
      v-for="valor in valores"
      :key="valor"
      type="button"
      :aria-pressed="modelValue === valor"
      :aria-label="`${valor} de ${max}`"
      class="h-11 min-w-11 rounded-lg border text-sm font-medium transition-colors"
      :class="modelValue === valor
        ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-on-primary)]'
        : invalid
          ? 'border-[var(--color-danger)] hover:bg-[var(--color-parchment)]/60'
          : 'border-[var(--color-line)] hover:bg-[var(--color-parchment)]/60'"
      @click="elegir(valor)"
    >
      {{ valor }}
    </button>
  </div>
    <ul
      v-if="leyendasOrdenadas.length > 0"
      class="mt-1.5 space-y-0.5 text-xs text-[var(--color-muted)]"
    >
      <li
        v-for="l in leyendasOrdenadas"
        :key="l.valor"
      >
        <strong class="cifra">{{ l.valor }}</strong> = {{ l.texto }}
      </li>
    </ul>
  </div>
</template>
