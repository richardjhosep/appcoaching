<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import AppShell from '../../components/AppShell.vue'
import {
  getMisSesiones,
  guardarPostSesion,
  publicarPostSesion,
  type Sesion,
} from '../../api/sesiones'
import { ApiError } from '../../api/client'

const sesiones = ref<Sesion[]>([])
const loading = ref(true)
const savingId = ref<string | null>(null)
const errorPorSesion = reactive<Record<string, string>>({})

const forms = reactive<
  Record<string, { aprendizaje: string; utilidad: number | null; cercaniaObjetivo: number | null; recomendacion: string; temasProximaSesion: string }>
>({})

function formFor(sesion: Sesion) {
  if (!forms[sesion.id]) {
    const p = sesion.postSesion
    forms[sesion.id] = {
      aprendizaje: p?.aprendizaje ?? '',
      utilidad: p?.utilidad ?? null,
      cercaniaObjetivo: p?.cercaniaObjetivo ?? null,
      recomendacion: p?.recomendacion ?? '',
      temasProximaSesion: p?.temasProximaSesion ?? '',
    }
  }
  return forms[sesion.id]
}

const sesionesOrdenadas = computed(() =>
  [...sesiones.value].sort(
    (a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime(),
  ),
)

function yaRealizada(sesion: Sesion): boolean {
  return new Date(sesion.fechaHora).getTime() <= Date.now()
}

async function load() {
  loading.value = true
  sesiones.value = await getMisSesiones()
  loading.value = false
}

onMounted(load)

async function guardarBorrador(sesion: Sesion) {
  savingId.value = sesion.id
  errorPorSesion[sesion.id] = ''
  try {
    const f = formFor(sesion)
    const postSesion = await guardarPostSesion(sesion.id, {
      aprendizaje: f.aprendizaje || undefined,
      utilidad: f.utilidad ?? undefined,
      cercaniaObjetivo: f.cercaniaObjetivo ?? undefined,
      recomendacion: f.recomendacion || undefined,
      temasProximaSesion: f.temasProximaSesion || undefined,
    })
    sesion.postSesion = postSesion
  } catch (err) {
    errorPorSesion[sesion.id] = err instanceof ApiError ? err.message : 'No se pudo guardar.'
  } finally {
    savingId.value = null
  }
}

async function publicar(sesion: Sesion) {
  savingId.value = sesion.id
  errorPorSesion[sesion.id] = ''
  try {
    sesion.postSesion = await publicarPostSesion(sesion.id)
  } catch (err) {
    errorPorSesion[sesion.id] = err instanceof ApiError ? err.message : 'No se pudo publicar.'
  } finally {
    savingId.value = null
  }
}
</script>

<template>
  <AppShell>
    <h1 class="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold">
      Mis sesiones
    </h1>
    <div
      v-if="loading"
      class="text-sm text-[var(--color-ink)]/60"
    >
      Cargando…
    </div>
    <div
      v-else-if="sesionesOrdenadas.length === 0"
      class="text-sm text-[var(--color-ink)]/60"
    >
      Todavía no tienes sesiones agendadas.
    </div>
    <div
      v-else
      class="space-y-4"
    >
      <div
        v-for="sesion in sesionesOrdenadas"
        :key="sesion.id"
        class="rounded-2xl border border-[var(--color-line)] bg-white p-4"
      >
        <div class="mb-2 flex items-center justify-between">
          <span class="font-[family-name:var(--font-mono)] text-sm">
            {{ new Date(sesion.fechaHora).toLocaleString('es-CL') }}
          </span>
          <span
            class="rounded-full px-2 py-0.5 text-xs"
            :class="yaRealizada(sesion) ? 'bg-[var(--color-parchment)]' : 'bg-[var(--color-sage)]/20 text-[var(--color-sage)]'"
          >
            {{ yaRealizada(sesion) ? 'Realizada' : 'Programada' }}
          </span>
        </div>

        <p
          v-if="sesion.resumenCompartido"
          class="mb-3 text-sm text-[var(--color-ink)]/80"
        >
          <strong>Resumen del coach:</strong> {{ sesion.resumenCompartido }}
        </p>

        <template v-if="yaRealizada(sesion)">
          <div
            v-if="sesion.postSesion?.publicada"
            class="space-y-2 rounded-lg bg-[var(--color-parchment)]/50 p-3 text-sm"
          >
            <p><strong>Aprendizaje:</strong> {{ sesion.postSesion.aprendizaje }}</p>
            <p><strong>Utilidad:</strong> {{ sesion.postSesion.utilidad }}/5</p>
            <p><strong>Cercanía al objetivo:</strong> {{ sesion.postSesion.cercaniaObjetivo }}/10</p>
            <p v-if="sesion.postSesion.recomendacion">
              <strong>Mi recomendación:</strong> {{ sesion.postSesion.recomendacion }}
            </p>
            <p v-if="sesion.postSesion.temasProximaSesion">
              <strong>Temas para la próxima sesión:</strong> {{ sesion.postSesion.temasProximaSesion }}
            </p>
          </div>
          <div
            v-else
            class="space-y-3"
          >
            <p class="text-xs font-medium text-[var(--color-ink)]/70">
              Post-sesión (una vez publicado no se puede editar)
            </p>
            <p
              v-if="errorPorSesion[sesion.id]"
              class="text-sm text-[var(--color-bronze)]"
            >
              {{ errorPorSesion[sesion.id] }}
            </p>
            <label class="block text-sm">
              Aprendizaje principal
              <textarea
                v-model="formFor(sesion).aprendizaje"
                rows="2"
                class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
              />
            </label>
            <div class="grid gap-3 sm:grid-cols-2">
              <label class="text-sm">
                Utilidad de la sesión (1-5)
                <input
                  v-model.number="formFor(sesion).utilidad"
                  type="number"
                  min="1"
                  max="5"
                  class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
                >
              </label>
              <label class="text-sm">
                Qué tan cerca estás de tu objetivo (1-10)
                <input
                  v-model.number="formFor(sesion).cercaniaObjetivo"
                  type="number"
                  min="1"
                  max="10"
                  class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
                >
              </label>
            </div>
            <label class="block text-sm">
              Mi recomendación para seguir mejorando el proceso de coaching es...
              <textarea
                v-model="formFor(sesion).recomendacion"
                rows="2"
                class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
              />
            </label>
            <label class="block text-sm">
              Temas propuestos para la próxima sesión
              <textarea
                v-model="formFor(sesion).temasProximaSesion"
                rows="2"
                class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
              />
            </label>
            <div class="flex gap-2">
              <button
                class="rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm hover:bg-[var(--color-parchment)]/50"
                :disabled="savingId === sesion.id"
                @click="guardarBorrador(sesion)"
              >
                Guardar borrador
              </button>
              <button
                class="rounded-lg bg-[var(--color-sage)] px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                :disabled="savingId === sesion.id"
                @click="publicar(sesion)"
              >
                Publicar
              </button>
            </div>
          </div>
        </template>
        <p
          v-else-if="sesion.linkVideollamada"
          class="text-sm"
        >
          <a
            :href="sesion.linkVideollamada"
            target="_blank"
            class="text-[var(--color-sage)] underline"
          >Link de la videollamada</a>
        </p>
      </div>
    </div>
  </AppShell>
</template>
