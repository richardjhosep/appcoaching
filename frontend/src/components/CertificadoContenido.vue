<script setup lang="ts">
import type { ResultadoCiclo } from '../api/ciclos'
import { resultadoLabel } from '../lib/resultadoCiclo'

defineProps<{
  nombreCoachee: string
  objetivo: string
  resultado: ResultadoCiclo
  fechaApertura: string
  fechaCierre: string
}>()
</script>

<template>
  <div class="rounded-2xl border-4 border-double border-[var(--color-bronze)] bg-white p-10 text-center print:rounded-none print:border-2">
    <p class="mb-1 font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-[var(--color-spark)]">
      Coach Fernando Ramos
    </p>
    <h1 class="mb-6 font-[family-name:var(--font-heading)] text-2xl font-semibold">
      Certificado de Finalización de Proceso de Coaching
    </h1>
    <p class="mb-2 text-sm text-[var(--color-ink)]/70">
      Se certifica que
    </p>
    <p class="mb-6 font-[family-name:var(--font-heading)] text-xl font-semibold">
      {{ nombreCoachee }}
    </p>
    <p class="mb-1 text-sm text-[var(--color-ink)]/70">
      completó su proceso de coaching enfocado en
    </p>
    <p class="mb-6 text-sm font-medium">
      {{ objetivo }}
    </p>
    <p class="mb-1 text-sm text-[var(--color-ink)]/70">
      con resultado
    </p>
    <p class="mb-6 font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--color-sage)]">
      {{ resultadoLabel[resultado] }}
    </p>
    <p class="font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink)]/60">
      {{ new Date(fechaApertura).toLocaleDateString('es-CL') }}
      —
      {{ new Date(fechaCierre).toLocaleDateString('es-CL') }}
    </p>
  </div>
</template>
