<script setup lang="ts">
import { reactive, ref } from 'vue'
import { updateOwnPlan, type PlanDesarrollo } from '../../api/planesDesarrollo'
import { ApiError } from '../../api/client'

const props = defineProps<{ plan: PlanDesarrollo }>()
const emit = defineEmits<{ updated: [PlanDesarrollo] }>()

// Sin `watch(() => props.plan, ...)` a propósito: ver la nota en DefinicionTab.vue.
const form = reactive({
  formacionLibros: props.plan.formacionLibros ?? '',
  formacionArticulos: props.plan.formacionArticulos ?? '',
  formacionVideos: props.plan.formacionVideos ?? '',
  formacionPodcasts: props.plan.formacionPodcasts ?? '',
  formacionPracticaGuiada: props.plan.formacionPracticaGuiada ?? '',
})

const saving = ref(false)
const error = ref<string | null>(null)

async function guardar() {
  saving.value = true
  error.value = null
  try {
    const updated = await updateOwnPlan({
      formacionLibros: form.formacionLibros || undefined,
      formacionArticulos: form.formacionArticulos || undefined,
      formacionVideos: form.formacionVideos || undefined,
      formacionPodcasts: form.formacionPodcasts || undefined,
      formacionPracticaGuiada: form.formacionPracticaGuiada || undefined,
    })
    emit('updated', updated)
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo guardar.'
  } finally {
    saving.value = false
  }
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
    <div class="grid gap-3 rounded-2xl border border-[var(--color-line)] bg-white p-4">
      <label class="text-sm">
        Libros
        <textarea
          v-model="form.formacionLibros"
          rows="2"
          class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
        />
      </label>
      <label class="text-sm">
        Artículos
        <textarea
          v-model="form.formacionArticulos"
          rows="2"
          class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
        />
      </label>
      <label class="text-sm">
        Videos
        <textarea
          v-model="form.formacionVideos"
          rows="2"
          class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
        />
      </label>
      <label class="text-sm">
        Podcasts
        <textarea
          v-model="form.formacionPodcasts"
          rows="2"
          class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
        />
      </label>
      <label class="text-sm">
        Práctica guiada
        <textarea
          v-model="form.formacionPracticaGuiada"
          rows="2"
          class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
        />
      </label>
      <button
        class="w-fit rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm text-[var(--color-parchment)] disabled:opacity-60"
        :disabled="saving"
        @click="guardar"
      >
        {{ saving ? 'Guardando…' : 'Guardar formación' }}
      </button>
    </div>
  </div>
</template>
