<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '../../components/AppShell.vue'
import SectionCard from '../../components/SectionCard.vue'
import EmptyState from '../../components/EmptyState.vue'
import NavIcon from '../../components/NavIcon.vue'
import { getMisKpis, type KpisEmpresa } from '../../api/satisfaccion'
import { getMyEmpresa, type Empresa } from '../../api/empresas'
import { listCoachees, type CoacheeListItem } from '../../api/coachees'
import { getPlanByCoachee } from '../../api/planesDesarrollo'
import { getCiclosDeCoachee, type Ciclo } from '../../api/ciclos'
import { getAvanceDeCoachee } from '../../api/seguimiento'
import { getProximaSesionDeCoachee } from '../../api/sesiones'
import { resumirCoachee, type ResumenCoacheeEmpresa } from '../../lib/resumenCoacheeEmpresa'
import { distribucionPorArea, competenciasTrabajadas } from '../../lib/distribucionEquipo'
import { iniciales } from '../../lib/avatar'
import DonutChart, { type DonutSegment } from '../../components/DonutChart.vue'

const router = useRouter()
const loading = ref(true)
const kpis = ref<KpisEmpresa | null>(null)
const empresa = ref<Empresa | null>(null)
const filas = ref<{ coachee: CoacheeListItem; resumen: ResumenCoacheeEmpresa }[]>([])
const competenciaSeleccionada = ref<string | null>(null)

const formatoCLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

const conAlerta = computed(() => filas.value.filter((f) => f.resumen.alertaPorVencer))

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

async function resumenDe(coachee: CoacheeListItem): Promise<ResumenCoacheeEmpresa> {
  const [plan, ciclos, avanceRes, proximaSesion] = await Promise.all([
    getPlanByCoachee(coachee.id).catch(() => null),
    getCiclosDeCoachee(coachee.id),
    getAvanceDeCoachee(coachee.id),
    getProximaSesionDeCoachee(coachee.id),
  ])
  const cicloActual: Ciclo | null = ciclos.find((c) => !c.fechaCierre) ?? null
  return resumirCoachee({ plan, cicloActual, ciclos, avance: avanceRes.avance, proximaSesion })
}

onMounted(async () => {
  loading.value = true
  const [k, e, coachees] = await Promise.all([getMisKpis(), getMyEmpresa(), listCoachees()])
  kpis.value = k
  empresa.value = e
  filas.value = await Promise.all(
    coachees.map(async (coachee) => ({ coachee, resumen: await resumenDe(coachee) })),
  )
  loading.value = false
})

function verCiclo(coacheeId: string) {
  void router.push({ name: 'empresa-ciclo', params: { coacheeId } })
}
</script>

<template>
  <AppShell>
    <h1 class="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold">
      Resumen
    </h1>
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
        </div>
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
          description="Ningún ciclo de tus coachees está por vencer."
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
            <span class="rounded-full bg-[var(--color-bronze)]/20 px-2 py-0.5 text-xs text-[var(--color-bronze)]">
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
