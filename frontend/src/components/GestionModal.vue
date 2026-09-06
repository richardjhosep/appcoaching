<script setup lang="ts">
import { ref } from 'vue'
import AppModal from './AppModal.vue'

// Bitácora de seguimiento genérica — historial + nueva nota + próximo seguimiento. Extraído
// del modal de "Gestión de renovación" de empresas (DashboardView.vue) para reutilizarlo tal
// cual en la bitácora de Prospectos: misma mecánica (agregar, nunca editar/borrar), distinto
// dueño de los datos.
export interface EntradaGestion {
  id: string
  nota: string
  proximoSeguimiento: string | null
  createdAt: string
}

defineProps<{
  title: string
  historial: EntradaGestion[]
  cargando: boolean
  guardando: boolean
}>()

const emit = defineEmits<{
  guardar: [nota: string, proximoSeguimiento: string | undefined]
  close: []
}>()

const notaForm = ref('')
const proximoSeguimientoForm = ref('')

function guardar() {
  if (!notaForm.value.trim()) return
  emit('guardar', notaForm.value.trim(), proximoSeguimientoForm.value || undefined)
  notaForm.value = ''
  proximoSeguimientoForm.value = ''
}

function formatoFechaHora(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
}

// proximoSeguimiento es una fecha sin hora ('2026-10-01') — parsearla directo con `new Date()`
// la interpreta como medianoche UTC y, bajo el huso horario de Chile (negativo), se muestra
// un día antes. Se le agrega la hora local explícita para evitar ese corrimiento (mismo
// criterio que el resto de la app con fechas sin hora).
function formatoFechaSolo(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
</script>

<template>
  <AppModal
    :title="title"
    @close="emit('close')"
  >
    <div class="space-y-4">
      <div>
        <p class="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">
          Historial
        </p>
        <p
          v-if="cargando"
          class="text-sm text-[var(--color-ink)]/60"
        >
          Cargando…
        </p>
        <p
          v-else-if="historial.length === 0"
          class="text-sm text-[var(--color-ink)]/60"
        >
          Todavía no hay gestión registrada.
        </p>
        <ul
          v-else
          class="max-h-56 space-y-2 overflow-y-auto text-sm"
        >
          <li
            v-for="g in historial"
            :key="g.id"
            class="rounded-lg border border-[var(--color-line)]/60 px-3 py-2"
          >
            <p class="text-xs text-[var(--color-ink)]/50">
              {{ formatoFechaHora(g.createdAt) }}
              <template v-if="g.proximoSeguimiento">
                · Próximo seguimiento: {{ formatoFechaSolo(g.proximoSeguimiento) }}
              </template>
            </p>
            <p>{{ g.nota }}</p>
          </li>
        </ul>
      </div>

      <div class="border-t border-[var(--color-line)] pt-4">
        <p class="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">
          Nueva gestión
        </p>
        <textarea
          v-model="notaForm"
          rows="3"
          placeholder="¿Qué se conversó? ¿En qué quedó?"
          class="mb-2 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm focus:border-[var(--color-sage)] focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)]/30"
        />
        <label class="mb-3 block text-xs text-[var(--color-ink)]/60">
          Próximo seguimiento (opcional)
          <input
            v-model="proximoSeguimientoForm"
            type="date"
            class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm focus:border-[var(--color-sage)] focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)]/30"
          >
        </label>
        <button
          type="button"
          class="w-full rounded-lg bg-[var(--color-ink)] px-3 py-2 text-sm text-[var(--color-parchment)] disabled:opacity-50"
          :disabled="guardando || !notaForm.trim()"
          @click="guardar"
        >
          {{ guardando ? 'Guardando…' : 'Registrar gestión' }}
        </button>
      </div>
    </div>
  </AppModal>
</template>
