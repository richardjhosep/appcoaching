<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '../../components/AppShell.vue'
import EmptyState from '../../components/EmptyState.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import TabBar from '../../components/TabBar.vue'
import AppModal from '../../components/AppModal.vue'
import HistorialCiclos from '../../components/HistorialCiclos.vue'
import CertificadoContenido from '../../components/CertificadoContenido.vue'
import ImpactoNegocioCallout from '../../components/ImpactoNegocioCallout.vue'
import NavIcon from '../../components/NavIcon.vue'
import { listCoachees, type CoacheeListItem } from '../../api/coachees'
import { getPlanByCoachee } from '../../api/planesDesarrollo'
import { getCiclosDeCoachee, type Ciclo } from '../../api/ciclos'
import { getAvanceDeCoachee } from '../../api/seguimiento'
import { getProximaSesionDeCoachee } from '../../api/sesiones'
import { getRetroalimentacionesDeCoachee, type RetroalimentacionCierre } from '../../api/retroalimentacion'
import { resumirCoachee, type ResumenCoacheeEmpresa } from '../../lib/resumenCoacheeEmpresa'
import { nivelProgreso, coloresNivel } from '../../lib/nivelProgreso'
import { resultadoLabel, resultadoColor } from '../../lib/resultadoCiclo'
import { promedioPorBloque, promedioGeneral } from '../../lib/retroalimentacionResumen'
import { iniciales } from '../../lib/avatar'

interface FilaCoachee {
  coachee: CoacheeListItem
  resumen: ResumenCoacheeEmpresa
  objetivoGeneral: string | null
  ciclos: Ciclo[]
  cicloActual: Ciclo | null
  retroalimentaciones: RetroalimentacionCierre[]
}

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const filas = ref<FilaCoachee[]>([])

type VistaLista = 'activos' | 'cerrados'
const vista = ref<VistaLista>('activos')

const modalProgreso = ref<FilaCoachee | null>(null)
const modalHistorial = ref<FilaCoachee | null>(null)
const modalCertificados = ref<FilaCoachee | null>(null)
const certificadoPreview = ref<Ciclo | null>(null)
const modalFeedback = ref<FilaCoachee | null>(null)

const formatoFecha = (fecha: string) =>
  new Date(fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })

async function cargarFila(coachee: CoacheeListItem): Promise<FilaCoachee> {
  const [plan, ciclos, avanceRes, proximaSesion, retroalimentaciones] = await Promise.all([
    getPlanByCoachee(coachee.id).catch(() => null),
    getCiclosDeCoachee(coachee.id),
    getAvanceDeCoachee(coachee.id),
    getProximaSesionDeCoachee(coachee.id),
    getRetroalimentacionesDeCoachee(coachee.id),
  ])
  const cicloActual = ciclos.find((c) => !c.fechaCierre) ?? null
  const resumen = resumirCoachee({ plan, cicloActual, ciclos, avance: avanceRes.avance, proximaSesion })
  return { coachee, resumen, objetivoGeneral: plan?.objetivoGeneral ?? null, ciclos, cicloActual, retroalimentaciones }
}

