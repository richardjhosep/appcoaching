<script setup lang="ts">
import { computed } from 'vue'
import { nivelProgreso, coloresNivel } from '../lib/nivelProgreso'

// Escala 1-10 en 10 tramos con el valor marcado: muestra DÓNDE está el valor dentro del rango
// posible, algo que un punto suelto en un gráfico de líneas no comunica.
const props = defineProps<{ valor: number }>()

const colores = computed(() => coloresNivel[nivelProgreso(props.valor * 10)])
</script>

<template>
  <div
    class="w-full"
    role="img"
    :aria-label="`${valor} sobre 10`"
  >
    <div class="flex gap-1">
      <span
        v-for="n in 10"
        :key="n"
        class="h-3 flex-1 rounded-full"
        :class="n === valor ? 'ring-2 ring-offset-2 ring-offset-white' : ''"
        :style="{
          backgroundColor: n <= valor ? colores.fuerte : colores.suave,
          '--tw-ring-color': colores.fuerte,
        }"
      />
    </div>
    <div class="mt-1.5 flex justify-between text-xs text-[var(--color-muted)]">
      <span>1</span>
      <span>10 · Objetivo</span>
    </div>
  </div>
</template>
