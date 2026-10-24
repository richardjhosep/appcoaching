<script setup lang="ts">
import SkeletonBlock from '../../../components/SkeletonBlock.vue'
import { ref, onMounted, watch } from 'vue'
import {
  asignarCompetencia,
  setTrabajarNiveles,
  getPlanByCoachee,
  solicitarCambios,
  type PlanDesarrollo,
} from '../../../api/planesDesarrollo'
import { getAutoevaluacionesDeCoachee, type AutoevaluacionCompetencia } from '../../../api/seguimiento'
import { listCompetenciasParaCoachee, type Competencia } from '../../../api/competencias'
import { ApiError } from '../../../api/client'
import { notifyError, notifySuccess } from '../../../lib/notify'

const props = defineProps<{ coacheeId: string }>()
const emit = defineEmits<{ 'plan-changed': [PlanDesarrollo] }>()

const plan = ref<PlanDesarrollo | null>(null)
const loading = ref(true)
const sinPlan = ref(false)
const error = ref<string | null>(null)
const comentario = ref('')
const acting = ref(false)

const autoevaluaciones = ref<AutoevaluacionCompetencia[]>([])
const competencias = ref<Competencia[]>([])

function competenciaDe(id: string): Competencia | undefined {
  return competencias.value.find((c) => c.id === id)
}

function descripcionNivel(autoeval: AutoevaluacionCompetencia): string | null {
  return (
    competenciaDe(autoeval.competenciaId)?.niveles.find((n) => n.nivel === autoeval.nivel)
      ?.descripcion ?? null
  )
}

const estadoLabel: Record<string, string> = {
  sin_enviar: 'Sin enviar',
  pendiente_aprobacion: 'Pendiente de aprobación',
  aprobado: 'Aprobado',
  cambios_solicitados: 'Cambios solicitados',
}

async function load() {
  loading.value = true
  sinPlan.value = false
  const [autoevals, comps] = await Promise.all([
    getAutoevaluacionesDeCoachee(props.coacheeId),
    // Global + las propias de la empresa de ESTE coachee — misma lista sirve para
    // resolver el nombre/niveles de las autoevaluaciones y para el selector de abajo.
    listCompetenciasParaCoachee(props.coacheeId),
  ])
  autoevaluaciones.value = autoevals
  competencias.value = comps
  try {
    plan.value = await getPlanByCoachee(props.coacheeId)
    competenciaElegida.value = plan.value.competenciaId ?? ''
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      sinPlan.value = true
    } else {
      throw err
    }
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => props.coacheeId, load)

// --- El coach elige y fija la competencia del plan (por coachee, no toda la empresa) ---
const competenciaElegida = ref('')
const asignando = ref(false)

async function asignar() {
  if (!competenciaElegida.value) return
  asignando.value = true
  try {
    await asignarCompetencia(props.coacheeId, competenciaElegida.value)
    // asignarCompetencia() no trae la relación .competencia cargada — se recarga el plan
    // completo (getByCoacheeId sí la trae) para que el nombre se vea de inmediato.
    plan.value = await getPlanByCoachee(props.coacheeId)
    await notifySuccess('Competencia asignada')
  } catch (err) {
    await notifyError(
      'No se pudo asignar la competencia',
      err instanceof ApiError ? err.message : undefined,
    )
  } finally {
    asignando.value = false
  }
}

const guardandoNiveles = ref(false)

async function cambiarTrabajarNiveles(valor: boolean) {
  if (!plan.value) return
  guardandoNiveles.value = true
  try {
    const actualizado = await setTrabajarNiveles(props.coacheeId, valor)
    plan.value = { ...plan.value, trabajarNiveles: actualizado.trabajarNiveles }
    await notifySuccess(valor ? 'El plan medirá niveles' : 'El plan ya no mide niveles')
  } catch (err) {
    await notifyError('No se pudo cambiar la opción', err instanceof ApiError ? err.message : undefined)
  } finally {
    guardandoNiveles.value = false
  }
}

async function enviarSolicitudCambios() {
  if (!comentario.value.trim()) return
  acting.value = true
  error.value = null
  try {
    plan.value = await solicitarCambios(props.coacheeId, comentario.value.trim())
    emit('plan-changed', plan.value)
    comentario.value = ''
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo enviar el comentario.'
  } finally {
    acting.value = false
  }
}
</script>

