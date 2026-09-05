<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppShell from '../../components/AppShell.vue'
import SectionCard from '../../components/SectionCard.vue'
import EmptyState from '../../components/EmptyState.vue'
import AppModal from '../../components/AppModal.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import {
  crearEncuesta,
  crearSolicitud,
  getMisEncuestas,
  getMisSolicitudes,
  type Encuesta,
  type SolicitudProceso,
} from '../../api/satisfaccion'
import { getCategoriasSatisfaccion } from '../../api/configuracion'
import { listCoachees, type CoacheeListItem } from '../../api/coachees'
import { getCiclosDeCoachee, type Ciclo } from '../../api/ciclos'
import { ApiError } from '../../api/client'

interface CicloPendiente {
  coachee: CoacheeListItem
  ciclo: Ciclo
}

const loading = ref(true)
const encuestas = ref<Encuesta[]>([])
const solicitudes = ref<SolicitudProceso[]>([])
const categorias = ref<string[]>([])
const pendientes = ref<CicloPendiente[]>([])
const error = ref<string | null>(null)

const nombreSugerido = ref('')
const mensajeSolicitud = ref('')
const enviandoSolicitud = ref(false)

const formatoFecha = (fecha: string) =>
  new Date(fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })

async function load() {
  loading.value = true
  const [enc, sol, cats, coachees] = await Promise.all([
    getMisEncuestas(),
    getMisSolicitudes(),
    getCategoriasSatisfaccion(),
    listCoachees(),
  ])
  const ciclosPorCoachee = await Promise.all(coachees.map((c) => getCiclosDeCoachee(c.id)))
  const cicloIdsConEncuesta = new Set(enc.map((e) => e.cicloId).filter((id): id is string => !!id))

  encuestas.value = enc
  solicitudes.value = sol
  categorias.value = cats
  pendientes.value = coachees.flatMap((coachee, i) =>
    ciclosPorCoachee[i]
      .filter((ciclo) => ciclo.fechaCierre && !cicloIdsConEncuesta.has(ciclo.id))
      .map((ciclo) => ({ coachee, ciclo })),
  )
  loading.value = false
}

onMounted(load)

// --- Modal de encuesta por ciclo ---
const modalCiclo = ref<CicloPendiente | null>(null)
const respuestasEncuesta = ref<Record<string, number>>({})
const comentarioEncuesta = ref('')
const enviandoEncuesta = ref(false)
const errorEncuesta = ref<string | null>(null)

function abrirEncuesta(pendiente: CicloPendiente) {
  modalCiclo.value = pendiente
  respuestasEncuesta.value = {}
  comentarioEncuesta.value = ''
  errorEncuesta.value = null
}

async function enviarEncuesta() {
  const pendiente = modalCiclo.value
  if (!pendiente) return
  const respuestas = categorias.value
    .map((categoria) => ({ categoria, valor: respuestasEncuesta.value[categoria] }))
    .filter((r): r is { categoria: string; valor: number } => typeof r.valor === 'number')
  if (respuestas.length < categorias.value.length) {
    errorEncuesta.value = 'Califica todas las categorías antes de enviar.'
    return
  }
  enviandoEncuesta.value = true
  errorEncuesta.value = null
  try {
    const creada = await crearEncuesta(pendiente.ciclo.id, respuestas, comentarioEncuesta.value || undefined)
    encuestas.value = [creada, ...encuestas.value]
    pendientes.value = pendientes.value.filter((p) => p.ciclo.id !== pendiente.ciclo.id)
    modalCiclo.value = null
  } catch (err) {
    errorEncuesta.value = err instanceof ApiError ? err.message : 'No se pudo enviar la encuesta.'
  } finally {
    enviandoEncuesta.value = false
  }
}

const promedioRespuestas = (enc: Encuesta) =>
  enc.respuestas && enc.respuestas.length > 0
    ? Math.round((enc.respuestas.reduce((s, r) => s + r.valor, 0) / enc.respuestas.length) * 10) / 10
    : enc.calificacion

async function enviarSolicitud() {
  if (!nombreSugerido.value.trim()) return
  error.value = null
  enviandoSolicitud.value = true
  try {
    await crearSolicitud(nombreSugerido.value, mensajeSolicitud.value || undefined)
    nombreSugerido.value = ''
    mensajeSolicitud.value = ''
    solicitudes.value = await getMisSolicitudes()
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo enviar la solicitud.'
  } finally {
    enviandoSolicitud.value = false
  }
}
</script>

