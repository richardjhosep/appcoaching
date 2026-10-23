<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppShell from '../../components/AppShell.vue'
import CicloStepper from '../../components/CicloStepper.vue'
import DefinicionTab from '../../components/plan-desarrollo/DefinicionTab.vue'
import HabitoEjecucionTab from '../../components/plan-desarrollo/HabitoEjecucionTab.vue'
import FormacionTab from '../../components/plan-desarrollo/FormacionTab.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import ErrorState from '../../components/ErrorState.vue'
import TabBar from '../../components/TabBar.vue'
import { useCarga } from '../../lib/useCarga'
import { getOwnPlan, type PlanDesarrollo } from '../../api/planesDesarrollo'
import { listCompetenciasParaMiPlan, type Competencia } from '../../api/competencias'
import { getMiCicloActual, type Ciclo } from '../../api/ciclos'
import { getMisCompetenciasEmpresa } from '../../api/coachees'
import type { EmpresaCompetencia } from '../../api/empresas'

const plan = ref<PlanDesarrollo | null>(null)
const competencias = ref<Competencia[]>([])
const competenciasPrioritarias = ref<EmpresaCompetencia[]>([])
const cicloActual = ref<Ciclo | null>(null)
const tab = ref<'definicion' | 'habito' | 'formacion'>('definicion')

const tabs: Array<{ key: 'definicion' | 'habito' | 'formacion'; label: string }> = [
  { key: 'definicion', label: 'Definición' },
  { key: 'habito', label: 'Hábito y ejecución' },
  { key: 'formacion', label: 'Formación' },
]

const { loading, error, recargar } = useCarga(async () => {
  const [p, c, ciclo, cp] = await Promise.all([
    getOwnPlan(),
    listCompetenciasParaMiPlan(),
    getMiCicloActual(),
    getMisCompetenciasEmpresa(),
  ])
  plan.value = p
  // La competencia ya elegida se mantiene visible aunque haya salido de la lista de su empresa
  // (ej. el coach cambió las asignadas después), para que el selector no quede en blanco.
  competencias.value = p.competencia && !c.some((x) => x.id === p.competencia!.id)
    ? [...c, { id: p.competencia.id, nombre: p.competencia.nombre, definicion: '', niveles: [], empresaId: null }]
    : c
  cicloActual.value = ciclo
  competenciasPrioritarias.value = cp
})

onMounted(recargar)

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
</script>

<template>
  <AppShell>
    <SkeletonBlock v-if="loading" />
    <ErrorState
      v-else-if="error"
      :description="error"
      @retry="recargar"
    />
    <div v-else-if="plan">
      <h1 class="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold">
        Mi plan de desarrollo
      </h1>
      <CicloStepper
        class="mb-4"
        :ciclo="cicloActual"
        :plan="plan"
      />
      <p
        v-if="plan.comentarioCoach"
        class="mb-4 rounded-lg border border-[var(--color-bronze)]/40 bg-[var(--color-bronze)]/10 p-3 text-sm"
      >
        <strong>Comentario del coach:</strong> {{ plan.comentarioCoach }}
      </p>

      <TabBar
        v-model="tab"
        class="mb-4"
        scroll
        :tabs="tabs"
      />

      <DefinicionTab
        v-if="tab === 'definicion'"
        :plan="plan"
        :competencias="competencias"
        :competencias-prioritarias="competenciasPrioritarias"
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
      />
    </div>
  </AppShell>
</template>
