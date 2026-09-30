<script setup lang="ts">
import { ref } from 'vue'

// Ayuda contextual colapsable, reusada en las 5 pestañas de Herramientas (antes "Estudiar")
// — el coach reportó que no entendía cómo crear cada una ni cómo se evalúan sus resultados.
// Colapsada por defecto para no ensuciar la pantalla una vez que el coach ya sabe usarla.
withDefaults(defineProps<{ titulo?: string }>(), { titulo: '¿Cómo funciona esto?' })

const abierto = ref(false)
</script>

<template>
  <div class="mb-4 rounded-2xl border border-[var(--color-saltup)]/20 bg-[var(--color-saltup)]/5">
    <button
      type="button"
      class="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-[var(--color-saltup)]"
      @click="abierto = !abierto"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        class="shrink-0"
      >
        <circle
          cx="12"
          cy="12"
          r="9"
        />
        <line
          x1="12"
          y1="16"
          x2="12"
          y2="11"
        />
        <line
          x1="12"
          y1="8"
          x2="12.01"
          y2="8"
        />
      </svg>
      <span class="flex-1">{{ titulo }}</span>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="shrink-0 transition-transform"
        :class="abierto ? 'rotate-180' : ''"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>
    <div
      v-if="abierto"
      class="space-y-1.5 border-t border-[var(--color-saltup)]/20 px-4 py-3 text-xs text-[var(--color-ink)]/70"
    >
      <slot />
    </div>
  </div>
</template>
