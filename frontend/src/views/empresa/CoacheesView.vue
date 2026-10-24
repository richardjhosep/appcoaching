<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '../../components/AppShell.vue'
import ProgresoActual from '../../components/ProgresoActual.vue'
import EmptyState from '../../components/EmptyState.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import ErrorState from '../../components/ErrorState.vue'
import AppButton from '../../components/AppButton.vue'
import StatusBadge from '../../components/StatusBadge.vue'
import NotaConfidencialidadEmpresa from '../../components/NotaConfidencialidadEmpresa.vue'
import GlosarioEmpresa from '../../components/GlosarioEmpresa.vue'
import TabBar from '../../components/TabBar.vue'
import AppModal from '../../components/AppModal.vue'
import HistorialCiclos from '../../components/HistorialCiclos.vue'
import CertificadoContenido from '../../components/CertificadoContenido.vue'
import ImpactoNegocioCallout from '../../components/ImpactoNegocioCallout.vue'
import NavIcon from '../../components/NavIcon.vue'
import DocumentosCoacheePanel from '../../components/DocumentosCoacheePanel.vue'
import { listCoachees, type CoacheeListItem } from '../../api/coachees'
import { getPlanByCoachee } from '../../api/planesDesarrollo'
import { getCiclosDeCoachee, type Ciclo } from '../../api/ciclos'
import { getAvanceDeCoachee } from '../../api/seguimiento'
import { getProximaSesionDeCoachee } from '../../api/sesiones'
import { getRetroalimentacionesDeCoachee, type RetroalimentacionCierre } from '../../api/retroalimentacion'
import { resumirCoachee, type ResumenCoacheeEmpresa } from '../../lib/resumenCoacheeEmpresa'
import { nivelProgreso, coloresNivel } from '../../lib/nivelProgreso'
import { resultadoLabel, resultadoTono } from '../../lib/resultadoCiclo'
import { sin404 } from '../../lib/cargaPorCoachee'
import { useCarga } from '../../lib/useCarga'
import { promedioPorBloque, promedioGeneral } from '../../lib/retroalimentacionResumen'
import { iniciales } from '../../lib/avatar'

interface FilaCoachee {
  coachee: CoacheeListItem
  resumen: ResumenCoacheeEmpresa
  objetivoGeneral: string | null
  ciclos: Ciclo[]
  cicloActual: Ciclo | null
  retroalimentaciones: RetroalimentacionCierre[]
  // true si alguna llamada del coachee falló: sus alertas no son confiables.
  incompleto: boolean
}

const route = useRoute()
const router = useRouter()

const filas = ref<FilaCoachee[]>([])

type VistaLista = 'activos' | 'cerrados'
const vista = ref<VistaLista>('activos')

const modalProgreso = ref<FilaCoachee | null>(null)
const modalHistorial = ref<FilaCoachee | null>(null)
const modalCertificados = ref<FilaCoachee | null>(null)
const certificadoPreview = ref<Ciclo | null>(null)
const modalFeedback = ref<FilaCoachee | null>(null)
const modalDocumentos = ref<FilaCoachee | null>(null)

const formatoFecha = (fecha: string) =>
  new Date(fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })

async function cargarFila(coachee: CoacheeListItem): Promise<FilaCoachee> {
  // Cada llamada se tolera por separado: un error puntual en una no tumba la lista. `undefined`
  // = falló de verdad (un 404 de "sin plan" se resuelve a null y no cuenta como fallo).
  const [plan, ciclos, avanceRes, proximaSesion, retroalimentaciones] = await Promise.all([
    tolerar(getPlanByCoachee(coachee.id).then((v) => v ?? null, sin404(null))),
    tolerar(getCiclosDeCoachee(coachee.id).then((v) => v ?? [])),
    tolerar(getAvanceDeCoachee(coachee.id).then((v) => v ?? { avance: null })),
    tolerar(getProximaSesionDeCoachee(coachee.id).then((v) => v ?? null)),
    tolerar(getRetroalimentacionesDeCoachee(coachee.id).then((v) => v ?? [])),
  ])
  const incompleto = [plan, ciclos, avanceRes, proximaSesion, retroalimentaciones].some((v) => v === undefined)
  const ciclosOk = ciclos ?? []
  const cicloActual = ciclosOk.find((c) => !c.fechaCierre) ?? null
  const resumen = resumirCoachee({
    plan: plan ?? null,
    cicloActual,
    ciclos: ciclosOk,
    avance: avanceRes?.avance ?? null,
    proximaSesion: proximaSesion ?? null,
  })
  // Sin poder consultar la próxima sesión, "sin sesión agendada" sería un falso positivo.
  if (proximaSesion === undefined) resumen.sinProximaSesion = false
  return {
    coachee,
    resumen,
    objetivoGeneral: plan?.objetivoGeneral ?? null,
    ciclos: ciclosOk,
    cicloActual,
    retroalimentaciones: retroalimentaciones ?? [],
    incompleto,
  }
}

