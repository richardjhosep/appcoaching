<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppShell from '../../components/AppShell.vue'
import SectionCard from '../../components/SectionCard.vue'
import EmptyState from '../../components/EmptyState.vue'
import ImpactoNegocioCallout from '../../components/ImpactoNegocioCallout.vue'
import TendenciaChart from '../../components/TendenciaChart.vue'
import DonutChart from '../../components/DonutChart.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import { getMyEmpresa, type Empresa } from '../../api/empresas'
import {
  getMisKpis,
  getMiTendencia,
  type KpisEmpresa,
  type PuntoTendencia,
} from '../../api/satisfaccion'
import {
  getMiResumenFinanciero,
  getMiRetornoInversion,
  type ResumenFinanzasEmpresa,
  type RetornoInversionEmpresa,
} from '../../api/negocio'
import { resultadoLabel, resultadoColor } from '../../lib/resultadoCiclo'
import { distribucionResultadosSegments } from '../../lib/distribucionResultados'

const loading = ref(true)
const empresa = ref<Empresa | null>(null)
const kpis = ref<KpisEmpresa | null>(null)
const tendencia = ref<PuntoTendencia[]>([])
const finanzas = ref<ResumenFinanzasEmpresa | null>(null)
const retorno = ref<RetornoInversionEmpresa | null>(null)

const formatoCLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
const fechaEmision = new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
const formatoFecha = (fecha: string) =>
  new Date(fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })

const segmentosResultado = computed(() => {
  if (!retorno.value) return []
  return distribucionResultadosSegments(retorno.value.distribucionResultados).map((s) => ({
    label: resultadoLabel[s.resultado],
    count: s.count,
    pct: s.pct,
    color: resultadoColor[s.resultado],
  }))
})

onMounted(async () => {
  loading.value = true
  // El impacto en el negocio vive en una sola sección — la tarjeta de cada proceso en
  // "Retorno de la inversión" ya lo muestra junto a su costo y resultado, así que no se
  // duplica en una segunda sección de "impactos" (como sí hace el widget acotado a 5 del
  // Resumen — acá el informe muestra todos los procesos de todas formas).
  const [e, k, t, f, r] = await Promise.all([
    getMyEmpresa(),
    getMisKpis(),
    getMiTendencia(),
    getMiResumenFinanciero(),
    getMiRetornoInversion(),
  ])
  empresa.value = e
  kpis.value = k
  tendencia.value = t
  finanzas.value = f
  retorno.value = r
  loading.value = false
})

function imprimir() {
  window.print()
}
</script>

