<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppShell from '../../components/AppShell.vue'
import SectionCard from '../../components/SectionCard.vue'
import EmptyState from '../../components/EmptyState.vue'
import AppModal from '../../components/AppModal.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import ErrorState from '../../components/ErrorState.vue'
import AppButton from '../../components/AppButton.vue'
import FormField from '../../components/FormField.vue'
import StatusBadge from '../../components/StatusBadge.vue'
import NavIcon from '../../components/NavIcon.vue'
import { useCarga } from '../../lib/useCarga'
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

const encuestas = ref<Encuesta[]>([])
const solicitudes = ref<SolicitudProceso[]>([])
const categorias = ref<string[]>([])
const pendientes = ref<CicloPendiente[]>([])
const errorSolicitud = ref<string | null>(null)
const personasSinRevisar = ref(0)

const nombreSugerido = ref('')
const mensajeSolicitud = ref('')
const enviandoSolicitud = ref(false)

const formatoFecha = (fecha: string) =>
  new Date(fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })

const { loading, error, recargar, tolerar } = useCarga(async () => {
  const [enc, sol, cats, coachees] = await Promise.all([
    getMisEncuestas(),
    getMisSolicitudes(),
    getCategoriasSatisfaccion(),
    listCoachees(),
  ])
  // Los ciclos de cada persona se toleran por separado: si uno falla se avisa en vez de
  // tumbar la pantalla, pero tampoco se afirma que "no hay nada pendiente" para esa persona.
  const ciclosPorCoachee = await Promise.all(coachees.map((c) => tolerar(getCiclosDeCoachee(c.id))))
  personasSinRevisar.value = ciclosPorCoachee.filter((c) => c === undefined).length
  const cicloIdsConEncuesta = new Set(enc.map((e) => e.cicloId).filter((id): id is string => !!id))

  encuestas.value = enc
  solicitudes.value = sol
  categorias.value = cats
  pendientes.value = coachees.flatMap((coachee, i) =>
    (ciclosPorCoachee[i] ?? [])
      .filter((ciclo) => ciclo.fechaCierre && !cicloIdsConEncuesta.has(ciclo.id))
      .map((ciclo) => ({ coachee, ciclo })),
  )
})

onMounted(recargar)

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
  errorSolicitud.value = null
  enviandoSolicitud.value = true
  try {
    await crearSolicitud(nombreSugerido.value, mensajeSolicitud.value || undefined)
    nombreSugerido.value = ''
    mensajeSolicitud.value = ''
    solicitudes.value = await getMisSolicitudes()
  } catch (err) {
    errorSolicitud.value = err instanceof ApiError ? err.message : 'No se pudo enviar la solicitud.'
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

    <SkeletonBlock
      v-if="loading"
      variant="cards"
      :rows="2"
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
      <p
        v-if="personasSinRevisar > 0"
        role="status"
        class="rounded-2xl border border-[var(--color-bronze)]/40 bg-[var(--color-bronze)]/10 p-3 text-sm"
      >
        No pudimos revisar los procesos de {{ personasSinRevisar }}
        {{ personasSinRevisar === 1 ? 'persona' : 'personas' }}; puede haber encuestas pendientes que no aparecen aquí.
      </p>

      <SectionCard
        title="Encuesta de satisfacción"
        icon="satisfaccion"
      >
        <p class="mb-4 text-xs text-[var(--color-muted)]">
          Evalúa cada proceso de coaching una vez cerrado — mide tu satisfacción como empresa
          con ese proceso puntual. Es distinta de la retroalimentación que llena el propio
          coachee sobre su experiencia personal.
        </p>

        <p class="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-subtle)]">
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
            <AppButton
              variant="secondary"
              size="sm"
              class="shrink-0"
              @click="abrirEncuesta(p)"
            >
              Completar encuesta
            </AppButton>
          </li>
        </ul>

        <p class="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-subtle)]">
          Respondidas
        </p>
        <p
          v-if="encuestas.length === 0"
          class="text-sm text-[var(--color-muted)]"
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
              <span class="font-[family-name:var(--font-mono)] text-xs text-[var(--color-subtle)]">
                <span class="inline-flex items-center gap-1">
                  {{ new Date(e.createdAt).toLocaleDateString('es-CL') }} — {{ promedioRespuestas(e) }}
                  <NavIcon
                    name="satisfaccion"
                    :size="12"
                    aria-hidden="true"
                  />
                  <span class="sr-only">de 5</span>
                </span>
              </span>
            </div>
            <ul
              v-if="e.respuestas"
              class="mb-1 space-y-0.5 text-xs text-[var(--color-muted)]"
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
          class="mb-4 space-y-3"
          @submit.prevent="enviarSolicitud"
        >
          <p
            v-if="errorSolicitud"
            role="alert"
            class="text-sm text-[var(--color-danger)]"
          >
            {{ errorSolicitud }}
          </p>
          <FormField
            v-slot="{ id }"
            label="Nombre de la persona sugerida"
          >
            <input
              :id="id"
              v-model="nombreSugerido"
              type="text"
              required
              class="field-input"
            >
          </FormField>
          <FormField
            v-slot="{ id }"
            label="Mensaje (opcional)"
          >
            <textarea
              :id="id"
              v-model="mensajeSolicitud"
              rows="2"
              class="field-input"
            />
          </FormField>
          <AppButton
            type="submit"
            size="sm"
            :loading="enviandoSolicitud"
          >
            Enviar solicitud
          </AppButton>
        </form>

        <p
          v-if="solicitudes.length === 0"
          class="text-sm text-[var(--color-muted)]"
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
            <span class="font-[family-name:var(--font-mono)] text-[var(--color-subtle)]">{{ new Date(s.createdAt).toLocaleDateString('es-CL') }}</span>
            — {{ s.nombreSugerido }}
            <StatusBadge :tone="s.estado === 'atendida' ? 'sage' : 'bronze'">
              {{ s.estado === 'atendida' ? 'Atendida' : 'Pendiente' }}
            </StatusBadge>
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
        <p class="text-xs text-[var(--color-muted)]">
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
              :aria-label="`${categoria}: ${valor} de 5`"
              :aria-pressed="respuestasEncuesta[categoria] === valor"
              class="h-9 w-9 shrink-0 rounded-full border text-xs"
              :class="respuestasEncuesta[categoria] === valor
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                : 'border-[var(--color-line)]'"
              @click="respuestasEncuesta[categoria] = valor"
            >
              {{ valor }}
            </button>
          </div>
        </div>

        <FormField
          v-slot="{ id }"
          label="Comentario (opcional)"
        >
          <textarea
            :id="id"
            v-model="comentarioEncuesta"
            rows="2"
            class="field-input"
          />
        </FormField>

        <div class="flex justify-end gap-2 pt-2">
          <AppButton
            variant="secondary"
            @click="modalCiclo = null"
          >
            Cancelar
          </AppButton>
          <AppButton
            type="submit"
            :loading="enviandoEncuesta"
          >
            {{ enviandoEncuesta ? 'Enviando…' : 'Enviar encuesta' }}
          </AppButton>
        </div>
      </form>
    </AppModal>
  </AppShell>
</template>
