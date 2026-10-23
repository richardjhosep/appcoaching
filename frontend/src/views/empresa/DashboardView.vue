<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppShell from '../../components/AppShell.vue'
import SectionCard from '../../components/SectionCard.vue'
import EmptyState from '../../components/EmptyState.vue'
import NavIcon from '../../components/NavIcon.vue'
import AppButton from '../../components/AppButton.vue'
import KpisEmpresaGrid from '../../components/KpisEmpresaGrid.vue'
import StatusBadge from '../../components/StatusBadge.vue'
import ErrorState from '../../components/ErrorState.vue'
import NotaConfidencialidadEmpresa from '../../components/NotaConfidencialidadEmpresa.vue'
import GlosarioEmpresa from '../../components/GlosarioEmpresa.vue'
import { getMisKpis, getMiTendencia, type KpisEmpresa, type PuntoTendencia } from '../../api/satisfaccion'
import TendenciaChart from '../../components/TendenciaChart.vue'
import { getMyEmpresa, getMisCompetenciasContratadas, type Empresa, type EmpresaCompetencia } from '../../api/empresas'
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
import { sin404 } from '../../lib/cargaPorCoachee'
import { useCarga } from '../../lib/useCarga'
import { iniciales } from '../../lib/avatar'
import { colorCategoria } from '../../lib/echartsTheme'
import DonutChart, { type DonutSegment } from '../../components/DonutChart.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'

interface FilaDashboard {
  coachee: CoacheeListItem
  resumen: ResumenCoacheeEmpresa
  ciclos: Ciclo[]
  // true si alguna de las llamadas del coachee falló: sus alertas no son confiables y no se
  // puede afirmar que "está al día".
  incompleto: boolean
}

const kpis = ref<KpisEmpresa | null>(null)
const tendencia = ref<PuntoTendencia[]>([])
const empresa = ref<Empresa | null>(null)
const finanzasMes = ref<ResumenFinanzasEmpresa | null>(null)
const finanzasAcumuladas = ref<ResumenAcumuladoEmpresa | null>(null)
const filas = ref<FilaDashboard[]>([])
const competenciaSeleccionada = ref<string | null>(null)
const competenciasContratadas = ref<EmpresaCompetencia[]>([])
const seccionesSinDatos = ref<string[]>([])

const formatoCLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
const formatoFecha = (fecha: string) =>
  new Date(fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })

const conAlerta = computed(() =>
  filas.value.filter((f) => f.resumen.alertaPorVencer || f.resumen.sinProximaSesion),
)
const incompletos = computed(() => filas.value.filter((f) => f.incompleto))
// Los incompletos que además tienen una alerta conocida ya salen en `conAlerta`.
const soloIncompletos = computed(() => incompletos.value.filter((f) => !conAlerta.value.includes(f)))

// El impacto en el negocio es texto libre, no un número — no hay "top 5 por magnitud" posible
// sin inventar un puntaje. Lo real y útil es "los más recientes": una vitrina de resultados
// concretos en vez de un gráfico de barras que no tendría qué graficar.
const impactosDestacados = computed(() => ultimosImpactos(filas.value))

const etiquetaSemestre = computed(() => {
  if (!finanzasAcumuladas.value) return ''
  const { semestre, anio } = finanzasAcumuladas.value
  return `${semestre === 1 ? '1er' : '2do'} semestre ${anio}`
})

// "Sin asignar" usa un neutro aparte para que se lea de inmediato como "dato pendiente", no
// como un departamento más. Los demás recorren la paleta de marca sin repetir color.
const COLOR_SIN_ASIGNAR = 'color-mix(in srgb, var(--color-ink) 25%, white)'