const { loading, error, recargar, tolerar } = useCarga(async () => {
  const coachees = await listCoachees()
  filas.value = await Promise.all(coachees.map(cargarFila))
})

onMounted(async () => {
  await recargar()
  if (error.value) return

  // Llega desde "Necesita tu atención" en el Resumen — abre directo el modal de progreso
  // sobre la lista.
  const coacheeId = route.query.coacheeId
  if (typeof coacheeId === 'string') {
    const fila = filas.value.find((f) => f.coachee.id === coacheeId)
    if (fila) {
      vista.value = 'activos'
      modalProgreso.value = fila
    }
    void router.replace({ query: {} })
  }
})

const incompletos = computed(() => filas.value.filter((f) => f.incompleto).length)

// Buscador por nombre + filtro simple "solo con alertas" (aplican a ambas pestañas).
const busqueda = ref('')
const soloConAlertas = ref(false)
const coincide = (f: FilaCoachee) => {
  const q = busqueda.value.trim().toLowerCase()
  if (q && !f.coachee.nombre.toLowerCase().includes(q)) return false
  if (soloConAlertas.value && !(f.resumen.sinProximaSesion || f.resumen.alertaPorVencer)) return false
  return true
}
const hayFiltro = computed(() => busqueda.value.trim() !== '' || soloConAlertas.value)
function limpiarFiltros() {
  busqueda.value = ''
  soloConAlertas.value = false
}

const activosTodos = computed(() => filas.value.filter((f) => f.resumen.estado !== 'completado'))
const cerradosTodos = computed(() => filas.value.filter((f) => f.resumen.estado === 'completado'))
const activos = computed(() => activosTodos.value.filter(coincide))
const cerrados = computed(() => cerradosTodos.value.filter(coincide))

const TABS = computed(() => [
  { key: 'activos' as const, label: 'Activos', icon: 'coachees', badge: activosTodos.value.length },
  { key: 'cerrados' as const, label: 'Procesos cerrados', icon: 'certificado', badge: cerradosTodos.value.length },
])

function ultimoCicloCerrado(fila: FilaCoachee): Ciclo | null {
  const cerrados = fila.ciclos
    .filter((c) => c.fechaCierre)
    .sort((a, b) => new Date(b.fechaCierre!).getTime() - new Date(a.fechaCierre!).getTime())
  return cerrados[0] ?? null
}

function certificadosDe(fila: FilaCoachee): Ciclo[] {
  return fila.ciclos.filter((c) => c.fechaCierre && c.resultado)
}

function abrirHistorial(fila: FilaCoachee) {
  modalHistorial.value = fila
}

function abrirFeedback(fila: FilaCoachee) {
  modalFeedback.value = fila
}

function cicloDeRetro(fila: FilaCoachee, retro: RetroalimentacionCierre): Ciclo | undefined {
  return fila.ciclos.find((c) => c.id === retro.cicloId)
}

function abrirCertificados(fila: FilaCoachee) {
  certificadoPreview.value = null
  modalCertificados.value = fila
}

function cerrarModalCertificados() {
  modalCertificados.value = null
  certificadoPreview.value = null
}
</script>

