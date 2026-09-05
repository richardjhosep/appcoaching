<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '../../components/AppShell.vue'
import SectionCard from '../../components/SectionCard.vue'
import EmptyState from '../../components/EmptyState.vue'
import NavIcon from '../../components/NavIcon.vue'
import { getMisKpis, getMiTendencia, type KpisEmpresa, type PuntoTendencia } from '../../api/satisfaccion'
import TendenciaChart from '../../components/TendenciaChart.vue'
import { getMyEmpresa, type Empresa } from '../../api/empresas'
import {
  getMiResumenFinanciero,
  getMiResumenAcumulado,
  type ResumenFinanzasEmpresa,
  type ResumenAcumuladoEmpresa,
} from '../../api/negocio'
import { listCoachees, type CoacheeListItem } from '../../api/coachees'
import { getPlanByCoachee } from '../../api/planesDesarrollo'
import { getCiclosDeCoachee, type Ciclo } from '../../api/ciclos'
import { getAvanceDeCoachee } from '../../api/seguimiento'
import { getProximaSesionDeCoachee } from '../../api/sesiones'
import { resumirCoachee, type ResumenCoacheeEmpresa } from '../../lib/resumenCoacheeEmpresa'
import { distribucionPorArea, competenciasTrabajadas } from '../../lib/distribucionEquipo'
import { ultimosImpactos } from '../../lib/ultimosImpactos'
import { iniciales } from '../../lib/avatar'
import DonutChart, { type DonutSegment } from '../../components/DonutChart.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'

const router = useRouter()
const loading = ref(true)
const kpis = ref<KpisEmpresa | null>(null)
const tendencia = ref<PuntoTendencia[]>([])
const empresa = ref<Empresa | null>(null)
const finanzasMes = ref<ResumenFinanzasEmpresa | null>(null)
const finanzasAcumuladas = ref<ResumenAcumuladoEmpresa | null>(null)
const filas = ref<{ coachee: CoacheeListItem; resumen: ResumenCoacheeEmpresa; ciclos: Ciclo[] }[]>([])
const competenciaSeleccionada = ref<string | null>(null)

const formatoCLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
const formatoFecha = (fecha: string) =>
  new Date(fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })

const conAlerta = computed(() =>
  filas.value.filter((f) => f.resumen.alertaPorVencer || f.resumen.sinProximaSesion),
)

// El impacto en el negocio es texto libre, no un número — no hay "top 5 por magnitud" posible
// sin inventar un puntaje. Lo real y útil es "los más recientes": una vitrina de resultados
// concretos en vez de un gráfico de barras que no tendría qué graficar.
const impactosDestacados = computed(() => ultimosImpactos(filas.value))

const etiquetaSemestre = computed(() => {
  if (!finanzasAcumuladas.value) return ''
  const { semestre, anio } = finanzasAcumuladas.value
  return `${semestre === 1 ? '1er' : '2do'} semestre ${anio}`
})

// Paleta cíclica de la marca para categorías arbitrarias (departamentos) — "Sin asignar"
// usa un neutro aparte para que se lea de inmediato como "dato pendiente", no como un
// departamento más.
const PALETA_CATEGORIAS = ['var(--color-sage)', 'var(--color-bronze)', 'var(--color-saltup)', 'var(--color-spark)']
const COLOR_SIN_ASIGNAR = 'color-mix(in srgb, var(--color-ink) 25%, white)'

const distribucionDepartamento = computed<DonutSegment[]>(() => {
  let i = 0
  return distribucionPorArea(filas.value.map((f) => f.coachee)).map((s) => ({
    label: s.area,
    count: s.count,
    pct: s.pct,
    color: s.area === 'Sin asignar' ? COLOR_SIN_ASIGNAR : PALETA_CATEGORIAS[i++ % PALETA_CATEGORIAS.length],
  }))
})

const competencias = computed(() =>
  competenciasTrabajadas(
    filas.value.map((f) => ({ competenciaNombre: f.resumen.competenciaNombre, coacheeNombre: f.coachee.nombre })),
  ),
)

const maxCompetencia = computed(() => Math.max(1, ...competencias.value.map((c) => c.count)))

function toggleCompetencia(nombre: string) {
  competenciaSeleccionada.value = competenciaSeleccionada.value === nombre ? null : nombre
}

async function resumenDe(coachee: CoacheeListItem): Promise<{ resumen: ResumenCoacheeEmpresa; ciclos: Ciclo[] }> {
  const [plan, ciclos, avanceRes, proximaSesion] = await Promise.all([
    getPlanByCoachee(coachee.id).catch(() => null),
    getCiclosDeCoachee(coachee.id),
    getAvanceDeCoachee(coachee.id),
    getProximaSesionDeCoachee(coachee.id),
  ])
  const cicloActual: Ciclo | null = ciclos.find((c) => !c.fechaCierre) ?? null
  const resumen = resumirCoachee({ plan, cicloActual, ciclos, avance: avanceRes.avance, proximaSesion })
  return { resumen, ciclos }
}

