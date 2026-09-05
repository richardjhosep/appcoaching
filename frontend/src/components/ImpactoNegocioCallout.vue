<script setup lang="ts">
import NavIcon from './NavIcon.vue'

// Dato destacado a propósito: es lo único de todo el ciclo que la empresa realmente necesita
// para justificar la inversión ante su propia gerencia, así que no compite por espacio con el
// resto de los datos — vive en su propio bloque, con su propio ícono y color de acento
// (spark, el mismo tono "premium" que ya usa el certificado), reutilizado tanto en la grilla
// de coachees como en el historial de ciclos para no duplicar el marcado.
defineProps<{ impacto: string | null }>()
</script>

<template>
  <div
    class="flex items-start gap-3 rounded-xl border-l-4 p-3"
    :style="{
      borderLeftColor: 'var(--color-spark)',
      backgroundColor: 'color-mix(in srgb, var(--color-spark) 6%, white)',
    }"
  >
    <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-spark)]/10 text-[var(--color-spark)]">
      <NavIcon
        name="impacto"
        :size="16"
      />
    </div>
    <div class="min-w-0 flex-1">
      <p class="text-xs font-semibold uppercase tracking-wide text-[var(--color-spark)]">
        Impacto en el negocio
      </p>
      <p
        v-if="impacto"
        class="mt-0.5 text-sm text-[var(--color-ink)]"
      >
        {{ impacto }}
      </p>
      <p
        v-else
        class="mt-0.5 text-sm italic text-[var(--color-ink)]/40"
      >
        Sin registrar todavía
      </p>
    </div>
  </div>
</template>
