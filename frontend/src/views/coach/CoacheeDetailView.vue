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
import { useAuthStore } from '../../stores/auth'
import { notifyError } from '../../lib/notify'

const props = defineProps<{ coacheeId: string }>()

const route = useRoute()
const router = useRouter()

// "Ver como" (solo superadmin, decidido en el backend): entra al portal del coachee en
// solo lectura para ver todas sus opciones tal como él las ve.
const auth = useAuthStore()
const entrandoVerComo = ref(false)
async function verComo(userId: string) {
  entrandoVerComo.value = true
  try {
    await auth.iniciarVerComo(userId, route.fullPath)
    await router.push('/')
  } catch (err) {
    await notifyError('No se pudo entrar en modo "Ver como"', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  } finally {
    entrandoVerComo.value = false
  }
}

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
      <div class="mb-6 rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="flex items-start gap-3">
            <div
              class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-lg font-semibold text-[var(--color-on-primary)]"
              aria-hidden="true"
            >
              {{ iniciales(coachee.nombre) }}
            </div>
            <div>
              <h1 class="font-[family-name:var(--font-heading)] text-xl font-semibold">
                {{ coachee.nombre }}
              </h1>
              <p class="text-sm text-[var(--color-muted)]">
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
            <button
              v-if="auth.user?.superadmin && coachee.user?.id"
              type="button"
              class="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-saltup)] px-3 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              :disabled="entrandoVerComo"
              title="Abre el portal de este coachee tal como lo ve él (solo lectura)"
              @click="verComo(coachee.user.id)"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              ><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" /><circle
                cx="12"
                cy="12"
                r="3"
              /></svg>
              {{ entrandoVerComo ? 'Entrando…' : 'Ver como coachee' }}
            </button>
          </div>
        </div>

        <!-- El stepper es un componente compartido (también lo usa el coachee en su propio
             plan) que trae su propia tarjeta blanca con borde — se despoja de ese estilo acá
             vía selector de hijo directo para que se vea como una sola tarjeta con el bloque
             de identidad de arriba, sin tocar CicloStepper.vue (evita duplicar borde/sombra). -->
        <div class="mt-4 border-t border-[var(--color-line)] pt-4 [&>div]:rounded-none [&>div]:border-0 [&>div]:bg-transparent [&>div]:p-0 [&>div]:shadow-none">
          <CicloStepper
            :ciclo="cicloActual"
            :plan="plan"
          />
        </div>
      </div>

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
