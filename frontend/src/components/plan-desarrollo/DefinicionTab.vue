<script setup lang="ts">
import { reactive, ref } from 'vue'
import {
  updateOwnPlan,
  enviarPlan,
  addObjetivo,
  updateObjetivo,
  removeObjetivo,
  getOwnPlan,
  type PlanDesarrollo,
} from '../../api/planesDesarrollo'
import type { Competencia } from '../../api/competencias'
import { ApiError } from '../../api/client'

const props = defineProps<{
  plan: PlanDesarrollo
  competencias: Competencia[]
  locked: boolean
}>()
const emit = defineEmits<{ updated: [PlanDesarrollo] }>()

const form = reactive({
  competenciaId: props.plan.competenciaId ?? '',
  nivelActual: props.plan.nivelActual,
  nivelObjetivo: props.plan.nivelObjetivo,
  plazo: props.plan.plazo ?? '',
  descripcionEstadoActual: props.plan.descripcionEstadoActual ?? '',
  objetivoGeneral: props.plan.objetivoGeneral ?? '',
})

// Nota: sin `watch(() => props.plan, ...)` a propósito. Este componente se
// desmonta/remonta al cambiar de sub-pestaña (v-if en el padre), así que ya
// arranca con los datos frescos del plan. Si en cambio se re-sincronizara en
// cada actualización del prop, cualquier acción que dispare un refetch del
// plan completo (como agregar un objetivo) borraría en silencio los campos
// de definición que el coachee todavía no había guardado.

const saving = ref(false)
const enviando = ref(false)
const error = ref<string | null>(null)
const nuevoObjetivo = ref('')

async function refetch() {
  emit('updated', await getOwnPlan())
}

async function guardar() {
  saving.value = true
  error.value = null
  try {
    const updated = await updateOwnPlan({
      competenciaId: form.competenciaId || undefined,
      nivelActual: form.nivelActual ?? undefined,
      nivelObjetivo: form.nivelObjetivo ?? undefined,
      plazo: form.plazo || undefined,
      descripcionEstadoActual: form.descripcionEstadoActual || undefined,
      objetivoGeneral: form.objetivoGeneral || undefined,
    })
    emit('updated', updated)
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo guardar.'
  } finally {
    saving.value = false
  }
}

async function agregarObjetivo() {
  if (!nuevoObjetivo.value.trim()) return
  try {
    await addObjetivo(nuevoObjetivo.value.trim())
    nuevoObjetivo.value = ''
    await refetch()
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo agregar el objetivo.'
  }
}

async function editarObjetivo(id: string, descripcion: string) {
  try {
    await updateObjetivo(id, descripcion)
    await refetch()
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo editar el objetivo.'
  }
}

async function borrarObjetivo(id: string) {
  try {
    await removeObjetivo(id)
    await refetch()
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo eliminar el objetivo.'
  }
}

async function enviar() {
  enviando.value = true
  error.value = null
  try {
    const updated = await enviarPlan()
    emit('updated', updated)
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo enviar el plan.'
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <p
      v-if="locked"
      class="rounded-lg border border-[var(--color-line)] bg-[var(--color-parchment)]/60 p-3 text-xs text-[var(--color-ink)]/70"
    >
      El plan está pendiente de aprobación: la competencia, el nivel objetivo, el objetivo general y
      los objetivos específicos quedan bloqueados hasta que el coach responda.
    </p>
    <p
      v-if="error"
      class="text-sm text-[var(--color-bronze)]"
    >
      {{ error }}
    </p>

    <div class="grid gap-3 rounded-2xl border border-[var(--color-line)] bg-white p-4 sm:grid-cols-2">
      <label class="text-sm sm:col-span-2">
        Competencia a desarrollar
        <select
          v-model="form.competenciaId"
          :disabled="locked"
          class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm disabled:bg-[var(--color-parchment)]/50"
        >
          <option
            value=""
            disabled
          >Elige una competencia</option>
          <option
            v-for="c in competencias"
            :key="c.id"
            :value="c.id"
          >{{ c.nombre }}</option>
        </select>
      </label>

      <label class="text-sm">
        Nivel actual (libre edición)
        <input
          v-model.number="form.nivelActual"
          type="number"
          min="1"
          class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
        >
      </label>

      <label class="text-sm">
        Nivel objetivo
        <input
          v-model.number="form.nivelObjetivo"
          type="number"
          min="1"
          :disabled="locked"
          class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm disabled:bg-[var(--color-parchment)]/50"
        >
      </label>

      <label class="text-sm sm:col-span-2">
        Plazo a lograr el nuevo nivel (libre edición)
        <input
          v-model="form.plazo"
          type="text"
          placeholder="ej. 3 meses"
          class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
        >
      </label>

      <label class="text-sm sm:col-span-2">
        Descripción del estado actual (libre edición)
        <textarea
          v-model="form.descripcionEstadoActual"
          rows="3"
          class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
        />
      </label>

      <label class="text-sm sm:col-span-2">
        Objetivo general
        <textarea
          v-model="form.objetivoGeneral"
          rows="3"
          :disabled="locked"
          class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm disabled:bg-[var(--color-parchment)]/50"
        />
      </label>

      <button
        class="w-fit rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm text-[var(--color-parchment)] disabled:opacity-60 sm:col-span-2"
        :disabled="saving"
        @click="guardar"
      >
        {{ saving ? 'Guardando…' : 'Guardar definición' }}
      </button>
    </div>

    <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
      <h2 class="mb-2 text-sm font-medium">
        Objetivos específicos
      </h2>
      <ul class="mb-3 space-y-2">
        <li
          v-for="o in [...plan.objetivos].sort((a, b) => a.orden - b.orden)"
          :key="o.id"
          class="flex items-center gap-2 text-sm"
        >
          <span class="font-[family-name:var(--font-mono)] text-[var(--color-ink)]/50">{{ o.orden }}.</span>
          <input
            :value="o.descripcion"
            :disabled="locked"
            class="flex-1 rounded-lg border border-[var(--color-line)] px-2 py-1 text-sm disabled:bg-[var(--color-parchment)]/50"
            @change="editarObjetivo(o.id, ($event.target as HTMLInputElement).value)"
          >
          <button
            v-if="!locked"
            class="text-xs text-[var(--color-bronze)] hover:underline"
            @click="borrarObjetivo(o.id)"
          >
            Quitar
          </button>
        </li>
      </ul>
      <div
        v-if="!locked"
        class="flex gap-2"
      >
        <input
          v-model="nuevoObjetivo"
          type="text"
          placeholder="Nuevo objetivo específico"
          class="flex-1 rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
          @keyup.enter="agregarObjetivo"
        >
        <button
          class="rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm hover:bg-[var(--color-parchment)]/50"
          @click="agregarObjetivo"
        >
          Agregar
        </button>
      </div>
    </div>

    <button
      v-if="!locked"
      class="rounded-lg bg-[var(--color-sage)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      :disabled="enviando"
      @click="enviar"
    >
      {{ enviando ? 'Enviando…' : 'Enviar plan para aprobación' }}
    </button>
  </div>
</template>
