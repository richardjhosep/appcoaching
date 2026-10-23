<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppShell from '../../components/AppShell.vue'
import SectionCard from '../../components/SectionCard.vue'
import EmptyState from '../../components/EmptyState.vue'
import ProyeccionGastoChart from '../../components/ProyeccionGastoChart.vue'
import TabBar from '../../components/TabBar.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import ErrorState from '../../components/ErrorState.vue'
import StatusBadge from '../../components/StatusBadge.vue'
import ReporteCabecera from '../../components/ReporteCabecera.vue'
import ImpactoNegocioCallout from '../../components/ImpactoNegocioCallout.vue'
import DonutChart from '../../components/DonutChart.vue'
import { getMyEmpresa, type Empresa } from '../../api/empresas'
import {
  getMiResumenFinanciero,
  getMiProyeccionFinanciera,
  getMiResumenAcumulado,
  getMiRetornoInversion,
  type ResumenFinanzasEmpresa,
  type ProyeccionMesEmpresa,
  type ResumenAcumuladoEmpresa,
  type RetornoInversionEmpresa,
} from '../../api/negocio'
import { getUfHoy } from '../../api/indicadores'
import { resultadoLabel, resultadoColor, resultadoTono } from '../../lib/resultadoCiclo'
import { useCarga } from '../../lib/useCarga'
import { distribucionResultadosSegments } from '../../lib/distribucionResultados'
import { formatMonto, type Moneda } from '../../lib/moneda'
import MonedaToggle from '../../components/MonedaToggle.vue'

const empresa = ref<Empresa | null>(null)
const resumen = ref<ResumenFinanzasEmpresa | null>(null)
const proyeccion = ref<ProyeccionMesEmpresa[]>([])
const acumulado = ref<ResumenAcumuladoEmpresa | null>(null)
const retorno = ref<RetornoInversionEmpresa | null>(null)

// Todos los montos de esta vista viven en CLP (el backend ya convirtió cualquier
// tarifa en UF antes de sumar nada) — este selector es puramente de visualización.
const moneda = ref<Moneda>('clp')
const valorUf = ref<number | null>(null)
const fechaUf = ref<string | null>(null)
const ufDesactualizada = ref(false)
const errorUf = ref<string | null>(null)
function monto(clp: number): string {
  return formatMonto(clp, moneda.value, valorUf.value ?? 0)
}

const segmentosResultado = computed(() => {
  if (!retorno.value) return []
  return distribucionResultadosSegments(retorno.value.distribucionResultados).map((s) => ({
    label: resultadoLabel[s.resultado],
    count: s.count,
    pct: s.pct,
    color: resultadoColor[s.resultado],
  }))
})

const etiquetaSemestre = computed(() => {
  if (!acumulado.value) return ''
  const { semestre, anio } = acumulado.value
  return `${semestre === 1 ? '1er' : '2do'} semestre ${anio}`
})

// La proyección mensual (6 meses rodantes) es la única que especula sobre el futuro —
// semestral y anual reutilizan el mismo "ejecutado + agendado" honesto del acumulado, nunca
// una extrapolación, para no mostrarle al subgerente un número que no está realmente
// comprometido en la agenda.
type VistaProyeccion = 'mensual' | 'semestral' | 'anual'
const VISTAS: Array<{ key: VistaProyeccion; label: string; icon: string }> = [
  { key: 'mensual', label: 'Mensual', icon: 'sesiones' },
  { key: 'semestral', label: 'Semestral', icon: 'progreso' },
  { key: 'anual', label: 'Anual', icon: 'negocio' },
]
const vista = ref<VistaProyeccion>('mensual')

const { loading, error, recargar } = useCarga(async () => {
  const [e, r, p, a, ret] = await Promise.all([
    getMyEmpresa(),
    getMiResumenFinanciero(),
    getMiProyeccionFinanciera(),
    getMiResumenAcumulado(),
    getMiRetornoInversion(),
  ])
  empresa.value = e
  resumen.value = r
  proyeccion.value = p
  acumulado.value = a
  retorno.value = ret
})