const distribucionDepartamento = computed<DonutSegment[]>(() => {
  let i = 0
  return distribucionPorArea(filas.value.map((f) => f.coachee)).map((s) => ({
    label: s.area,
    count: s.count,
    pct: s.pct,
    color: s.area === 'Sin asignar' ? COLOR_SIN_ASIGNAR : colorCategoria(i++),
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

const { loading, error, recargar, tolerar } = useCarga(async () => {
  const [k, e, coachees] = await Promise.all([getMisKpis(), getMyEmpresa(), listCoachees()])
  kpis.value = k
  empresa.value = e

  // Secundarios: si fallan, la pantalla se muestra igual y se avisa qué sección quedó sin datos.
  const [fm, fa, t, cc] = await Promise.all([
    tolerar(getMiResumenFinanciero()),
    tolerar(getMiResumenAcumulado()),
    tolerar(getMiTendencia()),
    tolerar(getMisCompetenciasContratadas()),
  ])
  finanzasMes.value = fm ?? null
  finanzasAcumuladas.value = fa ?? null
  tendencia.value = t ?? []
  competenciasContratadas.value = cc ?? []
  seccionesSinDatos.value = [
    ...(fm === undefined || fa === undefined ? ['finanzas'] : []),
    ...(t === undefined ? ['tendencia'] : []),
    ...(cc === undefined ? ['competencias contratadas'] : []),
  ]

  filas.value = await Promise.all(
    coachees.map(async (coachee) => ({ coachee, ...(await resumenDe(coachee)) })),
  )
})

async function resumenDe(coachee: CoacheeListItem): Promise<{ resumen: ResumenCoacheeEmpresa; ciclos: Ciclo[]; incompleto: boolean }> {
  // Cada llamada se tolera por separado: un error puntual en una no tumba todo el Resumen ni
  // el de los demás coachees. `undefined` = falló de verdad (un 404 de "sin plan" se resuelve
  // a null en sin404 y no cuenta como fallo; null/[] = "no hay").
  const [plan, ciclos, avanceRes, proximaSesion] = await Promise.all([
    tolerar(getPlanByCoachee(coachee.id).then((v) => v ?? null, sin404(null))),
    tolerar(getCiclosDeCoachee(coachee.id).then((v) => v ?? [])),
    tolerar(getAvanceDeCoachee(coachee.id).then((v) => v ?? { avance: null })),
    tolerar(getProximaSesionDeCoachee(coachee.id).then((v) => v ?? null)),
  ])
  const incompleto = [plan, ciclos, avanceRes, proximaSesion].some((v) => v === undefined)
  const ciclosOk = ciclos ?? []
  const cicloActual: Ciclo | null = ciclosOk.find((c) => !c.fechaCierre) ?? null
  const resumen = resumirCoachee({
    plan: plan ?? null,
    cicloActual,
    ciclos: ciclosOk,
    avance: avanceRes?.avance ?? null,
    proximaSesion: proximaSesion ?? null,
  })
  // Si no pudimos consultar la próxima sesión, "sin sesión agendada" sería un falso positivo.
  if (proximaSesion === undefined) resumen.sinProximaSesion = false
  return { resumen, ciclos: ciclosOk, incompleto }
}

onMounted(recargar)

function motivoAlerta(fila: FilaDashboard): string {
  const motivos: string[] = []
  if (fila.resumen.sinProximaSesion) motivos.push('Tiene sesiones pendientes y ninguna agendada: consulta a tu coach.')
  if (fila.resumen.alertaPorVencer) motivos.push('Al ciclo le quedan pocas sesiones: está por terminar.')
  return motivos.join(' ')
}
</script>

<template>
  <AppShell>
    <h1 class="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold">
      Resumen
    </h1>
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
      <div
        v-if="incompletos.length > 0 || seccionesSinDatos.length > 0"
        role="status"
        class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-bronze)]/40 bg-[var(--color-bronze)]/10 p-3 text-sm"
      >
        <p>
          <template v-if="incompletos.length > 0">
            No pudimos cargar datos de {{ incompletos.length }}
            {{ incompletos.length === 1 ? 'persona' : 'personas' }}; los indicadores pueden estar incompletos.
          </template>
          <template v-if="seccionesSinDatos.length > 0">
            Tampoco pudimos cargar: {{ seccionesSinDatos.join(', ') }}.
          </template>
        </p>
        <AppButton
          variant="secondary"
          size="sm"
          class="shrink-0"
          @click="recargar"
        >
          Reintentar
        </AppButton>
      </div>

      <KpisEmpresaGrid
        v-if="kpis"
        :kpis="kpis"
      />

      <SectionCard
        title="Necesita tu atención"
        icon="objetivo"
      >
        <EmptyState
          v-if="conAlerta.length === 0 && incompletos.length === 0"
          icon="objetivo"
          title="Todo al día"
          description="Ningún ciclo está por vencer ni tiene sesiones pendientes sin agendar."
        />
        <EmptyState
          v-else-if="conAlerta.length === 0 && soloIncompletos.length === 0"
          icon="objetivo"
          title="Sin alertas en los datos disponibles"
          description="No pudimos revisar a todas las personas, así que no podemos confirmar que esté todo al día."
        />
        <ul
          v-else
          class="space-y-2"
        >
          <li
            v-for="fila in conAlerta"
            :key="fila.coachee.id"
          >
            <RouterLink
              :to="{ name: 'empresa-coachees', query: { coacheeId: fila.coachee.id } }"
              class="flex flex-wrap items-center gap-2.5 rounded-xl border border-[var(--color-line)] p-3 text-sm hover:border-[var(--color-sage)]"
            >
              <div
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-ink)] text-xs font-semibold text-[var(--color-parchment)]"
                aria-hidden="true"
              >
                {{ iniciales(fila.coachee.nombre) }}
              </div>
              <div class="min-w-0 flex-1">
                <p class="font-medium">
                  {{ fila.coachee.nombre }}
                </p>
                <p class="text-xs text-[var(--color-muted)]">
                  {{ motivoAlerta(fila) }}
                </p>
              </div>
              <StatusBadge
                v-if="fila.resumen.sinProximaSesion"
                tone="danger"
              >
                Sin sesión agendada
              </StatusBadge>
              <StatusBadge
                v-if="fila.resumen.alertaPorVencer"
                tone="bronze"
              >
                Ciclo por vencer
              </StatusBadge>
              <span class="flex shrink-0 items-center gap-1 text-xs font-medium text-[var(--color-saltup)]">
                Ver progreso
                <NavIcon
                  name="flecha-izquierda"
                  :size="14"
                  class="rotate-180"
                />
              </span>
            </RouterLink>
          </li>
          <li
            v-for="fila in soloIncompletos"
            :key="`incompleto-${fila.coachee.id}`"
            class="flex flex-wrap items-center gap-2.5 rounded-xl border border-dashed border-[var(--color-line)] p-3 text-sm"
          >
            <div
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-parchment)] text-xs font-semibold"
              aria-hidden="true"
            >
              {{ iniciales(fila.coachee.nombre) }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-medium">
                {{ fila.coachee.nombre }}
              </p>
              <p class="text-xs text-[var(--color-muted)]">
                No pudimos cargar sus datos, por eso no sabemos si necesita atención.
              </p>
            </div>
            <StatusBadge tone="neutral">
              Datos incompletos
            </StatusBadge>
          </li>
        </ul>
      </SectionCard>

      <NotaConfidencialidadEmpresa />
      <GlosarioEmpresa />

      <div class="grid gap-4 lg:grid-cols-2">
        <SectionCard
          v-if="empresa"
          title="Mi contrato"
          icon="comercial"
        >
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
            <div>
              <p class="text-xs text-[var(--color-muted)]">
                Horas contratadas
              </p>
              <p class="font-[family-name:var(--font-mono)] text-lg">
                {{ empresa.horasContratadasEfectivas ?? empresa.horasContratadas ?? '—' }}
              </p>
            </div>
            <div>
              <p class="text-xs text-[var(--color-muted)]">
                Tarifa por hora
              </p>
              <p class="font-[family-name:var(--font-mono)] text-lg">
                {{ formatoCLP.format(empresa.tarifaHora) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-[var(--color-muted)]">
                Estado de pago
              </p>
              <p
                class="text-sm font-medium"
                :class="empresa.pagada ? 'text-[var(--color-sage)]' : 'text-[var(--color-bronze)]'"
              >
                {{ empresa.pagada ? 'Al día' : 'Pendiente' }}
              </p>
              <p class="text-xs text-[var(--color-subtle)]">
                Registrado por tu coach
              </p>
            </div>
            <div>
              <p class="text-xs text-[var(--color-muted)]">
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
          <div class="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <div>
              <p class="text-xs text-[var(--color-muted)]">
                Este mes
              </p>
              <p class="font-[family-name:var(--font-mono)] text-2xl">
                {{ formatoCLP.format(finanzasMes.gastoDelPeriodo + finanzasMes.gastoProyectado) }}
              </p>
              <p class="text-xs text-[var(--color-subtle)]">
                Ejecutado {{ formatoCLP.format(finanzasMes.gastoDelPeriodo) }} · Agendado {{ formatoCLP.format(finanzasMes.gastoProyectado) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-[var(--color-muted)]">
                {{ etiquetaSemestre }}
              </p>
              <p class="font-[family-name:var(--font-mono)] text-2xl">
                {{ formatoCLP.format(finanzasAcumuladas.gastoEjecutadoSemestre + finanzasAcumuladas.gastoAgendadoSemestre) }}
              </p>
              <p class="text-xs text-[var(--color-subtle)]">
                Ejecutado {{ formatoCLP.format(finanzasAcumuladas.gastoEjecutadoSemestre) }} · Agendado {{ formatoCLP.format(finanzasAcumuladas.gastoAgendadoSemestre) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-[var(--color-muted)]">
                Año {{ finanzasAcumuladas.anio }}
              </p>
              <p class="font-[family-name:var(--font-mono)] text-2xl">
                {{ formatoCLP.format(finanzasAcumuladas.gastoEjecutadoAnio + finanzasAcumuladas.gastoAgendadoAnio) }}
              </p>
              <p class="text-xs text-[var(--color-subtle)]">
                Ejecutado {{ formatoCLP.format(finanzasAcumuladas.gastoEjecutadoAnio) }} · Agendado {{ formatoCLP.format(finanzasAcumuladas.gastoAgendadoAnio) }}
              </p>
            </div>
          </div>
          <p class="mt-3 text-xs text-[var(--color-subtle)]">
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
      </div>

      <SectionCard
        title="Tendencia"
        icon="progreso"
      >
        <TendenciaChart :puntos="tendencia" />
        <p class="mt-3 text-xs text-[var(--color-subtle)]">
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
                  class="shrink-0 text-xs text-[var(--color-muted)]"
                >· {{ item.competenciaNombre }}</span>
              </div>
              <span class="shrink-0 text-xs text-[var(--color-subtle)]">{{ formatoFecha(item.fechaCierre) }}</span>
            </div>
            <p class="text-sm text-[var(--color-ink)]/80">
              {{ item.impacto }}
            </p>
          </li>
        </ul>
      </SectionCard>

      <div class="grid gap-4 lg:grid-cols-2">
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
          <div
            v-if="competenciasContratadas.length"
            class="mb-3 border-b border-[var(--color-line)] pb-3"
          >
            <p class="mb-2 text-xs text-[var(--color-muted)]">
              Contratadas/prioritarias para tu equipo
            </p>
            <div class="flex flex-wrap gap-1.5">
              <StatusBadge
                v-for="c in competenciasContratadas"
                :key="c.id"
                :tone="competencias.some((t) => t.competencia === c.competencia?.nombre) ? 'sage' : 'bronze'"
              >
                {{ c.competencia?.nombre }}
              </StatusBadge>
            </div>
          </div>

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
            <p class="text-xs text-[var(--color-muted)]">
              Toca el nombre de una competencia para ver quiénes la trabajan.
            </p>
            <div class="space-y-2">
              <div
                v-for="(c, idx) in competencias"
                :key="c.competencia"
              >
                <!-- Grilla estructural: etiqueta | barra | conteo. La sublista se alinea a la
                     columna de la barra con la misma plantilla, sin márgenes mágicos. -->
                <div class="grid grid-cols-[9rem_1fr_2rem] items-center gap-3">
                  <button
                    type="button"
                    class="truncate rounded text-left text-xs"
                    :title="c.competencia"
                    :aria-expanded="competenciaSeleccionada === c.competencia"
                    @click="toggleCompetencia(c.competencia)"
                  >
                    {{ c.competencia }}
                  </button>
                  <div
                    role="progressbar"
                    :aria-label="`${c.competencia}: ${c.count} ${c.count === 1 ? 'coachee' : 'coachees'}`"
                    aria-valuemin="0"
                    :aria-valuemax="maxCompetencia"
                    :aria-valuenow="c.count"
                    class="h-4 rounded-full bg-[var(--color-parchment)]"
                    @click="toggleCompetencia(c.competencia)"
                  >
                    <span
                      class="block h-4 rounded-full transition-all"
                      :class="idx === 0 ? 'bg-[var(--color-bronze)]' : 'bg-[var(--color-sage)]'"
                      :style="{ width: `${(c.count / maxCompetencia) * 100}%` }"
                    />
                  </div>
                  <span class="text-right font-[family-name:var(--font-mono)] text-xs">{{ c.count }}</span>
                </div>
                <div
                  v-if="competenciaSeleccionada === c.competencia"
                  class="mt-1.5 grid grid-cols-[9rem_1fr_2rem] gap-3"
                >
                  <ul class="col-span-2 col-start-2 flex flex-wrap gap-1.5">
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
          </div>
        </SectionCard>
      </div>
    </div>
  </AppShell>
</template>
