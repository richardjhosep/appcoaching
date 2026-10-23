<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppShell from '../../components/AppShell.vue'
import SectionCard from '../../components/SectionCard.vue'
import EmptyState from '../../components/EmptyState.vue'
import ImpactoNegocioCallout from '../../components/ImpactoNegocioCallout.vue'
import TendenciaChart from '../../components/TendenciaChart.vue'
import DonutChart from '../../components/DonutChart.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import ErrorState from '../../components/ErrorState.vue'
import StatusBadge from '../../components/StatusBadge.vue'
import KpiCard from '../../components/KpiCard.vue'
import KpisEmpresaGrid from '../../components/KpisEmpresaGrid.vue'
import ReporteCabecera from '../../components/ReporteCabecera.vue'
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
import { resultadoLabel, resultadoColor, resultadoTono } from '../../lib/resultadoCiclo'
import { useCarga } from '../../lib/useCarga'
import { distribucionResultadosSegments } from '../../lib/distribucionResultados'

const empresa = ref<Empresa | null>(null)
const kpis = ref<KpisEmpresa | null>(null)
const tendencia = ref<PuntoTendencia[]>([])
const finanzas = ref<ResumenFinanzasEmpresa | null>(null)
const retorno = ref<RetornoInversionEmpresa | null>(null)

const formatoCLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
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

const { loading, error, recargar } = useCarga(async () => {
  // El impacto en el negocio vive en una sola sección — la tarjeta de cada proceso en
  // "Retorno de la inversión" ya lo muestra junto a su costo y resultado, así que no se
  // duplica en una segunda sección de "impactos" (como sí hace el widget acotado a 5 del
  // Resumen — acá el informe muestra todos los procesos de todas formas).
  // Todas las fuentes son críticas: un informe con secciones faltantes se podría imprimir y
  // circular como si estuviera completo.
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
})

onMounted(recargar)
</script>

<template>
  <AppShell>
    <ReporteCabecera
      titulo="Informe ejecutivo"
      :empresa="empresa?.nombre"
    />

    <SkeletonBlock
      v-if="loading"
      variant="cards"
      :rows="4"
    />
    <ErrorState
      v-else-if="error"
      :description="error"
      @retry="recargar"
    />
    <div
      v-else
      class="space-y-4"
    >
      <KpisEmpresaGrid
        v-if="kpis"
        :kpis="kpis"
      />

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
              <p class="text-xs text-[var(--color-muted)]">
                Invertido en procesos cerrados
              </p>
              <p class="font-[family-name:var(--font-mono)] text-2xl">
                {{ formatoCLP.format(retorno.costoTotalProcesosCerrados) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-[var(--color-muted)]">
                Costo promedio por proceso
              </p>
              <p class="font-[family-name:var(--font-mono)] text-2xl">
                {{ formatoCLP.format(retorno.costoPromedioPorProceso ?? 0) }}
              </p>
            </div>
          </div>
          <div class="mb-4 border-t border-[var(--color-line)] pt-4">
            <p class="mb-2 text-xs text-[var(--color-muted)]">
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
                <span class="flex items-center gap-2 text-xs text-[var(--color-muted)]">
                  <span>{{ formatoFecha(p.fechaCierre) }}</span>
                  <span class="font-[family-name:var(--font-mono)] text-sm text-[var(--color-ink)]">{{ formatoCLP.format(p.costo) }}</span>
                  <StatusBadge :tone="resultadoTono[p.resultado]">
                    {{ resultadoLabel[p.resultado] }}
                  </StatusBadge>
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
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <KpiCard
            label="Gasto del período"
            :value="formatoCLP.format(finanzas.gastoDelPeriodo)"
          />
          <KpiCard
            label="Estado de pago"
            :value="finanzas.pagada ? 'Al día' : 'Pendiente'"
            :tone="finanzas.pagada ? 'sage' : 'bronze'"
            hint="Registrado por tu coach"
          />
          <KpiCard
            label="Monto pendiente"
            :value="formatoCLP.format(finanzas.gastoPendiente)"
            :tone="finanzas.gastoPendiente > 0 ? 'bronze' : 'sage'"
          />
        </div>
      </SectionCard>
    </div>
  </AppShell>
</template>