// El valor UF solo habilita el selector de moneda: si falla, la vista sigue en CLP.
async function cargarUf() {
  await getUfHoy()
    .then((v) => {
      valorUf.value = v.valorUf
      fechaUf.value = v.fecha
      ufDesactualizada.value = v.desactualizado
    })
    .catch(() => {
      errorUf.value = 'No se pudo obtener el valor UF — el selector de moneda queda solo en CLP.'
    })
}

onMounted(() => {
  void recargar()
  void cargarUf()
})
</script>

<template>
  <AppShell>
    <ReporteCabecera
      titulo="Finanzas"
      :empresa="empresa?.nombre"
    />
    <MonedaToggle
      v-if="!errorUf"
      v-model="moneda"
      :valor-uf="valorUf"
      :fecha="fechaUf"
      :desactualizado="ufDesactualizada"
      class="mb-4 print:hidden"
    />
    <SkeletonBlock
      v-if="loading"
      variant="cards"
      :rows="3"
    />
    <ErrorState
      v-else-if="error"
      :description="error"
      @retry="recargar"
    />
    <div
      v-else-if="resumen"
      class="space-y-4"
    >
      <SectionCard
        title="Este mes"
        icon="negocio"
      >
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <p class="text-xs text-[var(--color-muted)]">
              Gasto del período
            </p>
            <p class="font-[family-name:var(--font-mono)] text-2xl">
              {{ monto(resumen.gastoDelPeriodo) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-[var(--color-muted)]">
              Horas consumidas / contratadas
            </p>
            <p class="font-[family-name:var(--font-mono)] text-2xl">
              {{ resumen.horasConsumidas }} / {{ resumen.horasContratadas ?? '—' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-[var(--color-muted)]">
              Estado de pago
            </p>
            <p
              class="text-sm font-medium"
              :class="resumen.pagada ? 'text-[var(--color-sage)]' : 'text-[var(--color-bronze)]'"
            >
              {{ resumen.pagada ? 'Al día' : 'Pendiente' }}
            </p>
            <p class="text-xs text-[var(--color-subtle)]">
              Registrado por tu coach
            </p>
          </div>
          <div>
            <p class="text-xs text-[var(--color-muted)]">
              Monto pendiente
            </p>
            <p
              class="font-[family-name:var(--font-mono)] text-2xl"
              :class="resumen.gastoPendiente > 0 ? 'text-[var(--color-bronze)]' : 'text-[var(--color-sage)]'"
            >
              {{ monto(resumen.gastoPendiente) }}
            </p>
          </div>
        </div>
        <p class="mt-3 text-xs text-[var(--color-subtle)]">
          El estado de pago refleja la conciliación de tu coach — no es un historial de
          transacciones, es el gasto real del mes actual mientras no se marque como pagado.
        </p>
      </SectionCard>

      <SectionCard
        title="Gasto por coachee"
        icon="coachees"
      >
        <EmptyState
          v-if="resumen.porCoachee.length === 0"
          icon="coachees"
          title="Sin actividad este mes"
          description="Todavía no hay sesiones registradas este período."
        />
        <div
          v-else
          class="overflow-x-auto"
        >
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="text-xs text-[var(--color-muted)]">
                <th
                  scope="col"
                  class="py-1"
                >
                  Coachee
                </th>
                <th
                  scope="col"
                  class="py-1"
                >
                  Horas realizadas
                </th>
                <th
                  scope="col"
                  class="py-1"
                >
                  Gasto del período
                </th>
                <th
                  scope="col"
                  class="py-1"
                >
                  Agendado
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
                <td class="py-2">
                  {{ c.horasRealizadas }}
                </td>
                <td class="py-2">
                  {{ monto(c.gastoBrutoDelPeriodo) }}
                </td>
                <td class="py-2">
                  {{ monto(c.gastoBrutoProyectado) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="mt-3 text-xs text-[var(--color-subtle)]">
          "Agendado" son sesiones ya programadas que todavía no ocurren — no una proyección
          estimada, es lo que hoy está en la agenda de cada coachee.
        </p>
      </SectionCard>

      <SectionCard
        title="Proyección de gasto"
        icon="progreso"
      >
        <TabBar
          class="mb-4"
          :tabs="VISTAS"
          :model-value="vista"
          @update:model-value="vista = $event"
        />

        <ProyeccionGastoChart
          v-if="vista === 'mensual'"
          :meses="proyeccion"
        />

        <template v-else-if="acumulado">
          <div v-if="vista === 'semestral'">
            <p class="text-xs text-[var(--color-muted)]">
              {{ etiquetaSemestre }}
            </p>
            <p class="font-[family-name:var(--font-mono)] text-2xl">
              {{ monto(acumulado.gastoEjecutadoSemestre + acumulado.gastoAgendadoSemestre) }}
            </p>
            <p class="text-xs text-[var(--color-subtle)]">
              Ejecutado {{ monto(acumulado.gastoEjecutadoSemestre) }} · Agendado {{ monto(acumulado.gastoAgendadoSemestre) }}
            </p>
          </div>
          <div v-else-if="vista === 'anual'">
            <p class="text-xs text-[var(--color-muted)]">
              Año {{ acumulado.anio }}
            </p>
            <p class="font-[family-name:var(--font-mono)] text-2xl">
              {{ monto(acumulado.gastoEjecutadoAnio + acumulado.gastoAgendadoAnio) }}
            </p>
            <p class="text-xs text-[var(--color-subtle)]">
              Ejecutado {{ monto(acumulado.gastoEjecutadoAnio) }} · Agendado {{ monto(acumulado.gastoAgendadoAnio) }}
            </p>
          </div>
          <p class="mt-3 text-xs text-[var(--color-subtle)]">
            "Ejecutado" son sesiones ya realizadas; "Agendado" son sesiones ya programadas que
            todavía no ocurren — a diferencia de la vista Mensual, esto no especula sobre meses
            futuros sin sesiones agendadas todavía.
          </p>
        </template>
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
          description="Cuando se cierre el primer proceso de coaching, vas a poder ver acá cuánto costó y qué resultado tuvo."
        />
        <template v-else>
          <div class="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <p class="text-xs text-[var(--color-muted)]">
                Invertido en procesos cerrados
              </p>
              <p class="font-[family-name:var(--font-mono)] text-2xl">
                {{ monto(retorno.costoTotalProcesosCerrados) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-[var(--color-muted)]">
                Costo promedio por proceso
              </p>
              <p class="font-[family-name:var(--font-mono)] text-2xl">
                {{ monto(retorno.costoPromedioPorProceso ?? 0) }}
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
          <p class="mb-3 text-xs text-[var(--color-subtle)]">
            Cruza lo que costó cada proceso (sesiones ya realizadas × tarifa) con el resultado
            que tuvo — incluye todos los procesos cerrados hasta hoy, no solo los del período
            financiero seleccionado arriba.
          </p>
          <div class="space-y-2">
            <div
              v-for="p in retorno.procesos"
              :key="p.cicloId"
              class="rounded-xl border border-[var(--color-line)] bg-white p-3"
            >
              <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span class="text-sm font-medium">{{ p.coacheeNombre }}</span>
                <span class="flex items-center gap-2 text-xs text-[var(--color-subtle)]">
                  <span>{{ new Date(p.fechaCierre).toLocaleDateString('es-CL') }}</span>
                  <span class="font-[family-name:var(--font-mono)] text-sm text-[var(--color-ink)]">{{ monto(p.costo) }}</span>
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
    </div>
  </AppShell>
</template>
