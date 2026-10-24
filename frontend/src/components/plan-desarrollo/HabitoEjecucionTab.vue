<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import {
  updateOwnPlan,
  addActividad,
  updateActividad,
  removeActividad,
  getOwnPlan,
  type PlanDesarrollo,
  type EstadoActividad,
} from '../../api/planesDesarrollo'
import { getMiCicloActual } from '../../api/ciclos'
import { ApiError } from '../../api/client'
import { notifyError, notifySuccess } from '../../lib/notify'
import SectionCard from '../SectionCard.vue'

const props = defineProps<{ plan: PlanDesarrollo }>()
const emit = defineEmits<{ updated: [PlanDesarrollo] }>()

const form = reactive({
  habitoCuando: props.plan.habitoCuando ?? '',
  habitoEnVezDe: props.plan.habitoEnVezDe ?? '',
  habitoVoyA: props.plan.habitoVoyA ?? '',
  habitoObvio: props.plan.habitoObvio ?? '',
  habitoSencillo: props.plan.habitoSencillo ?? '',
  habitoAtractivo: props.plan.habitoAtractivo ?? '',
  habitoSatisfactorio: props.plan.habitoSatisfactorio ?? '',
})

// Sin `watch(() => props.plan, ...)` a propósito: ver la nota en DefinicionTab.vue.
// Agregar una actividad refresca `plan` completo; sincronizar el form desde ahí
// borraría en silencio cambios de hábito aún no guardados.

const saving = ref(false)
const error = ref<string | null>(null)
const nuevaActividad = reactive({ objetivoId: '', actividad: '', fechaInicio: '', fechaFin: '' })

// Cota inferior de los date pickers: no tiene sentido planificar una actividad antes de
// que el ciclo de coaching haya empezado. Sin ciclo abierto (plan aún no aprobado, por
// ejemplo) simplemente no se acota.
const fechaAperturaCiclo = ref<string | null>(null)
onMounted(async () => {
  const ciclo = await getMiCicloActual().catch(() => null)
  fechaAperturaCiclo.value = ciclo ? ciclo.fechaApertura.slice(0, 10) : null
})

const formatoFecha = (fecha: string) =>
  new Date(`${fecha}T00:00:00`).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })

// Sin watch a props.plan por la misma razón que `form` arriba; las actividades agregadas
// después de montar el componente reciben su entrada en agregarActividad().
const observacionesEdit = reactive<Record<string, string>>(
  Object.fromEntries(props.plan.actividades.map((a) => [a.id, a.observaciones ?? ''])),
)
const guardandoObservacion = ref<string | null>(null)

async function refetch() {
  emit('updated', await getOwnPlan())
}

async function guardarHabito() {
  saving.value = true
  error.value = null
  try {
    const updated = await updateOwnPlan({
      habitoCuando: form.habitoCuando || undefined,
      habitoEnVezDe: form.habitoEnVezDe || undefined,
      habitoVoyA: form.habitoVoyA || undefined,
      habitoObvio: form.habitoObvio || undefined,
      habitoSencillo: form.habitoSencillo || undefined,
      habitoAtractivo: form.habitoAtractivo || undefined,
      habitoSatisfactorio: form.habitoSatisfactorio || undefined,
    })
    emit('updated', updated)
    await notifySuccess('Hábito guardado')
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo guardar.'
    await notifyError('No se pudo guardar el hábito', error.value)
  } finally {
    saving.value = false
  }
}

async function agregarActividad() {
  if (!nuevaActividad.objetivoId || !nuevaActividad.actividad.trim()) return
  try {
    const creada = await addActividad({
      objetivoId: nuevaActividad.objetivoId,
      actividad: nuevaActividad.actividad.trim(),
      fechaInicio: nuevaActividad.fechaInicio || undefined,
      fechaFin: nuevaActividad.fechaFin || undefined,
    })
    observacionesEdit[creada.id] = ''
    nuevaActividad.actividad = ''
    nuevaActividad.fechaInicio = ''
    nuevaActividad.fechaFin = ''
    await refetch()
    await notifySuccess('Actividad agregada', rangoFechas(creada.fechaInicio, creada.fechaFin) ?? 'Sin fechas — puedes agregarlas en la actividad.')
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo agregar la actividad.'
    await notifyError('No se pudo agregar la actividad', error.value)
  }
}

