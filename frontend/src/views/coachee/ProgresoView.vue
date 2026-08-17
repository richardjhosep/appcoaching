<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppShell from '../../components/AppShell.vue'
import ProgresoLineaTiempo from '../../components/ProgresoLineaTiempo.vue'
import HistorialCiclos from '../../components/HistorialCiclos.vue'
import SectionCard from '../../components/SectionCard.vue'
import EmptyState from '../../components/EmptyState.vue'
import NavIcon from '../../components/NavIcon.vue'
import AppModal from '../../components/AppModal.vue'
import CertificadoContenido from '../../components/CertificadoContenido.vue'
import {
  addEntradaDiario,
  addLogro,
  getMiAvance,
  getMisEntradasDiario,
  getMiLineaProgreso,
  getMisLogros,
  removeLogro,
  type Diario,
  type Logro,
  type PuntoProgreso,
} from '../../api/seguimiento'
import { getMisCiclos, type Ciclo } from '../../api/ciclos'
import { getMyCoachee, type Coachee } from '../../api/coachees'
import { getOwnPlan, type PlanDesarrollo } from '../../api/planesDesarrollo'
import { ApiError } from '../../api/client'
import { notifyError, notifySuccess } from '../../lib/notify'
import { nivelProgreso, coloresNivel } from '../../lib/nivelProgreso'
import { resultadoLabel } from '../../lib/resultadoCiclo'

const loading = ref(true)
const avance = ref<number | null>(null)
const puntos = ref<PuntoProgreso[]>([])
const logros = ref<Logro[]>([])
const ciclos = ref<Ciclo[]>([])
const certificados = ref<Ciclo[]>([])
const coachee = ref<Coachee | null>(null)
const plan = ref<PlanDesarrollo | null>(null)
const previewCiclo = ref<Ciclo | null>(null)
const nuevaFecha = ref('')
const nuevaDescripcion = ref('')
const diarioEntradas = ref<Diario[]>([])
const nuevaEntradaDiario = ref('')
const guardandoDiario = ref(false)
const error = ref<string | null>(null)

const coloresAvance = computed(() => coloresNivel[nivelProgreso(avance.value ?? 0)])
const ciclosCerrados = computed(() => ciclos.value.filter((c) => c.fechaCierre))

async function load() {
  loading.value = true
  const [a, p, l, d, cs, co, pl] = await Promise.all([
    getMiAvance(),
    getMiLineaProgreso(),
    getMisLogros(),
    getMisEntradasDiario(),
    getMisCiclos(),
    getMyCoachee().catch(() => null),
    getOwnPlan().catch(() => null),
  ])
  avance.value = a.avance
  puntos.value = p
  logros.value = l
  diarioEntradas.value = d
  ciclos.value = cs
  certificados.value = cs.filter((c) => c.fechaCierre && c.resultado)
  coachee.value = co
  plan.value = pl
  loading.value = false
}

onMounted(load)

async function agregarLogro() {
  if (!nuevaFecha.value || !nuevaDescripcion.value.trim()) return
  try {
    const logro = await addLogro(nuevaFecha.value, nuevaDescripcion.value.trim())
    logros.value = [logro, ...logros.value]
    nuevaFecha.value = ''
    nuevaDescripcion.value = ''
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo agregar el logro.'
  }
}

async function borrarLogro(id: string) {
  try {
    await removeLogro(id)
    logros.value = logros.value.filter((l) => l.id !== id)
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo eliminar el logro.'
  }
}

