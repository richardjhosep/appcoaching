<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '../../components/AppShell.vue'
import BackLink from '../../components/BackLink.vue'
import CicloStepper from '../../components/CicloStepper.vue'
import NavIcon from '../../components/NavIcon.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import TabBar from '../../components/TabBar.vue'
import PerfilTab from './coachee-detail/PerfilTab.vue'
import PlanTab from './coachee-detail/PlanTab.vue'
import SesionesTab from './coachee-detail/SesionesTab.vue'
import CicloTab from './coachee-detail/CicloTab.vue'
import { getCoachee, type Coachee } from '../../api/coachees'
import { getCicloActualDeCoachee, type Ciclo } from '../../api/ciclos'
import { getPlanByCoachee, type EstadoPlan, type PlanDesarrollo } from '../../api/planesDesarrollo'
import { ApiError } from '../../api/client'
import { iniciales } from '../../lib/avatar'

const props = defineProps<{ coacheeId: string }>()

const route = useRoute()
const router = useRouter()

const coachee = ref<Coachee | null>(null)
const cicloActual = ref<Ciclo | null>(null)
const plan = ref<PlanDesarrollo | null>(null)
const loading = ref(true)

type TabKey = 'perfil' | 'plan' | 'sesiones' | 'ciclo'
const tabs: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: 'perfil', label: 'Perfil', icon: 'contacto' },
  { key: 'plan', label: 'Plan', icon: 'planes' },
  { key: 'sesiones', label: 'Sesiones', icon: 'sesiones' },
  { key: 'ciclo', label: 'Ciclo e informes', icon: 'habito' },
]

const activeTab = computed<TabKey>(() => {
  const q = route.query.tab
  return tabs.some((t) => t.key === q) ? (q as TabKey) : 'perfil'
})

function irATab(tab: TabKey) {
  void router.replace({ query: { ...route.query, tab } })
}

async function loadPlan() {
  try {
    plan.value = await getPlanByCoachee(props.coacheeId)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      plan.value = null
    } else {
      throw err
    }
  }
}

async function load() {
  loading.value = true
  const [c, ciclo] = await Promise.all([
    getCoachee(props.coacheeId),
    getCicloActualDeCoachee(props.coacheeId),
    loadPlan(),
  ])
  coachee.value = c
  cicloActual.value = ciclo
  loading.value = false
}

onMounted(load)
watch(() => props.coacheeId, load)

const planEstadoLabel: Record<EstadoPlan, string> = {
  sin_enviar: 'Plan sin enviar',
  pendiente_aprobacion: 'Plan por aprobar',
  aprobado: 'Plan aprobado',
  cambios_solicitados: 'Cambios solicitados al plan',
}
const planEstadoClase: Record<EstadoPlan, string> = {
  sin_enviar: 'bg-[var(--color-bronze)]/15 text-[var(--color-bronze)]',
  pendiente_aprobacion: 'bg-[var(--color-bronze)]/15 text-[var(--color-bronze)]',
  aprobado: 'bg-[var(--color-sage)]/15 text-[var(--color-sage)]',
  cambios_solicitados: 'bg-[var(--color-danger)]/15 text-[var(--color-danger)]',
}
</script>

<template>
  <AppShell>
    <div class="mb-4">
      <BackLink
        to="/coach/coachees"
        label="Volver a Coachees"
      />
    </div>

    <SkeletonBlock v-if="loading" />
    <template v-else-if="coachee">
      <div class="mb-4 rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="flex items-start gap-3">
            <div
              class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--color-ink)] text-lg font-semibold text-[var(--color-parchment)]"
              aria-hidden="true"
            >
              {{ iniciales(coachee.nombre) }}
            </div>
            <div>
              <h1 class="font-[family-name:var(--font-heading)] text-xl font-semibold">
                {{ coachee.nombre }}
              </h1>
              <p class="text-sm text-[var(--color-ink)]/60">
                {{ coachee.empresa?.nombre ?? 'Independiente' }}
              </p>
              <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--color-ink)]/70">
                <span class="flex items-center gap-1.5">
                  <NavIcon
                    name="correo"
                    :size="14"
                  />
                  {{ coachee.user?.email ?? '—' }}
                </span>
                <span class="flex items-center gap-1.5">
                  <NavIcon
                    name="telefono"
                    :size="14"
                  />
                  {{ coachee.telefono ?? '—' }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <span
              v-if="plan"
              class="rounded-full px-2.5 py-1 text-xs font-medium"
              :class="planEstadoClase[plan.estado]"
            >
              {{ planEstadoLabel[plan.estado] }}
            </span>
            <span
              class="rounded-full px-2.5 py-1 text-xs font-medium"
              :class="coachee.consentimientoInformado
                ? 'bg-[var(--color-sage)]/15 text-[var(--color-sage)]'
                : 'bg-[var(--color-danger)]/15 text-[var(--color-danger)]'"
            >
              {{ coachee.consentimientoInformado ? 'Consentimiento firmado' : 'Consentimiento pendiente' }}
            </span>
          </div>
        </div>
      </div>

      <CicloStepper
        class="mb-4"
        :ciclo="cicloActual"
        :plan="plan"
      />

      <TabBar
        class="mb-4"
        :tabs="tabs"
        :model-value="activeTab"
        @update:model-value="irATab"
      />

      <PerfilTab
        v-if="activeTab === 'perfil'"
        :coachee-id="props.coacheeId"
      />
      <PlanTab
        v-else-if="activeTab === 'plan'"
        :coachee-id="props.coacheeId"
        @plan-changed="plan = $event"
      />
      <SesionesTab
        v-else-if="activeTab === 'sesiones'"
        :coachee-id="props.coacheeId"
      />
      <CicloTab
        v-else-if="activeTab === 'ciclo'"
        :coachee-id="props.coacheeId"
        @ciclo-changed="cicloActual = $event"
      />
    </template>
  </AppShell>
</template>