<template>
  <SkeletonBlock v-if="loading" />
  <p
    v-else-if="sinPlan"
    class="text-sm text-[var(--color-muted)]"
  >
    Este coachee todavía no ha creado su plan de desarrollo.
  </p>
  <div v-else-if="plan">
    <div class="flex items-center gap-2 text-sm text-[var(--color-ink)]/70">
      Estado:
      <span
        class="rounded-full border px-2.5 py-1 text-xs font-semibold"
        :class="plan.estado === 'aprobado'
          ? 'border-[var(--color-sage)]/20 bg-[var(--color-sage)]/10 text-[var(--color-sage)]'
          : plan.estado === 'cambios_solicitados'
            ? 'border-[var(--color-danger)]/20 bg-[var(--color-danger)]/10 text-[var(--color-danger)]'
            : 'border-[var(--color-bronze)]/20 bg-[var(--color-bronze)]/10 text-[var(--color-bronze)]'"
      >
        {{ estadoLabel[plan.estado] }}
      </span>
    </div>

    <p
      v-if="error"
      class="mt-3 text-sm text-[var(--color-danger)]"
    >
      {{ error }}
    </p>

    <div class="items-start mt-6 lg:grid lg:grid-cols-12 lg:gap-6">
      <!-- Columna izquierda: diagnóstico, metas y autoevaluación en un solo panel -->
      <div class="space-y-6 rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-sm lg:col-span-8">
        <h2 class="font-[family-name:var(--font-heading)] text-base font-semibold text-[var(--color-ink)]">
          Plan de desarrollo
        </h2>

        <label class="flex items-start gap-2 rounded-lg bg-[var(--color-parchment)]/50 p-3 text-sm">
          <input
            type="checkbox"
            class="mt-0.5"
            :checked="plan.trabajarNiveles"
            :disabled="guardandoNiveles"
            @change="cambiarTrabajarNiveles(($event.target as HTMLInputElement).checked)"
          >
          <span>
            Trabajar con niveles de competencia
            <span class="block text-xs text-[var(--color-muted)]">
              Si lo desactivas, el coachee define solo objetivo general, competencia asociada y
              estado actual — sin nivel actual/objetivo ni autoevaluación por nivel.
            </span>
          </span>
        </label>

        <div class="grid grid-cols-2 gap-4 border-b border-[var(--color-line)] pb-4 sm:grid-cols-4">
          <div v-if="plan.trabajarNiveles">
            <p class="font-[family-name:var(--font-mono)] text-xs font-semibold uppercase text-[var(--color-muted)]">
              Nivel actual
            </p>
            <p class="text-sm font-bold text-[var(--color-ink)]">
              {{ plan.nivelActual ?? '—' }}
            </p>
          </div>
          <div v-if="plan.trabajarNiveles">
            <p class="font-[family-name:var(--font-mono)] text-xs font-semibold uppercase text-[var(--color-muted)]">
              Nivel objetivo
            </p>
            <p class="font-[family-name:var(--font-mono)] text-sm font-semibold text-[var(--color-sage)]">
              {{ plan.nivelObjetivo ?? '—' }}
            </p>
          </div>
          <div>
            <p class="font-[family-name:var(--font-mono)] text-xs font-semibold uppercase text-[var(--color-muted)]">
              Plazo
            </p>
            <p class="text-sm font-bold text-[var(--color-ink)]">
              {{ plan.plazo ?? '—' }}
            </p>
          </div>
          <div>
            <p class="font-[family-name:var(--font-mono)] text-xs font-semibold uppercase text-[var(--color-muted)]">
              Competencia
            </p>
            <p class="text-sm font-bold text-[var(--color-ink)]">
              {{ plan.competencia?.nombre ?? '—' }}
            </p>
          </div>
        </div>

        <div>
          <p class="mb-1 font-[family-name:var(--font-mono)] text-xs font-semibold uppercase text-[var(--color-muted)]">
            Asignar competencia
          </p>
          <p class="mb-2 text-xs text-[var(--color-muted)]">
            Elige cuál le corresponde desarrollar a este coachee — queda fijada en su plan,
            pero él la puede seguir editando después.
          </p>
          <div class="flex flex-wrap gap-2">
            <select
              v-model="competenciaElegida"
              class="flex-1 rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm focus:border-[var(--color-sage)] focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)]/30"
            >
              <option value="">
                Elige una competencia…
              </option>
              <option
                v-for="c in competencias"
                :key="c.id"
                :value="c.id"
              >
                {{ c.nombre }}{{ c.empresaId ? ' (de la empresa)' : '' }}
              </option>
            </select>
            <button
              class="shrink-0 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm text-[var(--color-on-primary)] disabled:opacity-60"
              :disabled="asignando || !competenciaElegida"
              @click="asignar"
            >
              {{ asignando ? 'Asignando…' : 'Asignar' }}
            </button>
          </div>
        </div>

        <div>
          <p class="mb-1 font-[family-name:var(--font-mono)] text-xs font-semibold uppercase text-[var(--color-muted)]">
            Estado actual
          </p>
          <p class="text-sm text-[var(--color-ink)]">
            {{ plan.descripcionEstadoActual ?? '—' }}
          </p>
        </div>

        <div>
          <p class="mb-1 font-[family-name:var(--font-mono)] text-xs font-semibold uppercase text-[var(--color-muted)]">
            Objetivo general
          </p>
          <p class="border-l-4 border-[var(--color-sage)] py-1 pl-4 text-sm font-semibold text-[var(--color-ink)]">
            «{{ plan.objetivoGeneral ?? 'Sin objetivo definido todavía.' }}»
          </p>
        </div>

        <div>
          <p class="mb-1 font-[family-name:var(--font-mono)] text-xs font-semibold uppercase text-[var(--color-muted)]">
            Objetivos específicos
          </p>
          <div class="rounded-lg border border-[var(--color-line)] bg-[var(--color-ivory)] p-3 text-xs">
            <ul class="ml-4 list-disc space-y-1">
              <li
                v-for="o in plan.objetivos"
                :key="o.id"
              >
                {{ o.descripcion }}
              </li>
            </ul>
          </div>
        </div>

        <div v-if="autoevaluaciones.length > 0">
          <h3 class="mb-3 font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--color-ink)]">
            Autoevaluaciones del coachee
          </h3>
          <ul class="space-y-3">
            <li
              v-for="a in autoevaluaciones"
              :key="a.id"
            >
              <p class="font-[family-name:var(--font-mono)] text-xs text-[var(--color-muted)]">
                {{ new Date(a.createdAt).toLocaleDateString('es-CL') }} —
                {{ competenciaDe(a.competenciaId)?.nombre ?? 'Competencia' }} — Nivel {{ a.nivel }}
              </p>
              <p
                v-if="descripcionNivel(a)"
                class="mt-0.5 text-xs text-[var(--color-muted)]"
              >
                {{ descripcionNivel(a) }}
              </p>
              <div class="mt-1.5 rounded-xl border border-[var(--color-line)] bg-[var(--color-parchment)]/70 p-3.5 text-xs italic text-[var(--color-ink)]">
                <span class="mb-1 block font-[family-name:var(--font-mono)] text-xs font-semibold not-italic uppercase text-[var(--color-muted)]">
                  Observación del coachee:
                </span>
                «{{ a.ejemplo }}»
              </div>
            </li>
          </ul>
        </div>
      </div>

      <!-- Columna derecha: hábitos, plan de ejecución y retroalimentación -->
      <div class="mt-6 space-y-6 lg:col-span-4 lg:mt-0">
        <div class="space-y-3 rounded-2xl border border-[var(--color-line)] bg-white p-5 shadow-sm">
          <h2 class="border-b border-[var(--color-line)] pb-3 font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--color-ink)]">
            Hábitos y Plan de ejecución
          </h2>

          <div>
            <p class="mb-1 font-[family-name:var(--font-mono)] text-xs font-semibold uppercase text-[var(--color-muted)]">
              Hábito — Cuándo
            </p>
            <p class="rounded-xl border border-[var(--color-line)] bg-[var(--color-parchment)]/40 p-3 text-xs text-[var(--color-ink)]">
              {{ plan.habitoCuando ?? '—' }}
            </p>
          </div>

          <div>
            <p class="mb-1 font-[family-name:var(--font-mono)] text-xs font-semibold uppercase text-[var(--color-muted)]">
              En vez de
            </p>
            <p class="rounded-xl border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 p-3 text-xs text-[var(--color-danger)]">
              {{ plan.habitoEnVezDe ?? '—' }}
            </p>
          </div>

          <div>
            <p class="mb-1 font-[family-name:var(--font-mono)] text-xs font-semibold uppercase text-[var(--color-muted)]">
              Voy a
            </p>
            <p class="rounded-xl border border-[var(--color-sage)]/20 bg-[var(--color-sage)]/5 p-3 text-xs font-semibold text-[var(--color-sage)]">
              {{ plan.habitoVoyA ?? '—' }}
            </p>
          </div>

          <div>
            <p class="mb-1 font-[family-name:var(--font-mono)] text-xs font-semibold uppercase text-[var(--color-muted)]">
              Plan de ejecución
            </p>
            <ul class="ml-4 list-disc space-y-1.5 text-xs text-[var(--color-ink)]">
              <li
                v-for="a in plan.actividades"
                :key="a.id"
                class="flex flex-wrap items-center gap-1.5"
              >
                {{ a.actividad }}
                <span
                  class="rounded px-2 py-0.5 text-xs font-medium"
                  :class="a.estado === 'completada'
                    ? 'border border-[var(--color-sage)]/20 bg-[var(--color-sage)]/10 text-[var(--color-sage)]'
                    : 'border border-[var(--color-bronze)]/20 bg-[var(--color-bronze)]/10 text-[var(--color-bronze)]'"
                >
                  {{ a.estado }}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div
          v-if="plan.estado !== 'sin_enviar'"
          class="space-y-3 rounded-2xl border border-[var(--color-line)] bg-white p-5 shadow-sm"
        >
          <h2 class="font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--color-ink)]">
            Dejar comentario
          </h2>
          <textarea
            v-model="comentario"
            rows="4"
            placeholder="Comentario para solicitar cambios..."
            class="w-full rounded-xl border border-[var(--color-line)] p-3 text-xs focus:border-[var(--color-saltup)] focus:outline-none"
          />
          <div class="flex justify-end">
            <button
              class="rounded-lg border border-[var(--color-bronze)] px-3 py-2 text-sm text-[var(--color-bronze)] disabled:opacity-60"
              :disabled="acting || !comentario.trim()"
              @click="enviarSolicitudCambios"
            >
              Solicitar cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