async function agregarEntradaDiario() {
  if (!nuevaEntradaDiario.value.trim()) return
  guardandoDiario.value = true
  try {
    const entrada = await addEntradaDiario(nuevaEntradaDiario.value.trim())
    diarioEntradas.value = [entrada, ...diarioEntradas.value]
    nuevaEntradaDiario.value = ''
    await notifySuccess('Reflexión guardada')
  } catch (err) {
    await notifyError('No se pudo guardar la reflexión', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  } finally {
    guardandoDiario.value = false
  }
}
</script>

<template>
  <AppShell>
    <h1 class="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold">
      Mi progreso
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
      <p
        v-if="error"
        class="text-sm text-[var(--color-danger)]"
      >
        {{ error }}
      </p>

      <SectionCard
        title="Avance general"
        icon="progreso"
      >
        <EmptyState
          v-if="avance === null"
          icon="progreso"
          title="Aún no te has autoevaluado"
          description="El avance general se calcula con las autoevaluaciones que completas en cada post-sesión."
        />
        <template v-else>
          <p
            class="mb-2 font-[family-name:var(--font-mono)] text-3xl"
            :class="coloresAvance.texto"
          >
            {{ avance }}%
          </p>
          <div
            class="h-2.5 w-full overflow-hidden rounded-full"
            :style="{ backgroundColor: coloresAvance.suave }"
            role="progressbar"
            :aria-valuenow="avance ?? 0"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <div
              class="h-full rounded-full transition-all"
              :style="{ width: `${avance}%`, backgroundColor: coloresAvance.fuerte }"
            />
          </div>
        </template>
      </SectionCard>

      <SectionCard
        title="Línea de tiempo (cercanía al objetivo por sesión)"
        icon="objetivo"
      >
        <ProgresoLineaTiempo :puntos="puntos" />
      </SectionCard>

      <SectionCard
        v-if="ciclosCerrados.length > 0"
        title="Historial de ciclos"
        icon="objetivo"
      >
        <HistorialCiclos :ciclos="ciclosCerrados" />
      </SectionCard>

      <SectionCard
        v-if="certificados.length > 0"
        title="Certificados"
        icon="certificado"
      >
        <div class="space-y-2">
          <div
            v-for="c in certificados"
            :key="c.id"
            class="flex flex-col gap-3 rounded-xl border border-[var(--color-line)] bg-white p-3 sm:flex-row sm:items-center"
          >
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-parchment)] text-[var(--color-spark)]">
              <NavIcon
                name="certificado"
                :size="20"
              />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium">
                Certificado de finalización
              </p>
              <p class="flex flex-wrap items-center gap-2 text-xs text-[var(--color-ink)]/60">
                <span>Ciclo cerrado el {{ new Date(c.fechaCierre!).toLocaleDateString('es-CL') }}</span>
                <span class="rounded-full bg-[var(--color-parchment)] px-2 py-0.5">{{ resultadoLabel[c.resultado!] }}</span>
              </p>
            </div>
            <div class="flex shrink-0 gap-2">
              <button
                class="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs hover:bg-[var(--color-parchment)]/50"
                @click="previewCiclo = c"
              >
                Vista previa
              </button>
              <RouterLink
                :to="{ name: 'coachee-certificado', params: { cicloId: c.id } }"
                class="rounded-lg bg-[var(--color-ink)] px-3 py-1.5 text-xs text-[var(--color-parchment)]"
              >
                Descargar
              </RouterLink>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Logros"
        icon="trofeo"
      >
        <TransitionGroup
          name="fade-slide"
          tag="ul"
          class="mb-3 space-y-2"
        >
          <li
            v-for="logro in logros"
            :key="logro.id"
            class="flex items-start justify-between gap-2 text-sm"
          >
            <span class="flex items-start gap-1.5">
              <NavIcon
                name="trofeo"
                :size="14"
                class="mt-0.5 shrink-0 text-[var(--color-spark)]"
              />
              <span>
                <span class="font-[family-name:var(--font-mono)] text-[var(--color-ink)]/50">{{ logro.fecha }}</span>
                — {{ logro.descripcion }}
              </span>
            </span>
            <button
              class="shrink-0 text-xs text-[var(--color-bronze)] hover:underline"
              @click="borrarLogro(logro.id)"
            >
              Quitar
            </button>
          </li>
        </TransitionGroup>
        <div class="flex flex-col gap-2 sm:flex-row">
          <input
            v-model="nuevaFecha"
            type="date"
            class="rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
          >
          <input
            v-model="nuevaDescripcion"
            type="text"
            placeholder="Describe tu logro"
            class="flex-1 rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
            @keyup.enter="agregarLogro"
          >
          <button
            class="rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm hover:bg-[var(--color-parchment)]/50"
            @click="agregarLogro"
          >
            Agregar
          </button>
        </div>
      </SectionCard>

      <SectionCard
        title="Diario de reflexión"
        icon="diario"
      >
        <EmptyState
          v-if="diarioEntradas.length === 0"
          icon="diario"
          title="Todavía no has escrito ninguna reflexión"
          description="Usa este espacio para anotar lo que vas descubriendo entre sesiones."
        />
        <ul
          v-else
          class="mb-4 space-y-2"
        >
          <li
            v-for="entrada in diarioEntradas"
            :key="entrada.id"
            class="rounded-xl border border-[var(--color-line)]/60 bg-[var(--color-parchment)]/40 p-3 text-sm"
          >
            <p class="mb-1 font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink)]/50">
              {{ new Date(entrada.createdAt).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' }) }}
            </p>
            <p class="whitespace-pre-wrap">
              {{ entrada.contenido }}
            </p>
          </li>
        </ul>
        <textarea
          v-model="nuevaEntradaDiario"
          rows="4"
          placeholder="Escribe una nueva reflexión…"
          class="mb-3 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
        />
        <button
          class="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm text-[var(--color-parchment)] disabled:opacity-60"
          :disabled="guardandoDiario || !nuevaEntradaDiario.trim()"
          @click="agregarEntradaDiario"
        >
          {{ guardandoDiario ? 'Guardando…' : 'Guardar' }}
        </button>
      </SectionCard>
    </div>

    <AppModal
      v-if="previewCiclo"
      size="lg"
      title="Vista previa del certificado"
      @close="previewCiclo = null"
    >
      <CertificadoContenido
        :nombre-coachee="coachee?.nombre ?? ''"
        :objetivo="plan?.objetivoGeneral ?? 'su plan de desarrollo'"
        :resultado="previewCiclo.resultado!"
        :fecha-apertura="previewCiclo.fechaApertura"
        :fecha-cierre="previewCiclo.fechaCierre!"
      />
      <div class="mt-4 flex justify-end gap-2">
        <button
          class="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm"
          @click="previewCiclo = null"
        >
          Cerrar
        </button>
        <RouterLink
          :to="{ name: 'coachee-certificado', params: { cicloId: previewCiclo.id } }"
          class="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm text-[var(--color-parchment)]"
        >
          Descargar / Imprimir
        </RouterLink>
      </div>
    </AppModal>
  </AppShell>
</template>
