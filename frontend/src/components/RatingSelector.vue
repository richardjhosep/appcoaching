<script setup lang="ts">
// Selector de calificación 1..max con botones (reemplaza <input type="number">): blanco
// táctil de 44px, `aria-pressed` por botón y grupo etiquetado. Volver a pulsar el valor
// elegido lo deja sin valor (null).
const props = defineProps<{
  modelValue: number | null
  max: number
  label: string
  invalid?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [number | null] }>()

function elegir(valor: number) {
  emit('update:modelValue', props.modelValue === valor ? null : valor)
}
</script>

<template>
  <div
    role="group"
    :aria-label="label"
    class="flex flex-wrap gap-1.5"
  >
    <button
      v-for="valor in max"
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
</template>
