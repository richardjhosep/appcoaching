<script setup lang="ts">
defineProps<{
  nombreCoachee: string
  objetivo: string
  competencia: string | null
  fechaInicio: string
  avance: number | null
  proximaSesion: string | null
  actividadesPendientes: number
  actividadesCompletadas: number
  logrosRecientes: { fecha: string; descripcion: string }[]
}>()

const fechaGenerado = new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
</script>

<template>
  <div class="rounded-2xl border border-[var(--color-line)] bg-white p-8 print:rounded-none print:border-2">
    <p class="mb-1 font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-[var(--color-spark)]">
      Coach Fernando Ramos
    </p>
    <h1 class="mb-1 font-[family-name:var(--font-heading)] text-2xl font-semibold">
      Resumen de proceso de coaching
    </h1>
    <p class="mb-6 text-sm text-[var(--color-ink)]/60">
      {{ nombreCoachee }} · generado el {{ fechaGenerado }}
    </p>

    <div class="mb-6 grid gap-4 border-t border-[var(--color-line)] pt-4 sm:grid-cols-2">
      <div>
        <p class="text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/45">
          Objetivo del proceso
        </p>
        <p class="text-sm">
          {{ objetivo }}
        </p>
      </div>
      <div v-if="competencia">
        <p class="text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/45">
          Competencia
        </p>
        <p class="text-sm">
          {{ competencia }}
        </p>
      </div>
      <div>
        <p class="text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/45">
          Inicio del proceso
        </p>
        <p class="text-sm">
          {{ new Date(fechaInicio).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }) }}
        </p>
      </div>
      <div>
        <p class="text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/45">
          Próxima sesión
        </p>
        <p class="text-sm">
          {{ proximaSesion ? new Date(proximaSesion).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' }) : 'Sin sesión agendada' }}
        </p>
      </div>
    </div>

    <div class="mb-6 border-t border-[var(--color-line)] pt-4">
      <p class="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/45">
        Avance general
      </p>
      <p class="font-[family-name:var(--font-mono)] text-2xl font-semibold">
        {{ avance !== null ? `${avance}%` : 'Sin autoevaluar aún' }}
      </p>
    </div>

    <div class="mb-6 border-t border-[var(--color-line)] pt-4">
      <p class="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/45">
        Plan de ejecución
      </p>
      <p class="text-sm">
        {{ actividadesCompletadas }} actividad{{ actividadesCompletadas === 1 ? '' : 'es' }} completada{{ actividadesCompletadas === 1 ? '' : 's' }}
        · {{ actividadesPendientes }} pendiente{{ actividadesPendientes === 1 ? '' : 's' }}
      </p>
    </div>

    <div
      v-if="logrosRecientes.length > 0"
      class="border-t border-[var(--color-line)] pt-4"
    >
      <p class="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/45">
        Logros recientes
      </p>
      <ul class="space-y-1 text-sm">
        <li
          v-for="(logro, i) in logrosRecientes"
          :key="i"
        >
          <span class="font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink)]/50">{{ logro.fecha }}</span>
          — {{ logro.descripcion }}
        </li>
      </ul>
    </div>
  </div>
</template>
