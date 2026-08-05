<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  atenderSolicitud,
  getSolicitudes,
  type SolicitudProceso,
} from '../../../api/satisfaccion'
import { getCiclosCerrados, type CicloCerrado, type ResultadoCiclo } from '../../../api/ciclos'
import {
  getResumenComercial,
  getProyeccionMensual,
  type ResumenComercial,
  type PeriodoComercial,
  type ProyeccionMes,
} from '../../../api/negocio'
import { ApiError } from '../../../api/client'
import ProyeccionIngresosChart from '../../../components/ProyeccionIngresosChart.vue'

const router = useRouter()

const loading = ref(true)
const solicitudesPendientes = ref<SolicitudProceso[]>([])
const ciclosCerrados = ref<CicloCerrado[]>([])
const error = ref<string | null>(null)
const atendiendo = ref<string | null>(null)

const proyeccionMensual = ref<ProyeccionMes[]>([])
const loadingProyeccion = ref(true)

// --- Resumen comercial por período (KPIs) ------------------------------------

const PERIODOS: PeriodoComercial[] = ['mes', 'semestre', 'anio']
const periodoLabel: Record<PeriodoComercial, string> = {
  mes: 'Mes actual',
  semestre: 'Semestre actual',
  anio: 'Año actual',
}
const RESULTADOS: ResultadoCiclo[] = ['logrado', 'medianamente_logrado', 'no_logrado']
const resultadoConfig: Record<ResultadoCiclo, { label: string; color: string; icono: 'check' | 'medio' | 'x' }> = {
  logrado: { label: 'Logrado', color: 'var(--color-sage)', icono: 'check' },
  medianamente_logrado: { label: 'Medianamente logrado', color: 'var(--color-bronze)', icono: 'medio' },
  no_logrado: { label: 'No logrado', color: 'var(--color-danger)', icono: 'x' },
}

const periodo = ref<PeriodoComercial>('mes')
const resumen = ref<ResumenComercial | null>(null)
const loadingResumen = ref(true)

const formatoCLP = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

const resultadosVisibles = computed(() =>
  RESULTADOS.filter((r) => (resumen.value?.procesosCerradosPorResultado[r] ?? 0) > 0),
)

function porcentajeResultado(count: number): number {
  const total = resumen.value?.procesosCerrados ?? 0
  return total === 0 ? 0 : Math.round((count / total) * 100)
}

async function loadResumen() {
  loadingResumen.value = true
  resumen.value = await getResumenComercial(periodo.value)
  loadingResumen.value = false
}

async function cambiarPeriodo(p: PeriodoComercial) {
  periodo.value = p
  await loadResumen()
}

async function load() {
  loading.value = true
  const [solicitudes, cerrados] = await Promise.all([
    getSolicitudes('pendiente'),
    getCiclosCerrados(),
  ])
  solicitudesPendientes.value = solicitudes
  ciclosCerrados.value = cerrados
  loading.value = false
}

async function loadProyeccion() {
  loadingProyeccion.value = true
  proyeccionMensual.value = await getProyeccionMensual()
  loadingProyeccion.value = false
}

onMounted(() => {
  void load()
  void loadResumen()
  void loadProyeccion()
})

async function marcarAtendida(id: string) {
  error.value = null
  atendiendo.value = id
  try {
    await atenderSolicitud(id)
    solicitudesPendientes.value = solicitudesPendientes.value.filter((s) => s.id !== id)
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo marcar la solicitud como atendida.'
  } finally {
    atendiendo.value = null
  }
}

function abrirNuevoProceso(coacheeId: string) {
  void router.push({ name: 'coach-coachee-detail', params: { coacheeId }, query: { tab: 'ciclo' } })
}
</script>

