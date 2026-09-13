<script setup lang="ts">
import { ref } from 'vue'
import AppModal from './AppModal.vue'
import { reagendarSesion, type Sesion } from '../api/sesiones'
import { ApiError } from '../api/client'
import { aDatetimeLocal } from '../lib/dateRange'

const props = defineProps<{ sesion: Sesion }>()
const emit = defineEmits<{ close: []; reagendada: [Sesion] }>()

const nuevaFecha = ref(aDatetimeLocal(new Date(props.sesion.fechaHora)))
const link = ref(props.sesion.linkVideollamada ?? '')
const guardando = ref(false)
const error = ref<string | null>(null)

// Solo tiene sentido preguntar si esta sesión viene de "repetir semanalmente" — una
// sesión suelta no tiene "las futuras" a las que aplicar el mismo cambio.
const esDeSerie = !!props.sesion.recurrenciaId
const aplicarASerie = ref(false)

async function guardar() {
  if (!nuevaFecha.value) return
  error.value = null
  guardando.value = true
  try {
    const actualizada = await reagendarSesion(
      props.sesion.id,
      new Date(nuevaFecha.value).toISOString(),
      link.value || undefined,
      esDeSerie ? aplicarASerie.value : undefined,
    )
    emit('reagendada', actualizada)
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo reagendar la sesión.'
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <AppModal
    title="Reagendar sesión"
    @close="emit('close')"
  >
    <form
      class="space-y-4"
      @submit.prevent="guardar"
    >
      <p
        v-if="sesion.coachee?.nombre"
        class="text-sm text-[var(--color-ink)]/60"
      >
        {{ sesion.coachee.nombre }} — sesión actual del
        {{ new Date(sesion.fechaHora).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' }) }}
      </p>
      <p
        v-if="error"
        class="text-sm text-[var(--color-danger)]"
      >
        {{ error }}
      </p>
      <label class="block text-sm">
        Nueva fecha y hora
        <input
          v-model="nuevaFecha"
          type="datetime-local"
          required
          class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
        >
      </label>
      <label class="block text-sm">
        Link de videollamada (opcional)
        <input
          v-model="link"
          type="url"
          placeholder="https://…"
          class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
        >
      </label>
      <label
        v-if="esDeSerie"
        class="flex items-center gap-2 text-sm"
      >
        <input
          v-model="aplicarASerie"
          type="checkbox"
        >
        Aplicar el mismo cambio de horario a esta y las futuras sesiones de la serie
      </label>
      <div class="flex justify-end gap-2 pt-2">
        <button
          type="button"
          class="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm"
          @click="emit('close')"
        >
          Cancelar
        </button>
        <button
          type="submit"
          :disabled="guardando"
          class="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm text-[var(--color-parchment)] disabled:opacity-60"
        >
          {{ guardando ? 'Guardando…' : 'Reagendar' }}
        </button>
      </div>
    </form>
  </AppModal>
</template>