<template>
  <AppShell>
    <h1 class="mb-1 font-[family-name:var(--font-heading)] text-xl font-semibold">
      Mis coachees
    </h1>
    <p class="mb-4 text-sm text-[var(--color-muted)]">
      El estado y el resultado de cada proceso de coaching de tu equipo.
    </p>
    <SkeletonBlock
      v-if="loading"
      variant="list"
      :rows="4"
    />
    <ErrorState
      v-else-if="error"
      :description="error"
      @retry="recargar"
    />
    <EmptyState
      v-else-if="filas.length === 0"
      icon="coachees"
      title="Todavía no hay coachees asociados a tu empresa"
      description="Cuando tu coach los agregue, van a aparecer acá."
    />
    <div v-else>
      <NotaConfidencialidadEmpresa class="mb-4" />
      <GlosarioEmpresa />

      <p
        v-if="incompletos > 0"
        role="status"
        class="mb-4 rounded-2xl border border-[var(--color-bronze)]/40 bg-[var(--color-bronze)]/10 p-3 text-sm"
      >
        No pudimos cargar datos de {{ incompletos }} {{ incompletos === 1 ? 'persona' : 'personas' }};
        los indicadores pueden estar incompletos.
      </p>

      <div class="mb-4 flex flex-wrap items-center gap-3">
        <TabBar
          :tabs="TABS"
          :model-value="vista"
          @update:model-value="vista = $event"
        />
        <div class="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-3">
          <label
            class="sr-only"
            for="buscar-coachee"
          >Buscar por nombre</label>
          <input
            id="buscar-coachee"
            v-model="busqueda"
            type="search"
            placeholder="Buscar por nombre…"
            class="field-input max-w-xs"
          >
          <label class="flex items-center gap-2 text-sm">
            <input
              v-model="soloConAlertas"
              type="checkbox"
              class="h-4 w-4"
            >
            Solo con alertas
          </label>
        </div>
      </div>

      <EmptyState
        v-if="hayFiltro && (vista === 'activos' ? activos : cerrados).length === 0"
        icon="buscar"
        title="Sin resultados"
        description="Ningún coachee coincide con la búsqueda o el filtro."
      >
        <AppButton
          variant="secondary"
          size="sm"
          @click="limpiarFiltros"
        >
          Limpiar filtros
        </AppButton>
      </EmptyState>
      <EmptyState
        v-else-if="vista === 'activos' && activos.length === 0"
        icon="coachees"
        title="Sin coachees activos"
        description="Todos los procesos de tu equipo están cerrados por ahora."
      />
      <div
        v-else-if="vista === 'activos'"
        class="space-y-3"
      >
        <div
          v-for="fila in activos"
          :key="fila.coachee.id"
          class="rounded-2xl border border-[var(--color-line)] bg-white p-4 transition-shadow hover:shadow-md"
        >
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div class="flex min-w-0 flex-wrap items-center gap-3">
              <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-semibold text-[var(--color-on-primary)]">
                {{ iniciales(fila.coachee.nombre) }}
              </div>
              <div class="min-w-0">
                <p class="truncate font-medium">
                  {{ fila.coachee.nombre }}
                </p>
                <p
                  v-if="fila.coachee.cargo"
                  class="truncate text-xs text-[var(--color-muted)]"
                >
                  {{ fila.coachee.cargo }}
                </p>
                <p class="truncate text-xs text-[var(--color-subtle)]">
                  {{ fila.resumen.competenciaNombre ?? 'Sin competencia definida' }}
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
              <StatusBadge v-if="fila.incompleto">
                Datos incompletos
              </StatusBadge>
            </div>

            <div class="flex flex-wrap items-center gap-x-7 gap-y-3 text-sm">
              <div class="min-w-[130px]">
                <p class="mb-1 text-xs text-[var(--color-subtle)]">
                  Avance
                </p>
                <div
                  v-if="fila.resumen.avance !== null"
                  class="flex items-center gap-2"
                >
                  <div
                    class="h-1.5 w-20 overflow-hidden rounded-full"
                    role="progressbar"
                    aria-label="Avance"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    :aria-valuenow="fila.resumen.avance"
                    :style="{ backgroundColor: coloresNivel[nivelProgreso(fila.resumen.avance)].suave }"
                  >
                    <div
                      class="h-full rounded-full"
                      :style="{ width: `${fila.resumen.avance}%`, backgroundColor: coloresNivel[nivelProgreso(fila.resumen.avance)].fuerte }"
                    />
                  </div>
                  <span
                    class="font-[family-name:var(--font-mono)] text-xs font-medium"
                    :style="{ color: coloresNivel[nivelProgreso(fila.resumen.avance)].fuerte }"
                  >{{ fila.resumen.avance }}%</span>
                </div>
                <span
                  v-else
                  class="text-[var(--color-subtle)]"
                >—</span>
              </div>

              <div>
                <p class="mb-1 text-xs text-[var(--color-subtle)]">
                  Sesiones
                </p>
                <p class="font-medium">
                  {{ fila.cicloActual ? `${fila.cicloActual.sesionesRealizadas} / ${fila.cicloActual.totalSesiones}` : '—' }}
                </p>
              </div>

              <div>
                <p class="mb-1 text-xs text-[var(--color-subtle)]">
                  Próxima sesión
                </p>
                <p class="font-medium">
                  {{ fila.resumen.proximaSesionFecha ? formatoFecha(fila.resumen.proximaSesionFecha) : '—' }}
                </p>
              </div>

              <AppButton
                variant="secondary"
                size="sm"
                @click="modalProgreso = fila"
              >
                <NavIcon
                  name="progreso"
                  :size="14"
                />
                Ver progreso
              </AppButton>
              <AppButton
                variant="secondary"
                size="sm"
                @click="modalDocumentos = fila"
              >
                <NavIcon
                  name="legal"
                  :size="14"
                />
                Documentos
              </AppButton>
            </div>
          </div>
        </div>
      </div>

      <EmptyState
        v-if="!hayFiltro && vista === 'cerrados' && cerrados.length === 0"
        icon="certificado"
        title="Todavía no hay procesos cerrados"
        description="Cuando tu coach cierre un ciclo, va a aparecer acá con su resultado."
      />
      <div
        v-else-if="vista === 'cerrados' && cerrados.length > 0"
        class="space-y-3"
      >
        <div
          v-for="fila in cerrados"
          :key="fila.coachee.id"
          class="rounded-2xl border border-[var(--color-line)] bg-white p-4"
        >
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div class="flex min-w-0 items-center gap-3">
              <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-semibold text-[var(--color-on-primary)]">
                {{ iniciales(fila.coachee.nombre) }}
              </div>
              <div class="min-w-0">
                <p class="truncate font-medium">
                  {{ fila.coachee.nombre }}
                </p>
                <p class="truncate text-xs text-[var(--color-subtle)]">
                  {{ fila.resumen.competenciaNombre ?? 'Sin competencia definida' }}
                </p>
              </div>
              <StatusBadge v-if="fila.incompleto">
                Datos incompletos
              </StatusBadge>
            </div>

            <div class="flex flex-wrap items-center gap-x-7 gap-y-3 text-sm">
              <div>
                <p class="mb-1 text-xs text-[var(--color-subtle)]">
                  Resultado
                </p>
                <StatusBadge
                  v-if="ultimoCicloCerrado(fila)?.resultado"
                  :tone="resultadoTono[ultimoCicloCerrado(fila)!.resultado!]"
                >
                  {{ resultadoLabel[ultimoCicloCerrado(fila)!.resultado!] }}
                </StatusBadge>
                <span
                  v-else
                  class="text-[var(--color-subtle)]"
                >—</span>
              </div>

              <div>
                <p class="mb-1 text-xs text-[var(--color-subtle)]">
                  Inicio
                </p>
                <p class="font-medium">
                  {{ ultimoCicloCerrado(fila)?.fechaApertura ? formatoFecha(ultimoCicloCerrado(fila)!.fechaApertura) : '—' }}
                </p>
              </div>

              <div>
                <p class="mb-1 text-xs text-[var(--color-subtle)]">
                  Cierre
                </p>
                <p class="font-medium">
                  {{ ultimoCicloCerrado(fila)?.fechaCierre ? formatoFecha(ultimoCicloCerrado(fila)!.fechaCierre!) : '—' }}
                </p>
              </div>

              <div class="flex flex-wrap gap-2">
                <AppButton
                  variant="secondary"
                  size="sm"
                  @click="abrirHistorial(fila)"
                >
                  <NavIcon
                    name="auditoria"
                    :size="14"
                  />
                  Historial
                </AppButton>
                <AppButton
                  v-if="certificadosDe(fila).length > 0"
                  variant="secondary"
                  size="sm"
                  @click="abrirCertificados(fila)"
                >
                  <NavIcon
                    name="certificado"
                    :size="14"
                  />
                  Certificado
                </AppButton>
                <AppButton
                  v-if="fila.retroalimentaciones.length > 0"
                  variant="secondary"
                  size="sm"
                  @click="abrirFeedback(fila)"
                >
                  <NavIcon
                    name="satisfaccion"
                    :size="14"
                  />
                  Feedback
                </AppButton>
              </div>
            </div>
          </div>

          <ImpactoNegocioCallout
            class="mt-4"
            :impacto="ultimoCicloCerrado(fila)?.impactoNegocio ?? null"
          />
        </div>
      </div>
    </div>

    <!-- Modal: Ver progreso -->
    <AppModal
      v-if="modalProgreso"
      title="Progreso"
      @close="modalProgreso = null"
    >
      <div class="mb-4 flex items-center gap-3">
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-semibold text-[var(--color-on-primary)]">
          {{ iniciales(modalProgreso.coachee.nombre) }}
        </div>
        <div class="min-w-0">
          <p class="truncate text-sm font-medium">
            {{ modalProgreso.coachee.nombre }}
          </p>
          <p class="truncate text-xs text-[var(--color-muted)]">
            {{ modalProgreso.resumen.competenciaNombre ?? 'Sin competencia definida' }}
          </p>
        </div>
      </div>

      <div class="mb-4 flex items-center gap-2">
        <NavIcon
          name="progreso"
          :size="14"
          class="text-[var(--color-muted)]"
        />
        <p class="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
          Avance general
        </p>
      </div>
      <EmptyState
        v-if="modalProgreso.resumen.avance === null"
        icon="progreso"
        title="Todavía no hay autoevaluaciones"
        description="El avance se calcula con las autoevaluaciones del coachee en cada post-sesión."
      />
      <ProgresoActual
        v-else
        class="mb-5"
        :valor="modalProgreso.resumen.avance / 10"
        audiencia="coachee"
        compacto
      />

      <div
        v-if="modalProgreso.cicloActual"
        class="border-t border-[var(--color-line)] pt-4"
      >
        <div class="mb-3 flex items-center gap-2">
          <NavIcon
            name="sesiones"
            :size="14"
            class="text-[var(--color-muted)]"
          />
          <p class="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
            Ciclo en curso
          </p>
        </div>
        <p class="mb-3 text-sm">
          Sesiones: <strong>{{ modalProgreso.cicloActual.sesionesRealizadas }}</strong> de {{ modalProgreso.cicloActual.totalSesiones }}
        </p>
        <div class="rounded-lg bg-[var(--color-parchment)]/40 p-3 text-sm">
          <p class="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
            Resumen de reunión inicial
          </p>
          {{ modalProgreso.cicloActual.resumenReunionInicial ?? 'Aún no redactado por el coach.' }}
        </div>
      </div>
    </AppModal>

    <!-- Modal: Documentos del proceso (compartidos con el coach y el coachee) -->
    <AppModal
      v-if="modalDocumentos"
      title="Documentos del proceso"
      size="lg"
      @close="modalDocumentos = null"
    >
      <p class="mb-1 text-sm font-medium">
        {{ modalDocumentos.coachee.nombre }}
      </p>
      <p class="mb-4 text-xs text-[var(--color-muted)]">
        Lo que subas aquí lo ven el coach y el coachee; si el coachee ya lo subió, aparece en la lista.
      </p>
      <DocumentosCoacheePanel :coachee-id="modalDocumentos.coachee.id" />
    </AppModal>

    <!-- Modal: Ver historial -->
    <AppModal
      v-if="modalHistorial"
      title="Historial de ciclos"
      size="lg"
      @close="modalHistorial = null"
    >
      <p class="mb-4 text-sm font-medium">
        {{ modalHistorial.coachee.nombre }}
      </p>
      <HistorialCiclos :ciclos="modalHistorial.ciclos.filter((c) => c.fechaCierre)" />
    </AppModal>

    <!-- Modal: Ver certificados -->
    <AppModal
      v-if="modalCertificados"
      :title="certificadoPreview ? 'Vista previa del certificado' : 'Certificados'"
      size="lg"
      @close="cerrarModalCertificados"
    >
      <template v-if="certificadoPreview">
        <CertificadoContenido
          :nombre-coachee="modalCertificados.coachee.nombre"
          :objetivo="modalCertificados.objetivoGeneral ?? 'su plan de desarrollo'"
          :resultado="certificadoPreview.resultado!"
          :fecha-apertura="certificadoPreview.fechaApertura"
          :fecha-cierre="certificadoPreview.fechaCierre!"
        />
        <div class="mt-4 flex justify-end gap-2">
          <AppButton
            variant="secondary"
            @click="certificadoPreview = null"
          >
            ← Volver
          </AppButton>
          <RouterLink
            v-slot="{ navigate }"
            custom
            :to="{ name: 'empresa-certificado', params: { coacheeId: modalCertificados.coachee.id, cicloId: certificadoPreview.id } }"
          >
            <AppButton @click="navigate">
              Imprimir / Guardar como PDF
            </AppButton>
          </RouterLink>
        </div>
      </template>
      <div
        v-else
        class="space-y-2"
      >
        <div
          v-for="c in certificadosDe(modalCertificados)"
          :key="c.id"
          class="flex flex-col gap-3 rounded-xl border border-[var(--color-line)] p-3 sm:flex-row sm:items-center"
        >
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium">
              Certificado de finalización
            </p>
            <p class="flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
              <span>Ciclo cerrado el {{ formatoFecha(c.fechaCierre!) }}</span>
              <StatusBadge :tone="resultadoTono[c.resultado!]">
                {{ resultadoLabel[c.resultado!] }}
              </StatusBadge>
            </p>
          </div>
          <AppButton
            variant="secondary"
            size="sm"
            class="shrink-0"
            @click="certificadoPreview = c"
          >
            Vista previa
          </AppButton>
        </div>
      </div>
    </AppModal>

    <!-- Modal: Feedback del coachee al cierre -->
    <AppModal
      v-if="modalFeedback"
      title="Feedback del coachee"
      size="lg"
      @close="modalFeedback = null"
    >
      <p class="mb-4 text-sm font-medium">
        {{ modalFeedback.coachee.nombre }}
      </p>
      <div class="space-y-4">
        <div
          v-for="retro in modalFeedback.retroalimentaciones"
          :key="retro.id"
          class="rounded-xl border border-[var(--color-line)] p-3 text-sm"
        >
          <p class="mb-2 text-xs text-[var(--color-muted)]">
            <template v-if="cicloDeRetro(modalFeedback, retro)?.fechaCierre">
              Ciclo cerrado el {{ formatoFecha(cicloDeRetro(modalFeedback, retro)!.fechaCierre!) }} ·
            </template>
            Promedio general <strong>{{ promedioGeneral(retro.respuestas) }}/5</strong>
          </p>
          <ul class="mb-2 flex flex-wrap gap-2 text-xs">
            <li
              v-for="pb in promedioPorBloque(retro.respuestas)"
              :key="pb.bloque"
              class="rounded-full bg-[var(--color-parchment)]/60 px-2.5 py-1"
            >
              {{ pb.bloque }}: <strong>{{ pb.promedio }}/5</strong>
            </li>
          </ul>
          <p
            v-if="retro.loQueMasGusto"
            class="mt-1"
          >
            <strong>Lo que más le gustó:</strong> {{ retro.loQueMasGusto }}
          </p>
          <p
            v-if="retro.mayoresAprendizajes"
            class="mt-1"
          >
            <strong>Mayores aprendizajes:</strong> {{ retro.mayoresAprendizajes }}
          </p>
          <p
            v-if="retro.sugerencias"
            class="mt-1"
          >
            <strong>Sugerencias:</strong> {{ retro.sugerencias }}
          </p>
          <p
            v-if="retro.otrosComentarios"
            class="mt-1"
          >
            <strong>Otros comentarios:</strong> {{ retro.otrosComentarios }}
          </p>
        </div>
      </div>
    </AppModal>
  </AppShell>
</template>