<template>
  <div
    v-if="loadingProyeccion"
    class="mb-4 text-sm text-[var(--color-ink)]/60"
  >
    Cargando proyección…
  </div>
  <ProyeccionIngresosChart
    v-else
    class="mb-4"
    :meses="proyeccionMensual"
  />

  <div class="mb-4 flex w-fit gap-1 rounded-full bg-[var(--color-parchment)] p-1">
    <button
      v-for="p in PERIODOS"
      :key="p"
      class="rounded-full px-3.5 py-1.5 text-sm transition-colors"
      :class="periodo === p ? 'bg-[var(--color-ink)] text-[var(--color-parchment)]' : 'text-[var(--color-ink)]/70'"
      @click="cambiarPeriodo(p)"
    >
      {{ periodoLabel[p] }}
    </button>
  </div>

  <div
    v-if="loadingResumen"
    class="mb-6 text-sm text-[var(--color-ink)]/60"
  >
    Cargando resumen…
  </div>
  <div
    v-else-if="resumen"
    class="mb-6 space-y-4"
  >
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <p class="text-xs text-[var(--color-ink)]/60">
          Ingreso del período
        </p>
        <p class="font-[family-name:var(--font-mono)] text-2xl text-[var(--color-sage)]">
          {{ formatoCLP.format(resumen.ingresoDelPeriodo) }}
        </p>
      </div>
      <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <p class="text-xs text-[var(--color-ink)]/60">
          Ingreso proyectado
        </p>
        <p class="font-[family-name:var(--font-mono)] text-2xl text-[var(--color-bronze)]">
          {{ formatoCLP.format(resumen.ingresoProyectado) }}
        </p>
      </div>
      <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <p class="text-xs text-[var(--color-ink)]/60">
          Horas realizadas
        </p>
        <p class="font-[family-name:var(--font-mono)] text-2xl">
          {{ resumen.horasRealizadas }}
        </p>
      </div>
      <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <p class="text-xs text-[var(--color-ink)]/60">
          Solicitudes nuevas
        </p>
        <p class="font-[family-name:var(--font-mono)] text-2xl">
          {{ resumen.solicitudesNuevas }}
        </p>
        <p class="text-xs text-[var(--color-ink)]/50">
          {{ resumen.solicitudesAtendidas }} atendidas · {{ resumen.solicitudesPendientes }} pendientes
        </p>
      </div>
      <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <p class="text-xs text-[var(--color-ink)]/60">
          Procesos iniciados
        </p>
        <p class="font-[family-name:var(--font-mono)] text-2xl">
          {{ resumen.procesosIniciados }}
        </p>
      </div>
      <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <p class="text-xs text-[var(--color-ink)]/60">
          Procesos cerrados
        </p>
        <p class="font-[family-name:var(--font-mono)] text-2xl">
          {{ resumen.procesosCerrados }}
        </p>
      </div>
      <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <p class="text-xs text-[var(--color-ink)]/60">
          Reagendamientos solicitados
        </p>
        <p class="font-[family-name:var(--font-mono)] text-2xl">
          {{ resumen.reagendamientosSolicitados }}
        </p>
      </div>
    </div>

    <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
      <h2 class="mb-3 text-sm font-medium">
        Resultado de procesos cerrados
      </h2>
      <p
        v-if="resumen.procesosCerrados === 0"
        class="text-sm text-[var(--color-ink)]/60"
      >
        Ningún proceso se cerró en este período.
      </p>
      <template v-else>
        <div class="mb-3 flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-[var(--color-parchment)]">
          <span
            v-for="r in resultadosVisibles"
            :key="r"
            :title="`${resultadoConfig[r].label}: ${resumen.procesosCerradosPorResultado[r]}`"
            class="h-full"
            :style="{
              width: `${porcentajeResultado(resumen.procesosCerradosPorResultado[r])}%`,
              backgroundColor: resultadoConfig[r].color,
            }"
          />
        </div>
        <div class="flex flex-wrap gap-x-5 gap-y-2 text-xs">
          <span
            v-for="r in RESULTADOS"
            :key="r"
            class="flex items-center gap-1.5"
            :style="{ color: resultadoConfig[r].color }"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="shrink-0"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
              />
              <path
                v-if="resultadoConfig[r].icono === 'check'"
                d="M8 12l3 3 5-6"
              />
              <path
                v-else-if="resultadoConfig[r].icono === 'medio'"
                d="M8 12h8"
              />
              <path
                v-else
                d="M9 9l6 6M15 9l-6 6"
              />
            </svg>
            {{ resultadoConfig[r].label }} ({{ resumen.procesosCerradosPorResultado[r] }})
          </span>
        </div>
      </template>
    </div>

    <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
      <h2 class="mb-1 text-sm font-medium">
        Proyección por coachee
      </h2>
      <p class="mb-3 text-xs text-[var(--color-ink)]/50">
        Quién aporta más este período, y cuánto de eso todavía depende de sesiones ya agendadas.
      </p>
      <p
        v-if="resumen.porCoachee.length === 0"
        class="text-sm text-[var(--color-ink)]/60"
      >
        Sin actividad de coachees en este período.
      </p>
      <div
        v-else
        class="overflow-x-auto"
      >
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="text-xs text-[var(--color-ink)]/60">
              <th class="py-1">
                Coachee
              </th>
              <th class="py-1">
                Empresa
              </th>
              <th class="py-1">
                Horas
              </th>
              <th class="py-1">
                Confirmado
              </th>
              <th class="py-1">
                Proyectado
              </th>
              <th class="py-1">
                Total estimado
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="c in resumen.porCoachee"
              :key="c.coacheeId"
              class="border-t border-[var(--color-line)]"
            >
              <td class="py-2">
                {{ c.nombre }}
              </td>
              <td class="py-2 text-[var(--color-ink)]/60">
                {{ c.empresaNombre ?? 'Independiente' }}
              </td>
              <td class="py-2">
                {{ c.horasRealizadas }}
              </td>
              <td class="py-2 text-[var(--color-sage)]">
                {{ formatoCLP.format(c.ingresoDelPeriodo) }}
              </td>
              <td class="py-2 text-[var(--color-bronze)]">
                {{ formatoCLP.format(c.ingresoProyectado) }}
              </td>
              <td class="py-2 font-medium">
                {{ formatoCLP.format(c.ingresoDelPeriodo + c.ingresoProyectado) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div
    v-if="loading"
    class="text-sm text-[var(--color-ink)]/60"
  >
    Cargando…
  </div>
  <div
    v-else
    class="space-y-4"
  >
    <p
      v-if="error"
      class="text-sm text-[var(--color-danger)]"
    >
      {{ error }}
    </p>

    <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
      <h2 class="mb-3 text-sm font-medium">
        Solicitudes de nuevos procesos ({{ solicitudesPendientes.length }})
      </h2>
      <p
        v-if="solicitudesPendientes.length === 0"
        class="text-sm text-[var(--color-ink)]/60"
      >
        No hay solicitudes pendientes.
      </p>
      <ul
        v-else
        class="space-y-2 text-sm"
      >
        <li
          v-for="s in solicitudesPendientes"
          :key="s.id"
          class="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-line)] p-3"
        >
          <div>
            <p class="font-medium">
              {{ s.nombreSugerido }}
              <span
                v-if="s.empresa"
                class="text-[var(--color-ink)]/60"
              >— {{ s.empresa.nombre }}</span>
            </p>
            <p
              v-if="s.mensaje"
              class="text-[var(--color-ink)]/60"
            >
              {{ s.mensaje }}
            </p>
          </div>
          <button
            :disabled="atendiendo === s.id"
            class="shrink-0 rounded-lg bg-[var(--color-ink)] px-3 py-2 text-xs text-[var(--color-parchment)] disabled:opacity-50"
            @click="marcarAtendida(s.id)"
          >
            Atender
          </button>
        </li>
      </ul>
    </div>

    <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
      <h2 class="mb-3 text-sm font-medium">
        Procesos cerrados
      </h2>
      <p
        v-if="ciclosCerrados.length === 0"
        class="text-sm text-[var(--color-ink)]/60"
      >
        Todavía no hay procesos cerrados.
      </p>
      <ul
        v-else
        class="space-y-2 text-sm"
      >
        <li
          v-for="c in ciclosCerrados"
          :key="c.id"
          class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-line)] p-3"
        >
          <div>
            <p class="font-medium">
              {{ c.coachee.nombre }}
            </p>
            <p class="text-[var(--color-ink)]/60">
              Cerrado el {{ c.fechaCierre ? new Date(c.fechaCierre).toLocaleDateString('es-CL') : '—' }}
              <span v-if="c.resultado"> · {{ c.resultado.replace(/_/g, ' ') }}</span>
            </p>
          </div>
          <button
            class="shrink-0 rounded-lg border border-[var(--color-line)] px-3 py-2 text-xs hover:bg-[var(--color-parchment)]/50"
            @click="abrirNuevoProceso(c.coacheeId)"
          >
            Abrir nuevo proceso con {{ c.coachee.nombre }}
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
