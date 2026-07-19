<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '../../components/AppShell.vue'
import { getResumenNegocio, getAlertas, type ResumenNegocio, type Alertas } from '../../api/negocio'
import { listPlanes, type PlanDesarrollo } from '../../api/planesDesarrollo'
import { getSolicitudes, type SolicitudProceso } from '../../api/satisfaccion'
import { listCoachees } from '../../api/coachees'

const router = useRouter()
const loading = ref(true)
const resumen = ref<ResumenNegocio | null>(null)
const alertas = ref<Alertas | null>(null)
const planesPendientes = ref<PlanDesarrollo[]>([])
const solicitudesPendientes = ref<SolicitudProceso[]>([])
const sinCoacheesAun = ref(false)

type Tab = 'planes' | 'solicitudes' | 'vencer'
const tab = ref<Tab>('planes')

const formatoCLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

async function load() {
  loading.value = true
  const [r, a, planes, solicitudes, coachees] = await Promise.all([
    getResumenNegocio(),
    getAlertas(),
    listPlanes('pendiente_aprobacion'),
    getSolicitudes('pendiente'),
    listCoachees(),
  ])
  resumen.value = r
  alertas.value = a
  planesPendientes.value = planes
  solicitudesPendientes.value = solicitudes
  sinCoacheesAun.value = coachees.length === 0
  loading.value = false
}

onMounted(load)

function verPlan(coacheeId: string) {
  void router.push({ name: 'coach-plan-detail', params: { coacheeId } })
}

function verSeguimiento(coacheeId: string) {
  void router.push({ name: 'coach-coachee-seguimiento', params: { coacheeId } })
}
</script>

<template>
  <AppShell>
    <div class="mb-5">
      <h1 class="font-[family-name:var(--font-heading)] text-xl font-semibold">
        Dashboard
      </h1>
      <p class="text-sm text-[var(--color-ink)]/60">
        Vista general de tu práctica de coaching.
      </p>
    </div>

    <div
      v-if="loading"
      class="text-sm text-[var(--color-ink)]/60"
    >
      Cargando…
    </div>
    <div
      v-else-if="sinCoacheesAun"
      class="rounded-2xl border border-[var(--color-sage)] bg-[var(--color-sage)]/10 p-4 text-sm"
    >
      <p class="mb-2 font-medium">
        Todavía no tienes ningún coachee.
      </p>
      <p class="mb-3 text-[var(--color-ink)]/70">
        Crea tu primera empresa y coachee desde Administración para empezar a usar la plataforma.
      </p>
      <RouterLink
        to="/coach/administracion"
        class="inline-block rounded-lg bg-[var(--color-ink)] px-3 py-2 text-xs text-[var(--color-parchment)]"
      >
        Ir a Administración
      </RouterLink>
    </div>
    <div
      v-else-if="resumen && alertas"
      class="space-y-5"
    >
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
          <p class="text-xs text-[var(--color-ink)]/60">
            Coachees activos
          </p>
          <p class="font-[family-name:var(--font-mono)] text-2xl">
            {{ resumen.coacheesActivos }}
          </p>
        </div>
        <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
          <p class="text-xs text-[var(--color-ink)]/60">
            Planes pendientes
          </p>
          <p class="font-[family-name:var(--font-mono)] text-2xl text-[var(--color-sage)]">
            {{ planesPendientes.length }}
          </p>
        </div>
        <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
          <p class="text-xs text-[var(--color-ink)]/60">
            Ingreso del período
          </p>
          <p class="font-[family-name:var(--font-mono)] text-2xl">
            {{ formatoCLP.format(resumen.ingresoDelPeriodoTotal) }}
          </p>
        </div>
        <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
          <p class="text-xs text-[var(--color-ink)]/60">
            Satisfacción promedio
          </p>
          <p class="font-[family-name:var(--font-mono)] text-2xl">
            {{ resumen.satisfaccionPromedio !== null ? `${resumen.satisfaccionPromedio} ★` : '—' }}
          </p>
        </div>
      </div>

      <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <div class="mb-3 flex gap-1 border-b border-[var(--color-line)]">
          <button
            class="border-b-2 px-3 py-2 text-sm"
            :class="tab === 'planes' ? 'border-[var(--color-sage)] font-medium text-[var(--color-sage)]' : 'border-transparent text-[var(--color-ink)]/60'"
            @click="tab = 'planes'"
          >
            Planes pendientes ({{ planesPendientes.length }})
          </button>
          <button
            class="border-b-2 px-3 py-2 text-sm"
            :class="tab === 'solicitudes' ? 'border-[var(--color-sage)] font-medium text-[var(--color-sage)]' : 'border-transparent text-[var(--color-ink)]/60'"
            @click="tab = 'solicitudes'"
          >
            Solicitudes comerciales ({{ solicitudesPendientes.length }})
          </button>
          <button
            class="border-b-2 px-3 py-2 text-sm"
            :class="tab === 'vencer' ? 'border-[var(--color-sage)] font-medium text-[var(--color-sage)]' : 'border-transparent text-[var(--color-ink)]/60'"
            @click="tab = 'vencer'"
          >
            Ciclos por vencer ({{ alertas.ciclosPorVencer.length }})
          </button>
        </div>

        <div v-if="tab === 'planes'">
          <p
            v-if="planesPendientes.length === 0"
            class="text-sm text-[var(--color-ink)]/60"
          >
            No hay planes pendientes de aprobación.
          </p>
          <ul
            v-else
            class="space-y-1 text-sm"
          >
            <li
              v-for="p in planesPendientes"
              :key="p.id"
              class="cursor-pointer rounded-lg px-2 py-1.5 hover:bg-[var(--color-parchment)]/40"
              @click="verPlan(p.coacheeId)"
            >
              {{ p.coachee?.nombre ?? p.coacheeId }}
            </li>
          </ul>
        </div>

        <div v-else-if="tab === 'solicitudes'">
          <p
            v-if="solicitudesPendientes.length === 0"
            class="text-sm text-[var(--color-ink)]/60"
          >
            No hay solicitudes de nuevos procesos pendientes.
          </p>
          <ul
            v-else
            class="space-y-1 text-sm"
          >
            <li
              v-for="s in solicitudesPendientes"
              :key="s.id"
            >
              {{ s.nombreSugerido }}
              <span
                v-if="s.empresa"
                class="text-[var(--color-ink)]/60"
              >— {{ s.empresa.nombre }}</span>
            </li>
          </ul>
        </div>

        <div v-else>
          <p
            v-if="alertas.ciclosPorVencer.length === 0"
            class="text-sm text-[var(--color-ink)]/60"
          >
            Ningún ciclo por vencer.
          </p>
          <ul
            v-else
            class="space-y-1 text-sm"
          >
            <li
              v-for="c in alertas.ciclosPorVencer"
              :key="c.coacheeId"
              class="cursor-pointer rounded-lg px-2 py-1.5 hover:bg-[var(--color-parchment)]/40"
              @click="verSeguimiento(c.coacheeId)"
            >
              {{ c.nombre }} ({{ c.sesionesRestantes }} sesiones restantes)
            </li>
          </ul>
        </div>
      </div>
    </div>
  </AppShell>
</template>
