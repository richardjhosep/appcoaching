<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppShell from '../../components/AppShell.vue'
import HistorialCiclos from '../../components/HistorialCiclos.vue'
import { getCoachee, type Coachee } from '../../api/coachees'
import { getCicloActualDeCoachee, getCiclosDeCoachee, type Ciclo } from '../../api/ciclos'

const props = defineProps<{ coacheeId: string }>()

const loading = ref(true)
const coachee = ref<Coachee | null>(null)
const cicloActual = ref<Ciclo | null>(null)
const historial = ref<Ciclo[]>([])

const ciclosCerrados = computed(() => historial.value.filter((c) => c.fechaCierre))

onMounted(async () => {
  const [c, actual, todos] = await Promise.all([
    getCoachee(props.coacheeId),
    getCicloActualDeCoachee(props.coacheeId),
    getCiclosDeCoachee(props.coacheeId),
  ])
  coachee.value = c
  cicloActual.value = actual
  historial.value = todos
  loading.value = false
})
</script>

<template>
  <AppShell>
    <div
      v-if="loading"
      class="text-sm text-[var(--color-ink)]/60"
    >
      Cargando…
    </div>
    <div v-else>
      <h1 class="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold">
        Proceso de {{ coachee?.nombre }}
      </h1>

      <div
        v-if="cicloActual"
        class="mb-4 rounded-2xl border border-[var(--color-line)] bg-white p-4"
      >
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-sm font-medium">
            Ciclo en curso
          </h2>
          <span
            v-if="cicloActual.alertaPorVencer"
            class="rounded-full bg-[var(--color-bronze)]/20 px-2 py-0.5 text-xs text-[var(--color-bronze)]"
          >
            Ciclo por vencer
          </span>
        </div>
        <p class="mb-2 text-sm">
          Sesiones: {{ cicloActual.sesionesRealizadas }} de {{ cicloActual.totalSesiones }}
        </p>
        <p class="text-sm">
          <strong>Resumen de reunión inicial:</strong>
          {{ cicloActual.resumenReunionInicial ?? 'Aún no redactado por el coach.' }}
        </p>
      </div>
      <p
        v-else
        class="mb-4 text-sm text-[var(--color-ink)]/60"
      >
        Este coachee no tiene un ciclo abierto actualmente.
      </p>

      <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <h2 class="mb-3 text-sm font-medium">
          Historial de ciclos
        </h2>
        <HistorialCiclos :ciclos="ciclosCerrados" />
      </div>
    </div>
  </AppShell>
</template>