<template>
  <AppShell>
    <div class="mb-4 flex items-start justify-between print:mb-6">
      <div>
        <h1 class="font-[family-name:var(--font-heading)] text-xl font-semibold">
          Informe ejecutivo
        </h1>
        <p
          v-if="empresa"
          class="text-xs text-[var(--color-ink)]/50 print:text-sm"
        >
          {{ empresa.nombre }} · Emitido el {{ fechaEmision }}
        </p>
      </div>
      <button
        type="button"
        class="shrink-0 rounded-lg bg-[var(--color-ink)] px-3 py-2 text-xs text-[var(--color-parchment)] print:hidden"
        @click="imprimir"
      >
        Descargar / Imprimir
      </button>
    </div>

    <SkeletonBlock v-if="loading" />
    <div
      v-else
      class="space-y-4"
    >
      <div
        v-if="kpis"
        class="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
          <p class="text-xs text-[var(--color-ink)]/60">
            Procesos terminados
          </p>
          <p class="font-[family-name:var(--font-mono)] text-2xl">
            {{ kpis.procesosTerminados }}
          </p>
        </div>
        <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
          <p class="text-xs text-[var(--color-ink)]/60">
            Procesos en curso
          </p>
          <p class="font-[family-name:var(--font-mono)] text-2xl">
            {{ kpis.procesosEnCurso }}
          </p>
        </div>
        <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
          <p class="text-xs text-[var(--color-ink)]/60">
            Tasa de asistencia
          </p>
          <p class="font-[family-name:var(--font-mono)] text-2xl text-[var(--color-sage)]">
            {{ kpis.tasaAsistencia !== null ? `${kpis.tasaAsistencia}%` : '—' }}
          </p>
        </div>
        <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
          <p class="text-xs text-[var(--color-ink)]/60">
            Satisfacción promedio
          </p>
          <p class="font-[family-name:var(--font-mono)] text-2xl">
            {{ kpis.satisfaccionPromedio !== null ? `${kpis.satisfaccionPromedio} ★` : '—' }}
          </p>
        </div>
      </div>

      <SectionCard
        title="Tendencia"
        icon="progreso"
      >
        <TendenciaChart :puntos="tendencia" />
      </SectionCard>

      <SectionCard
        v-if="retorno"
        title="Retorno de la inversión"
        icon="objetivo"
      >
        <EmptyState
          v-if="retorno.procesos.length === 0"
          icon="objetivo"
          title="Todavía no hay procesos cerrados"
          description="Cuando se cierre el primer proceso de coaching, va a aparecer acá."
        />
        <template v-else>
          <div class="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <p class="text-xs text-[var(--color-ink)]/60">
                Invertido en procesos cerrados
              </p>
              <p class="font-[family-name:var(--font-mono)] text-2xl">
                {{ formatoCLP.format(retorno.costoTotalProcesosCerrados) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-[var(--color-ink)]/60">
                Costo promedio por proceso
              </p>
              <p class="font-[family-name:var(--font-mono)] text-2xl">
                {{ formatoCLP.format(retorno.costoPromedioPorProceso ?? 0) }}
              </p>
            </div>
          </div>
          <div class="mb-4 border-t border-[var(--color-line)] pt-4">
            <p class="mb-2 text-xs text-[var(--color-ink)]/60">
              Distribución de resultados
            </p>
            <DonutChart
              :segments="segmentosResultado"
              :center-value="retorno.procesos.length"
              center-label="procesos"
            />
          </div>
          <div class="space-y-2">
            <div
              v-for="p in retorno.procesos"
              :key="p.cicloId"
              class="rounded-xl border border-[var(--color-line)] bg-white p-3"
            >
              <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span class="text-sm font-medium">{{ p.coacheeNombre }}</span>
                <span class="flex items-center gap-2 text-xs text-[var(--color-ink)]/50">
                  <span>{{ formatoFecha(p.fechaCierre) }}</span>
                  <span class="font-[family-name:var(--font-mono)] text-sm text-[var(--color-ink)]">{{ formatoCLP.format(p.costo) }}</span>
                  <span
                    class="rounded-full px-2 py-0.5"
                    :style="{
                      backgroundColor: `color-mix(in srgb, ${resultadoColor[p.resultado]} 15%, white)`,
                      color: resultadoColor[p.resultado],
                    }"
                  >{{ resultadoLabel[p.resultado] }}</span>
                </span>
              </div>
              <ImpactoNegocioCallout
                v-if="p.impactoNegocio"
                :impacto="p.impactoNegocio"
              />
            </div>
          </div>
        </template>
      </SectionCard>

      <SectionCard
        v-if="finanzas"
        title="Resumen financiero del período"
        icon="negocio"
      >
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <p class="text-xs text-[var(--color-ink)]/60">
              Gasto del período
            </p>
            <p class="font-[family-name:var(--font-mono)] text-2xl">
              {{ formatoCLP.format(finanzas.gastoDelPeriodo) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-[var(--color-ink)]/60">
              Estado de pago
            </p>
            <p
              class="text-sm font-medium"
              :class="finanzas.pagada ? 'text-[var(--color-sage)]' : 'text-[var(--color-bronze)]'"
            >
              {{ finanzas.pagada ? 'Al día' : 'Pendiente' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-[var(--color-ink)]/60">
              Monto pendiente
            </p>
            <p
              class="font-[family-name:var(--font-mono)] text-2xl"
              :class="finanzas.gastoPendiente > 0 ? 'text-[var(--color-bronze)]' : 'text-[var(--color-sage)]'"
            >
              {{ formatoCLP.format(finanzas.gastoPendiente) }}
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  </AppShell>
</template>