onMounted(async () => {
  loading.value = true
  const [k, e, coachees, fm, fa, t] = await Promise.all([
    getMisKpis(),
    getMyEmpresa(),
    listCoachees(),
    getMiResumenFinanciero(),
    getMiResumenAcumulado(),
    getMiTendencia(),
  ])
  kpis.value = k
  empresa.value = e
  finanzasMes.value = fm
  finanzasAcumuladas.value = fa
  tendencia.value = t
  filas.value = await Promise.all(
    coachees.map(async (coachee) => ({ coachee, ...(await resumenDe(coachee)) })),
  )
  loading.value = false
})

// Ya no hay una página dedicada por coachee — la lista de Coachees abre el modal de
// progreso directo si llega con este query param (ver CoacheesView.vue).
function verCiclo(coacheeId: string) {
  void router.push({ name: 'empresa-coachees', query: { coacheeId } })
}
</script>

<template>
  <AppShell>
    <h1 class="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold">
      Resumen
    </h1>
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
        v-if="empresa"
        title="Mi contrato"
        icon="negocio"
      >
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <p class="text-xs text-[var(--color-ink)]/60">
              Horas contratadas
            </p>
            <p class="font-[family-name:var(--font-mono)] text-lg">
              {{ empresa.horasContratadas ?? '—' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-[var(--color-ink)]/60">
              Tarifa por hora
            </p>
            <p class="font-[family-name:var(--font-mono)] text-lg">
              {{ formatoCLP.format(empresa.tarifaHora) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-[var(--color-ink)]/60">
              Estado de pago
            </p>
            <p
              class="text-sm font-medium"
              :class="empresa.pagada ? 'text-[var(--color-sage)]' : 'text-[var(--color-bronze)]'"
            >
              {{ empresa.pagada ? 'Al día' : 'Pendiente' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-[var(--color-ink)]/60">
              Término de contrato
            </p>
            <p class="text-sm font-medium">
              {{ empresa.fechaFin ? new Date(`${empresa.fechaFin}T00:00:00`).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sin fecha registrada' }}
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        v-if="finanzasMes && finanzasAcumuladas"
        title="Finanzas"
        icon="negocio"
      >
        <div class="grid gap-4 sm:grid-cols-3">
          <div>
            <p class="text-xs text-[var(--color-ink)]/60">
              Este mes
            </p>
            <p class="font-[family-name:var(--font-mono)] text-2xl">
              {{ formatoCLP.format(finanzasMes.gastoDelPeriodo + finanzasMes.gastoProyectado) }}
            </p>
            <p class="text-xs text-[var(--color-ink)]/50">
              Ejecutado {{ formatoCLP.format(finanzasMes.gastoDelPeriodo) }} · Agendado {{ formatoCLP.format(finanzasMes.gastoProyectado) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-[var(--color-ink)]/60">
              {{ etiquetaSemestre }}
            </p>
            <p class="font-[family-name:var(--font-mono)] text-2xl">
              {{ formatoCLP.format(finanzasAcumuladas.gastoEjecutadoSemestre + finanzasAcumuladas.gastoAgendadoSemestre) }}
            </p>
            <p class="text-xs text-[var(--color-ink)]/50">
              Ejecutado {{ formatoCLP.format(finanzasAcumuladas.gastoEjecutadoSemestre) }} · Agendado {{ formatoCLP.format(finanzasAcumuladas.gastoAgendadoSemestre) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-[var(--color-ink)]/60">
              Año {{ finanzasAcumuladas.anio }}
            </p>
            <p class="font-[family-name:var(--font-mono)] text-2xl">
              {{ formatoCLP.format(finanzasAcumuladas.gastoEjecutadoAnio + finanzasAcumuladas.gastoAgendadoAnio) }}
            </p>
            <p class="text-xs text-[var(--color-ink)]/50">
              Ejecutado {{ formatoCLP.format(finanzasAcumuladas.gastoEjecutadoAnio) }} · Agendado {{ formatoCLP.format(finanzasAcumuladas.gastoAgendadoAnio) }}
            </p>
          </div>
        </div>
        <p class="mt-3 text-xs text-[var(--color-ink)]/50">
          "Ejecutado" son sesiones ya realizadas; "Agendado" son sesiones ya programadas que
          todavía no ocurren — no es una proyección estimada, solo lo que ya está en la agenda.
        </p>
        <RouterLink
          to="/empresa/finanzas"
          class="mt-3 inline-block text-xs text-[var(--color-saltup)] hover:underline"
        >
          Ver detalle por coachee y proyección a 6 meses →
        </RouterLink>
      </SectionCard>

      <SectionCard
        title="Tendencia"
        icon="progreso"
      >
        <TendenciaChart :puntos="tendencia" />
        <p class="mt-3 text-xs text-[var(--color-ink)]/50">
          Últimos 6 meses. Un mes sin encuestas, cierres de ciclo o sesiones registradas se
          muestra vacío, no en cero — no hay dato, no es un mal resultado.
        </p>
      </SectionCard>

      <SectionCard
        title="Últimos impactos en el negocio"
        icon="impacto"
      >
        <EmptyState
          v-if="impactosDestacados.length === 0"
          icon="impacto"
          title="Todavía no hay impactos registrados"
          description="Cuando tu coach cierre un proceso y registre su impacto en el negocio, va a aparecer acá."
        />
        <ul
          v-else
          class="space-y-3"
        >
          <li
            v-for="item in impactosDestacados"
            :key="`${item.coacheeNombre}-${item.fechaCierre}`"
            class="rounded-xl border border-[var(--color-line)] p-3"
          >
            <div class="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <div class="flex min-w-0 items-center gap-2">
                <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-spark)]/10 text-[var(--color-spark)]">
                  <NavIcon
                    name="impacto"
                    :size="12"
                  />
                </div>
                <span class="truncate text-sm font-medium">{{ item.coacheeNombre }}</span>
                <span
                  v-if="item.competenciaNombre"
                  class="shrink-0 text-xs text-[var(--color-ink)]/50"
                >· {{ item.competenciaNombre }}</span>
              </div>
              <span class="shrink-0 text-xs text-[var(--color-ink)]/40">{{ formatoFecha(item.fechaCierre) }}</span>
            </div>
            <p class="text-sm text-[var(--color-ink)]/80">
              {{ item.impacto }}
            </p>
          </li>
        </ul>
      </SectionCard>

      <SectionCard
        title="Distribución por departamento"
        icon="coachees"
      >
        <EmptyState
          v-if="filas.length === 0"
          icon="coachees"
          title="Sin coachees todavía"
          description="Cuando tengas coachees asignados, acá verás cómo se distribuyen por departamento."
        />
        <DonutChart
          v-else
          :segments="distribucionDepartamento"
          :center-value="filas.length"
          center-label="coachees"
        />
      </SectionCard>

      <SectionCard
        title="Competencias trabajadas"
        icon="formacion"
      >
        <EmptyState
          v-if="competencias.length === 0"
          icon="formacion"
          title="Sin competencias asignadas todavía"
          description="Aparecerán acá en cuanto tus coachees tengan un plan de desarrollo aprobado."
        />
        <div
          v-else
          class="space-y-3"
        >
          <p class="text-xs text-[var(--color-ink)]/60">
            Toca una barra para ver quiénes trabajan esa competencia.
          </p>
          <div class="space-y-2">
            <div
              v-for="(c, idx) in competencias"
              :key="c.competencia"
            >
              <button
                type="button"
                class="flex w-full items-center gap-3 rounded-lg text-left"
                @click="toggleCompetencia(c.competencia)"
              >
                <span class="w-36 shrink-0 truncate text-xs">{{ c.competencia }}</span>
                <span class="h-4 flex-1 rounded-full bg-[var(--color-parchment)]">
                  <span
                    class="block h-4 rounded-full transition-all"
                    :class="idx === 0 ? 'bg-[var(--color-bronze)]' : 'bg-[var(--color-sage)]'"
                    :style="{ width: `${(c.count / maxCompetencia) * 100}%` }"
                  />
                </span>
                <span class="w-8 shrink-0 text-right font-[family-name:var(--font-mono)] text-xs">{{ c.count }}</span>
              </button>
              <ul
                v-if="competenciaSeleccionada === c.competencia"
                class="ml-[9.75rem] mt-1.5 flex flex-wrap gap-1.5"
              >
                <li
                  v-for="nombre in c.coachees"
                  :key="nombre"
                  class="rounded-full bg-[var(--color-parchment)] px-2.5 py-1 text-xs"
                >
                  {{ nombre }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Necesita tu atención"
        icon="objetivo"
      >
        <EmptyState
          v-if="conAlerta.length === 0"
          icon="objetivo"
          title="Todo al día"
          description="Ningún ciclo está por vencer ni tiene sesiones pendientes sin agendar."
        />
        <ul
          v-else
          class="space-y-2"
        >
          <li
            v-for="fila in conAlerta"
            :key="fila.coachee.id"
            class="flex cursor-pointer items-center gap-2.5 rounded-xl border border-[var(--color-line)] p-3 text-sm hover:border-[var(--color-sage)]"
            @click="verCiclo(fila.coachee.id)"
          >
            <div
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-ink)] text-xs font-semibold text-[var(--color-parchment)]"
              aria-hidden="true"
            >
              {{ iniciales(fila.coachee.nombre) }}
            </div>
            <span class="flex-1 font-medium">{{ fila.coachee.nombre }}</span>
            <span
              v-if="fila.resumen.sinProximaSesion"
              class="rounded-full bg-[var(--color-danger)]/15 px-2 py-0.5 text-xs text-[var(--color-danger)]"
            >
              Sin sesión agendada
            </span>
            <span
              v-if="fila.resumen.alertaPorVencer"
              class="rounded-full bg-[var(--color-bronze)]/20 px-2 py-0.5 text-xs text-[var(--color-bronze)]"
            >
              Ciclo por vencer
            </span>
            <NavIcon
              name="flecha-izquierda"
              :size="14"
              class="rotate-180 text-[var(--color-ink)]/40"
            />
          </li>
        </ul>
      </SectionCard>
    </div>
  </AppShell>
</template>
