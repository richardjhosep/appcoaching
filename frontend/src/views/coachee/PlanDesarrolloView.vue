<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import AppShell from '../../components/AppShell.vue'
import DefinicionTab from '../../components/plan-desarrollo/DefinicionTab.vue'
import HabitoEjecucionTab from '../../components/plan-desarrollo/HabitoEjecucionTab.vue'
import FormacionTab from '../../components/plan-desarrollo/FormacionTab.vue'
import { getOwnPlan, type PlanDesarrollo } from '../../api/planesDesarrollo'
import { listCompetencias, type Competencia } from '../../api/competencias'

const plan = ref<PlanDesarrollo | null>(null)
const competencias = ref<Competencia[]>([])
const loading = ref(true)
const tab = ref<'definicion' | 'habito' | 'formacion'>('definicion')

const isLocked = computed(() => plan.value?.estado === 'pendiente_aprobacion')

const tabs = [
  { id: 'definicion', label: 'Definición' },
  { id: 'habito', label: 'Hábito y ejecución' },
  { id: 'formacion', label: 'Formación' },
] as const

async function load() {
  loading.value = true
  const [p, c] = await Promise.all([getOwnPlan(), listCompetencias()])
  plan.value = p
  competencias.value = c
  loading.value = false
}

onMounted(load)

function handleUpdated(updated: PlanDesarrollo) {
  // Varias acciones (agregar un objetivo, guardar la definición, guardar hábito…)
  // disparan cada una su propio refetch/PATCH en paralelo. Si una respuesta más
  // vieja llega después de una más nueva, no debe pisarla: nos quedamos con la
  // que tenga el `updatedAt` más reciente.
  if (plan.value && new Date(updated.updatedAt) < new Date(plan.value.updatedAt)) {
    return
  }
  plan.value = updated
}

const estadoLabel: Record<string, string> = {
  sin_enviar: 'Sin enviar',
  pendiente_aprobacion: 'Pendiente de aprobación',
  aprobado: 'Aprobado',
  cambios_solicitados: 'Cambios solicitados',
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
      <h1 class="mb-1 font-[family-name:var(--font-heading)] text-xl font-semibold">
        Mi plan de desarrollo
      </h1>
      <p class="mb-4 text-sm text-[var(--color-ink)]/70">
        Estado:
        <span class="font-[family-name:var(--font-mono)] text-[var(--color-sage)]">
          {{ estadoLabel[plan.estado] }}
        </span>
      </p>
      <p
        v-if="plan.comentarioCoach"
        class="mb-4 rounded-lg border border-[var(--color-bronze)]/40 bg-[var(--color-bronze)]/10 p-3 text-sm"
      >
        <strong>Comentario del coach:</strong> {{ plan.comentarioCoach }}
      </p>

      <div class="mb-4 flex w-fit gap-1 rounded-full bg-[var(--color-parchment)] p-1">
        <button
          v-for="t in tabs"
          :key="t.id"
          class="rounded-full px-3.5 py-1.5 text-sm transition-colors"
          :class="
            tab === t.id
              ? 'bg-[var(--color-ink)] text-[var(--color-parchment)]'
              : 'text-[var(--color-ink)]/70 hover:text-[var(--color-ink)]'
          "
          @click="tab = t.id"
        >
          {{ t.label }}
        </button>
      </div>

      <DefinicionTab
        v-if="tab === 'definicion'"
        :plan="plan"
        :competencias="competencias"
        :locked="isLocked"
        @updated="handleUpdated"
      />
      <HabitoEjecucionTab
        v-else-if="tab === 'habito'"
        :plan="plan"
        @updated="handleUpdated"
      />
      <FormacionTab
        v-else
        :plan="plan"
        @updated="handleUpdated"
      />
    </div>
  </AppShell>
</template>