// Texto legible del período de una actividad — también cuando solo tiene fecha de término
// (antes solo se mostraba si tenía inicio, y una actividad con solo "Fin" no mostraba nada).
function rangoFechas(inicio: string | null, fin: string | null): string | null {
  if (inicio && fin) return `${formatoFecha(inicio)} → ${formatoFecha(fin)}`
  if (inicio) return `Desde ${formatoFecha(inicio)}`
  if (fin) return `Hasta ${formatoFecha(fin)}`
  return null
}

async function cambiarFecha(id: string, campo: 'fechaInicio' | 'fechaFin', valor: string) {
  try {
    await updateActividad(id, { [campo]: valor || null })
    await refetch()
  } catch (err) {
    await notifyError('No se pudo cambiar la fecha', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  }
}

async function cambiarEstado(id: string, estado: EstadoActividad) {
  await updateActividad(id, { estado })
  await refetch()
}

async function guardarObservacion(id: string) {
  guardandoObservacion.value = id
  try {
    await updateActividad(id, { observaciones: observacionesEdit[id] || undefined })
    await refetch()
    await notifySuccess('Observación guardada')
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo guardar la observación.'
    await notifyError('No se pudo guardar la observación', error.value)
  } finally {
    guardandoObservacion.value = null
  }
}

async function borrarActividad(id: string) {
  await removeActividad(id)
  await refetch()
}

function objetivoDescripcion(objetivoId: string): string {
  return props.plan.objetivos.find((o) => o.id === objetivoId)?.descripcion ?? '—'
}
</script>

<template>
  <div class="space-y-4">
    <p
      v-if="error"
      class="text-sm text-[var(--color-danger)]"
    >
      {{ error }}
    </p>

    <SectionCard
      title="Hábito a incorporar o cambiar"
      icon="habito"
    >
      <div class="grid gap-3 sm:grid-cols-2">
        <label class="text-sm">
          Cuándo (el detonante del hábito)
          <textarea
            v-model="form.habitoCuando"
            rows="2"
            class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
          />
        </label>
        <label class="text-sm">
          En vez de (tu hábito actual)
          <textarea
            v-model="form.habitoEnVezDe"
            rows="2"
            class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
          />
        </label>
        <label class="text-sm sm:col-span-2">
          Voy a (tu nuevo hábito)
          <textarea
            v-model="form.habitoVoyA"
            rows="2"
            class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
          />
        </label>
        <label class="text-sm">
          Cómo hacerlo Obvio
          <textarea
            v-model="form.habitoObvio"
            rows="2"
            class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
          />
        </label>
        <label class="text-sm">
          Cómo hacerlo Sencillo
          <textarea
            v-model="form.habitoSencillo"
            rows="2"
            class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
          />
        </label>
        <label class="text-sm">
          Cómo hacerlo Atractivo
          <textarea
            v-model="form.habitoAtractivo"
            rows="2"
            class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
          />
        </label>
        <label class="text-sm">
          Cómo hacerlo Satisfactorio
          <textarea
            v-model="form.habitoSatisfactorio"
            rows="2"
            class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
          />
        </label>
        <button
          class="w-fit rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm text-[var(--color-on-primary)] disabled:opacity-60 sm:col-span-2"
          :disabled="saving"
          @click="guardarHabito"
        >
          {{ saving ? 'Guardando…' : 'Guardar hábito' }}
        </button>
      </div>
    </SectionCard>

    <SectionCard
      title="Plan de ejecución"
      icon="lista"
    >
      <ul class="mb-3 space-y-2">
        <li
          v-for="a in plan.actividades"
          :key="a.id"
          class="rounded-lg border border-[var(--color-line)] p-2 text-sm"
        >
          <div class="flex flex-wrap items-start justify-between gap-2">
            <p>{{ a.actividad }}</p>
            <span
              class="shrink-0 rounded-full px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-xs font-semibold"
              :class="rangoFechas(a.fechaInicio, a.fechaFin)
                ? 'bg-[var(--color-sage)]/15 text-[var(--color-sage)]'
                : 'bg-[var(--color-ink)]/5 text-[var(--color-muted)]'"
            >
              {{ rangoFechas(a.fechaInicio, a.fechaFin) ?? 'Sin fechas' }}
            </span>
          </div>
          <p class="text-xs text-[var(--color-muted)]">
            Objetivo: {{ objetivoDescripcion(a.objetivoId) }}
          </p>
          <div class="mt-1 flex flex-wrap gap-3 text-xs text-[var(--color-muted)]">
            <label class="flex items-center gap-1">
              Inicio
              <input
                type="date"
                :value="a.fechaInicio ?? ''"
                :min="fechaAperturaCiclo ?? undefined"
                class="rounded border border-[var(--color-line)] px-1.5 py-0.5 text-xs"
                @change="cambiarFecha(a.id, 'fechaInicio', ($event.target as HTMLInputElement).value)"
              >
            </label>
            <label class="flex items-center gap-1">
              Término
              <input
                type="date"
                :value="a.fechaFin ?? ''"
                :min="a.fechaInicio || fechaAperturaCiclo || undefined"
                class="rounded border border-[var(--color-line)] px-1.5 py-0.5 text-xs"
                @change="cambiarFecha(a.id, 'fechaFin', ($event.target as HTMLInputElement).value)"
              >
            </label>
          </div>
          <div class="mt-1 flex items-center gap-2">
            <select
              :value="a.estado"
              class="rounded border border-[var(--color-line)] px-2 py-1 text-xs"
              @change="cambiarEstado(a.id, ($event.target as HTMLSelectElement).value as EstadoActividad)"
            >
              <option value="pendiente">
                Pendiente
              </option>
              <option value="en_curso">
                En curso
              </option>
              <option value="completada">
                Completada
              </option>
            </select>
            <button
              class="text-xs text-[var(--color-bronze)] hover:underline"
              @click="borrarActividad(a.id)"
            >
              Quitar
            </button>
          </div>
          <label class="mt-2 block text-xs">
            Observaciones — ¿qué pasó al ejecutar esta actividad?
            <textarea
              v-model="observacionesEdit[a.id]"
              rows="2"
              class="mt-1 w-full rounded border border-[var(--color-line)] px-2 py-1 text-xs"
            />
          </label>
          <button
            class="mt-1 rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs hover:bg-[var(--color-parchment)]/50 disabled:opacity-60"
            :disabled="guardandoObservacion === a.id"
            @click="guardarObservacion(a.id)"
          >
            {{ guardandoObservacion === a.id ? 'Guardando…' : 'Guardar observación' }}
          </button>
        </li>
      </ul>

      <div class="grid gap-2 sm:grid-cols-2">
        <select
          v-model="nuevaActividad.objetivoId"
          class="rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm sm:col-span-2"
        >
          <option
            value=""
            disabled
          >
            Vincular a un objetivo específico
          </option>
          <option
            v-for="o in plan.objetivos"
            :key="o.id"
            :value="o.id"
          >
            {{ o.descripcion }}
          </option>
        </select>
        <input
          v-model="nuevaActividad.actividad"
          type="text"
          placeholder="Actividad"
          class="rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm sm:col-span-2"
        >
        <label class="text-sm">
          Inicio
          <input
            v-model="nuevaActividad.fechaInicio"
            data-nueva-actividad
            type="date"
            :min="fechaAperturaCiclo ?? undefined"
            class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
          >
        </label>
        <label class="text-sm">
          Término
          <input
            v-model="nuevaActividad.fechaFin"
            data-nueva-actividad
            type="date"
            :min="nuevaActividad.fechaInicio || fechaAperturaCiclo || undefined"
            class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
          >
        </label>
        <button
          class="w-fit rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm hover:bg-[var(--color-parchment)]/50 sm:col-span-2"
          @click="agregarActividad"
        >
          Agregar actividad
        </button>
      </div>
    </SectionCard>
  </div>
</template>