onMounted(async () => {
  loading.value = true
  const coachees = await listCoachees()
  filas.value = await Promise.all(coachees.map(cargarFila))
  loading.value = false

  // Llega desde "Necesita tu atención" en el Resumen — antes navegaba a una página aparte
  // por coachee, ahora abre directo el modal de progreso sobre la lista.
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

const activos = computed(() => filas.value.filter((f) => f.resumen.estado !== 'completado'))
const cerrados = computed(() => filas.value.filter((f) => f.resumen.estado === 'completado'))

const TABS = computed(() => [
  { key: 'activos' as const, label: 'Activos', icon: 'coachees', badge: activos.value.length },
  { key: 'cerrados' as const, label: 'Procesos cerrados', icon: 'certificado', badge: cerrados.value.length },
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
    <p class="mb-4 text-sm text-[var(--color-ink)]/60">
      El estado y el resultado de cada proceso de coaching de tu equipo.
    </p>
    <SkeletonBlock v-if="loading" />
    <EmptyState
      v-else-if="filas.length === 0"
      icon="coachees"
      title="Todavía no hay coachees asociados a tu empresa"
      description="Cuando tu coach los agregue, van a aparecer acá."
    />
    <div v-else>
      <TabBar
        class="mb-4"
        :tabs="TABS"
        :model-value="vista"
        @update:model-value="vista = $event"
      />

      <EmptyState
        v-if="vista === 'activos' && activos.length === 0"
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
            <div class="flex min-w-0 items-center gap-3">
              <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-ink)] text-sm font-semibold text-[var(--color-parchment)]">
                {{ iniciales(fila.coachee.nombre) }}
              </div>
              <div class="min-w-0">
                <p class="truncate font-medium">
                  {{ fila.coachee.nombre }}
                </p>
                <p class="truncate text-xs text-[var(--color-ink)]/50">
                  {{ fila.resumen.competenciaNombre ?? 'Sin competencia definida' }}
                </p>
              </div>
              <span
                v-if="fila.resumen.sinProximaSesion"
                class="shrink-0 rounded-full bg-[var(--color-danger)]/15 px-2.5 py-1 text-xs font-medium text-[var(--color-danger)]"
              >
                Sin sesión agendada
              </span>
              <span
                v-if="fila.resumen.alertaPorVencer"
                class="shrink-0 rounded-full bg-[var(--color-bronze)]/15 px-2.5 py-1 text-xs font-medium text-[var(--color-bronze)]"
              >
                Ciclo por vencer
              </span>
            </div>

            <div class="flex flex-wrap items-center gap-x-7 gap-y-3 text-sm">
              <div class="min-w-[130px]">
                <p class="mb-1 text-xs text-[var(--color-ink)]/50">
                  Avance
                </p>
                <div
                  v-if="fila.resumen.avance !== null"
                  class="flex items-center gap-2"
                >
                  <div
                    class="h-1.5 w-20 overflow-hidden rounded-full"
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
                  class="text-[var(--color-ink)]/40"
                >—</span>
              </div>

              <div>
                <p class="mb-1 text-xs text-[var(--color-ink)]/50">
                  Sesiones
                </p>
                <p class="font-medium">
                  {{ fila.cicloActual ? `${fila.cicloActual.sesionesRealizadas} / ${fila.cicloActual.totalSesiones}` : '—' }}
                </p>
              </div>

              <div>
                <p class="mb-1 text-xs text-[var(--color-ink)]/50">
                  Próxima sesión
                </p>
                <p class="font-medium">
                  {{ fila.resumen.proximaSesionFecha ? formatoFecha(fila.resumen.proximaSesionFecha) : '—' }}
                </p>
              </div>

              <button
                type="button"
                class="flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-3.5 py-2 text-xs font-medium hover:bg-[var(--color-parchment)]/60"
                @click="modalProgreso = fila"
              >
                <NavIcon
                  name="progreso"
                  :size="14"
                />
                Ver progreso
              </button>
            </div>
          </div>
        </div>
      </div>

      <EmptyState
        v-if="vista === 'cerrados' && cerrados.length === 0"
        icon="certificado"
        title="Todavía no hay procesos cerrados"
        description="Cuando tu coach cierre un ciclo, va a aparecer acá con su resultado."
      />
      <div
        v-else-if="vista === 'cerrados'"
        class="space-y-3"
      >
        <div
          v-for="fila in cerrados"
          :key="fila.coachee.id"
          class="rounded-2xl border border-[var(--color-line)] bg-white p-4"
        >
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div class="flex min-w-0 items-center gap-3">
              <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-ink)] text-sm font-semibold text-[var(--color-parchment)]">
                {{ iniciales(fila.coachee.nombre) }}
              </div>
              <div class="min-w-0">
                <p class="truncate font-medium">
                  {{ fila.coachee.nombre }}
                </p>
                <p class="truncate text-xs text-[var(--color-ink)]/50">
                  {{ fila.resumen.competenciaNombre ?? 'Sin competencia definida' }}
                </p>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-x-7 gap-y-3 text-sm">
              <div>
                <p class="mb-1 text-xs text-[var(--color-ink)]/50">
                  Resultado
                </p>
                <span
                  v-if="ultimoCicloCerrado(fila)?.resultado"
                  class="rounded-full px-2.5 py-1 text-xs font-medium"
                  :style="{
                    backgroundColor: `color-mix(in srgb, ${resultadoColor[ultimoCicloCerrado(fila)!.resultado!]} 15%, white)`,
                    color: resultadoColor[ultimoCicloCerrado(fila)!.resultado!],
                  }"
                >
                  {{ resultadoLabel[ultimoCicloCerrado(fila)!.resultado!] }}
                </span>
                <span
                  v-else
                  class="text-[var(--color-ink)]/40"
                >—</span>
              </div>

              <div>
                <p class="mb-1 text-xs text-[var(--color-ink)]/50">
                  Inicio
                </p>
                <p class="font-medium">
                  {{ ultimoCicloCerrado(fila)?.fechaApertura ? formatoFecha(ultimoCicloCerrado(fila)!.fechaApertura) : '—' }}
                </p>
              </div>

              <div>
                <p class="mb-1 text-xs text-[var(--color-ink)]/50">
                  Cierre
                </p>
                <p class="font-medium">
                  {{ ultimoCicloCerrado(fila)?.fechaCierre ? formatoFecha(ultimoCicloCerrado(fila)!.fechaCierre!) : '—' }}
                </p>
              </div>

              <div class="flex gap-2">
                <button
                  type="button"
                  class="flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-3.5 py-2 text-xs font-medium hover:bg-[var(--color-parchment)]/60"
                  @click="abrirHistorial(fila)"
                >
                  <NavIcon
                    name="auditoria"
                    :size="14"
                  />
                  Historial
                </button>
                <button
                  v-if="certificadosDe(fila).length > 0"
                  type="button"
                  class="flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-3.5 py-2 text-xs font-medium hover:bg-[var(--color-parchment)]/60"
                  @click="abrirCertificados(fila)"
                >
                  <NavIcon
                    name="certificado"
                    :size="14"
                  />
                  Certificado
                </button>
                <button
                  v-if="fila.retroalimentaciones.length > 0"
                  type="button"
                  class="flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-3.5 py-2 text-xs font-medium hover:bg-[var(--color-parchment)]/60"
                  @click="abrirFeedback(fila)"
                >
                  <NavIcon
                    name="satisfaccion"
                    :size="14"
                  />
                  Feedback
                </button>
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
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-ink)] text-sm font-semibold text-[var(--color-parchment)]">
          {{ iniciales(modalProgreso.coachee.nombre) }}
        </div>
        <div class="min-w-0">
          <p class="truncate text-sm font-medium">
            {{ modalProgreso.coachee.nombre }}
          </p>
          <p class="truncate text-xs text-[var(--color-ink)]/50">
            {{ modalProgreso.resumen.competenciaNombre ?? 'Sin competencia definida' }}
          </p>
        </div>
      </div>

      <div class="mb-4 flex items-center gap-2">
        <NavIcon
          name="progreso"
          :size="14"
          class="text-[var(--color-ink)]/50"
        />
        <p class="text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">
          Avance general
        </p>
      </div>
      <EmptyState
        v-if="modalProgreso.resumen.avance === null"
        icon="progreso"
        title="Todavía no hay autoevaluaciones"
        description="El avance se calcula con las autoevaluaciones del coachee en cada post-sesión."
      />
      <template v-else>
        <p
          class="mb-2 font-[family-name:var(--font-mono)] text-3xl"
          :style="{ color: coloresNivel[nivelProgreso(modalProgreso.resumen.avance)].fuerte }"
        >
          {{ modalProgreso.resumen.avance }}%
        </p>
        <div
          class="mb-5 h-2.5 w-full overflow-hidden rounded-full"
          :style="{ backgroundColor: coloresNivel[nivelProgreso(modalProgreso.resumen.avance)].suave }"
        >
          <div
            class="h-full rounded-full"
            :style="{ width: `${modalProgreso.resumen.avance}%`, backgroundColor: coloresNivel[nivelProgreso(modalProgreso.resumen.avance)].fuerte }"
          />
        </div>
      </template>

      <div
        v-if="modalProgreso.cicloActual"
        class="border-t border-[var(--color-line)] pt-4"
      >
        <div class="mb-3 flex items-center gap-2">
          <NavIcon
            name="sesiones"
            :size="14"
            class="text-[var(--color-ink)]/50"
          />
          <p class="text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">
            Ciclo en curso
          </p>
        </div>
        <p class="mb-3 text-sm">
          Sesiones: <strong>{{ modalProgreso.cicloActual.sesionesRealizadas }}</strong> de {{ modalProgreso.cicloActual.totalSesiones }}
        </p>
        <div class="rounded-lg bg-[var(--color-parchment)]/40 p-3 text-sm">
          <p class="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">
            Resumen de reunión inicial
          </p>
          {{ modalProgreso.cicloActual.resumenReunionInicial ?? 'Aún no redactado por el coach.' }}
        </div>
      </div>
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
          <button
            class="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm"
            @click="certificadoPreview = null"
          >
            ← Volver
          </button>
          <RouterLink
            :to="{ name: 'empresa-certificado', params: { coacheeId: modalCertificados.coachee.id, cicloId: certificadoPreview.id } }"
            class="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm text-[var(--color-parchment)]"
          >
            Descargar / Imprimir
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
            <p class="flex flex-wrap items-center gap-2 text-xs text-[var(--color-ink)]/60">
              <span>Ciclo cerrado el {{ formatoFecha(c.fechaCierre!) }}</span>
              <span class="rounded-full bg-[var(--color-parchment)] px-2 py-0.5">{{ resultadoLabel[c.resultado!] }}</span>
            </p>
          </div>
          <button
            class="shrink-0 rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs hover:bg-[var(--color-parchment)]/50"
            @click="certificadoPreview = c"
          >
            Vista previa
          </button>
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
          <p class="mb-2 text-xs text-[var(--color-ink)]/50">
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
