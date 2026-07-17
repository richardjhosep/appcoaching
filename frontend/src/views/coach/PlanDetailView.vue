<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppShell from '../../components/AppShell.vue'
import {
  getPlanByCoachee,
  aprobarPlan,
  solicitarCambios,
  type PlanDesarrollo,
} from '../../api/planesDesarrollo'
import { ApiError } from '../../api/client'

const props = defineProps<{ coacheeId: string }>()

const plan = ref<PlanDesarrollo | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const comentario = ref('')
const acting = ref(false)

const estadoLabel: Record<string, string> = {
  sin_enviar: 'Sin enviar',
  pendiente_aprobacion: 'Pendiente de aprobación',
  aprobado: 'Aprobado',
  cambios_solicitados: 'Cambios solicitados',
}

async function load() {
  loading.value = true
  plan.value = await getPlanByCoachee(props.coacheeId)
  loading.value = false
}

onMounted(load)

async function aprobar() {
  acting.value = true
  error.value = null
  try {
    plan.value = await aprobarPlan(props.coacheeId)
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo aprobar.'
  } finally {
    acting.value = false
  }
}

async function enviarSolicitudCambios() {
  if (!comentario.value.trim()) return
  acting.value = true
  error.value = null
  try {
    plan.value = await solicitarCambios(props.coacheeId, comentario.value.trim())
    comentario.value = ''
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo enviar el comentario.'
  } finally {
    acting.value = false
  }
}
</script>

<template>
  <AppShell>
    <div
      v-if="loading"
      class="text-sm text-[var(--color-ink)]/60"
    >
      Cargando…
    </div>
    <div v-else-if="plan">
      <div class="mb-1 flex items-center justify-between">
        <h1 class="font-[family-name:var(--font-heading)] text-xl font-semibold">
          {{ plan.coachee?.nombre ?? 'Plan de desarrollo' }}
        </h1>
        <RouterLink
          :to="{ name: 'coach-coachee-seguimiento', params: { coacheeId: props.coacheeId } }"
          class="text-sm text-[var(--color-sage)] underline"
        >
          Ver seguimiento
        </RouterLink>
      </div>
      <p class="mb-4 text-sm text-[var(--color-ink)]/70">
        Estado:
        <span class="font-[family-name:var(--font-mono)] text-[var(--color-sage)]">
          {{ estadoLabel[plan.estado] }}
        </span>
      </p>
      <p
        v-if="error"
        class="mb-3 text-sm text-[var(--color-bronze)]"
      >
        {{ error }}
      </p>

      <div class="mb-4 space-y-3 rounded-2xl border border-[var(--color-line)] bg-white p-4 text-sm">
        <p><strong>Nivel actual:</strong> {{ plan.nivelActual ?? '—' }}</p>
        <p><strong>Nivel objetivo:</strong> {{ plan.nivelObjetivo ?? '—' }}</p>
        <p><strong>Plazo:</strong> {{ plan.plazo ?? '—' }}</p>
        <p><strong>Estado actual:</strong> {{ plan.descripcionEstadoActual ?? '—' }}</p>
        <p><strong>Objetivo general:</strong> {{ plan.objetivoGeneral ?? '—' }}</p>
        <div>
          <strong>Objetivos específicos:</strong>
          <ul class="ml-4 list-disc">
            <li
              v-for="o in plan.objetivos"
              :key="o.id"
            >
              {{ o.descripcion }}
            </li>
          </ul>
        </div>
      </div>

      <div class="mb-4 space-y-3 rounded-2xl border border-[var(--color-line)] bg-white p-4 text-sm">
        <p><strong>Hábito — Cuándo:</strong> {{ plan.habitoCuando ?? '—' }}</p>
        <p><strong>En vez de:</strong> {{ plan.habitoEnVezDe ?? '—' }}</p>
        <p><strong>Voy a:</strong> {{ plan.habitoVoyA ?? '—' }}</p>
        <div>
          <strong>Plan de ejecución:</strong>
          <ul class="ml-4 list-disc">
            <li
              v-for="a in plan.actividades"
              :key="a.id"
            >
              {{ a.actividad }} — {{ a.estado }}
            </li>
          </ul>
        </div>
      </div>

      <div
        v-if="plan.estado === 'pendiente_aprobacion'"
        class="rounded-2xl border border-[var(--color-line)] bg-white p-4"
      >
        <h2 class="mb-2 text-sm font-medium">
          Revisar plan
        </h2>
        <button
          class="mb-3 rounded-lg bg-[var(--color-sage)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          :disabled="acting"
          @click="aprobar"
        >
          Aprobar
        </button>
        <div class="flex gap-2">
          <input
            v-model="comentario"
            type="text"
            placeholder="Comentario para solicitar cambios"
            class="flex-1 rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
          >
          <button
            class="rounded-lg border border-[var(--color-bronze)] px-3 py-2 text-sm text-[var(--color-bronze)] disabled:opacity-60"
            :disabled="acting || !comentario.trim()"
            @click="enviarSolicitudCambios"
          >
            Solicitar cambios
          </button>
        </div>
      </div>
    </div>
  </AppShell>
</template>
