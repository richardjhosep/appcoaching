<script setup lang="ts">
import { reactive, ref } from 'vue'
import {
  updateOwnPlan,
  addActividad,
  updateActividad,
  removeActividad,
  getOwnPlan,
  type PlanDesarrollo,
  type EstadoActividad,
} from '../../api/planesDesarrollo'
import { ApiError } from '../../api/client'

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
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo guardar.'
  } finally {
    saving.value = false
  }
}

async function agregarActividad() {
  if (!nuevaActividad.objetivoId || !nuevaActividad.actividad.trim()) return
  try {
    await addActividad({
      objetivoId: nuevaActividad.objetivoId,
      actividad: nuevaActividad.actividad.trim(),
      fechaInicio: nuevaActividad.fechaInicio || undefined,
      fechaFin: nuevaActividad.fechaFin || undefined,
    })
    nuevaActividad.actividad = ''
    nuevaActividad.fechaInicio = ''
    nuevaActividad.fechaFin = ''
    await refetch()
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo agregar la actividad.'
  }
}

async function cambiarEstado(id: string, estado: EstadoActividad) {
  await updateActividad(id, { estado })
  await refetch()
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
      class="text-sm text-[var(--color-bronze)]"
    >
      {{ error }}
    </p>

    <div class="grid gap-3 rounded-2xl border border-[var(--color-line)] bg-white p-4 sm:grid-cols-2">
      <h2 class="text-sm font-medium sm:col-span-2">
        Hábito a incorporar o cambiar
      </h2>
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
        class="w-fit rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm text-[var(--color-parchment)] disabled:opacity-60 sm:col-span-2"
        :disabled="saving"
        @click="guardarHabito"
      >
        {{ saving ? 'Guardando…' : 'Guardar hábito' }}
      </button>
    </div>

    <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
      <h2 class="mb-2 text-sm font-medium">
        Plan de ejecución
      </h2>
      <ul class="mb-3 space-y-2">
        <li
          v-for="a in plan.actividades"
          :key="a.id"
          class="rounded-lg border border-[var(--color-line)] p-2 text-sm"
        >
          <p>{{ a.actividad }}</p>
          <p class="text-xs text-[var(--color-ink)]/60">
            Objetivo: {{ objetivoDescripcion(a.objetivoId) }}
            <span v-if="a.fechaInicio"> · {{ a.fechaInicio }}<span v-if="a.fechaFin"> – {{ a.fechaFin }}</span></span>
          </p>
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
        <input
          v-model="nuevaActividad.fechaInicio"
          type="text"
          placeholder="Inicio (ej. Semana 1)"
          class="rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
        >
        <input
          v-model="nuevaActividad.fechaFin"
          type="text"
          placeholder="Fin (ej. Semana 3)"
          class="rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
        >
        <button
          class="w-fit rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm hover:bg-[var(--color-parchment)]/50 sm:col-span-2"
          @click="agregarActividad"
        >
          Agregar actividad
        </button>
      </div>
    </div>
  </div>
</template>