<template>
  <AppShell>
    <h1 class="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold">
      Satisfacción y procesos
    </h1>

    <SkeletonBlock v-if="loading" />
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
        title="Encuesta de satisfacción"
        icon="satisfaccion"
      >
        <p class="mb-4 text-xs text-[var(--color-ink)]/60">
          Evalúa cada proceso de coaching una vez cerrado — mide tu satisfacción como empresa
          con ese proceso puntual. Es distinta de la retroalimentación que llena el propio
          coachee sobre su experiencia personal.
        </p>

        <p class="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">
          Pendientes de evaluar
        </p>
        <EmptyState
          v-if="pendientes.length === 0"
          icon="satisfaccion"
          title="No tienes procesos pendientes de evaluar"
          description="Cuando se cierre un nuevo proceso de coaching, aparecerá aquí para que lo evalúes."
        />
        <ul
          v-else
          class="mb-4 space-y-2"
        >
          <li
            v-for="p in pendientes"
            :key="p.ciclo.id"
            class="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-line)] p-3"
          >
            <span class="text-sm">
              <span class="font-medium">{{ p.coachee.nombre }}</span>
              — proceso cerrado el {{ formatoFecha(p.ciclo.fechaCierre!) }}
            </span>
            <button
              class="shrink-0 rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs hover:bg-[var(--color-parchment)]/50"
              @click="abrirEncuesta(p)"
            >
              Completar encuesta
            </button>
          </li>
        </ul>

        <p class="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">
          Respondidas
        </p>
        <p
          v-if="encuestas.length === 0"
          class="text-sm text-[var(--color-ink)]/60"
        >
          Todavía no has respondido ninguna encuesta.
        </p>
        <ul
          v-else
          class="space-y-2 text-sm"
        >
          <li
            v-for="e in encuestas"
            :key="e.id"
            class="rounded-xl border border-[var(--color-line)] p-3"
          >
            <div class="mb-1 flex flex-wrap items-center justify-between gap-2">
              <span class="font-medium">
                {{ e.ciclo?.coachee?.nombre ?? 'Encuesta general (sin ciclo asociado)' }}
              </span>
              <span class="font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink)]/50">
                {{ new Date(e.createdAt).toLocaleDateString('es-CL') }} — {{ promedioRespuestas(e) }} ★
              </span>
            </div>
            <ul
              v-if="e.respuestas"
              class="mb-1 space-y-0.5 text-xs text-[var(--color-ink)]/70"
            >
              <li
                v-for="r in e.respuestas"
                :key="r.categoria"
              >
                {{ r.categoria }}: {{ r.valor }}/5
              </li>
            </ul>
            <p v-if="e.comentario">
              {{ e.comentario }}
            </p>
          </li>
        </ul>
      </SectionCard>

      <SectionCard
        title="Solicitar un nuevo proceso"
        icon="contacto"
      >
        <form
          class="mb-4 space-y-2"
          @submit.prevent="enviarSolicitud"
        >
          <label class="block text-xs text-[var(--color-ink)]/60">
            Nombre de la persona sugerida
            <input
              v-model="nombreSugerido"
              type="text"
              required
              class="mt-1 block w-full rounded border border-[var(--color-line)] px-2 py-1 text-sm"
            >
          </label>
          <label class="block text-xs text-[var(--color-ink)]/60">
            Mensaje (opcional)
            <textarea
              v-model="mensajeSolicitud"
              rows="2"
              class="mt-1 block w-full rounded border border-[var(--color-line)] px-2 py-1 text-sm"
            />
          </label>
          <button
            type="submit"
            :disabled="enviandoSolicitud"
            class="rounded-lg bg-[var(--color-ink)] px-3 py-2 text-xs text-[var(--color-parchment)] disabled:opacity-50"
          >
            Enviar solicitud
          </button>
        </form>

        <p
          v-if="solicitudes.length === 0"
          class="text-sm text-[var(--color-ink)]/60"
        >
          Todavía no has solicitado ningún proceso nuevo.
        </p>
        <ul
          v-else
          class="space-y-1 text-sm"
        >
          <li
            v-for="s in solicitudes"
            :key="s.id"
          >
            <span class="font-[family-name:var(--font-mono)] text-[var(--color-ink)]/50">{{ new Date(s.createdAt).toLocaleDateString('es-CL') }}</span>
            — {{ s.nombreSugerido }}
            <span
              class="rounded-full px-2 py-0.5 text-xs"
              :class="s.estado === 'atendida' ? 'bg-[var(--color-sage)]/20 text-[var(--color-sage)]' : 'bg-[var(--color-bronze)]/20 text-[var(--color-bronze)]'"
            >
              {{ s.estado === 'atendida' ? 'Atendida' : 'Pendiente' }}
            </span>
          </li>
        </ul>
      </SectionCard>
    </div>

    <AppModal
      v-if="modalCiclo"
      title="Encuesta de satisfacción del proceso"
      @close="modalCiclo = null"
    >
      <form
        class="space-y-4"
        @submit.prevent="enviarEncuesta"
      >
        <p
          v-if="errorEncuesta"
          class="text-sm text-[var(--color-danger)]"
        >
          {{ errorEncuesta }}
        </p>
        <p class="text-xs text-[var(--color-ink)]/60">
          {{ modalCiclo.coachee.nombre }} — proceso cerrado el
          {{ formatoFecha(modalCiclo.ciclo.fechaCierre!) }}. Evalúa de 1 (nada de acuerdo) a 5
          (totalmente de acuerdo).
        </p>
        <div
          v-for="categoria in categorias"
          :key="categoria"
          class="flex flex-col gap-1 rounded-lg border border-[var(--color-line)] p-2 text-xs sm:flex-row sm:items-center sm:justify-between"
        >
          <span class="sm:max-w-[70%]">{{ categoria }}</span>
          <div class="flex gap-1">
            <button
              v-for="valor in [1, 2, 3, 4, 5]"
              :key="valor"
              type="button"
              class="h-7 w-7 shrink-0 rounded-full border text-xs"
              :class="respuestasEncuesta[categoria] === valor
                ? 'border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-parchment)]'
                : 'border-[var(--color-line)]'"
              @click="respuestasEncuesta[categoria] = valor"
            >
              {{ valor }}
            </button>
          </div>
        </div>

        <label class="block text-sm">
          Comentario (opcional)
          <textarea
            v-model="comentarioEncuesta"
            rows="2"
            class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
          />
        </label>

        <div class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            class="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm"
            @click="modalCiclo = null"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="enviandoEncuesta"
            class="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm text-[var(--color-parchment)] disabled:opacity-60"
          >
            {{ enviandoEncuesta ? 'Enviando…' : 'Enviar encuesta' }}
          </button>
        </div>
      </form>
    </AppModal>
  </AppShell>
</template>
