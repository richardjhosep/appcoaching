<script setup lang="ts">
import { computed, onMounted, reactive, ref, type ComponentPublicInstance } from 'vue'
import AppShell from '../../components/AppShell.vue'
import AppModal from '../../components/AppModal.vue'
import WeekCalendar from '../../components/WeekCalendar.vue'
import {
  getMisSesiones,
  guardarPostSesion,
  publicarPostSesion,
  solicitarReagendamiento,
  type Sesion,
} from '../../api/sesiones'
import { ApiError } from '../../api/client'
import { notifySuccess, notifyError } from '../../lib/notify'

const sesiones = ref<Sesion[]>([])
const loading = ref(true)
const savingId = ref<string | null>(null)
const errorPorSesion = reactive<Record<string, string>>({})

const reagendarModalOpen = ref(false)
const sesionParaReagendar = ref<Sesion | null>(null)
const motivoReagendamiento = ref('')
const enviandoReagendamiento = ref(false)

function abrirSolicitarReagendamiento(sesion: Sesion) {
  sesionParaReagendar.value = sesion
  motivoReagendamiento.value = ''
  reagendarModalOpen.value = true
}

async function enviarSolicitudReagendamiento() {
  const sesion = sesionParaReagendar.value
  if (!sesion) return
  enviandoReagendamiento.value = true
  try {
    await solicitarReagendamiento(sesion.id, motivoReagendamiento.value || undefined)
    reagendarModalOpen.value = false
    await notifySuccess('Solicitud enviada', 'Tu coach recibió tu solicitud de reagendamiento.')
  } catch (err) {
    await notifyError(
      'No se pudo enviar la solicitud',
      err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.',
    )
  } finally {
    enviandoReagendamiento.value = false
  }
}

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

const sesionRefs = ref<Record<string, HTMLElement | null>>({})
const highlightedId = ref<string | null>(null)

function setSesionRef(id: string, el: Element | ComponentPublicInstance | null) {
  sesionRefs.value[id] = el as HTMLElement | null
}

function onSelectSesion(id: string) {
  sesionRefs.value[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  highlightedId.value = id
  setTimeout(() => {
    if (highlightedId.value === id) highlightedId.value = null
  }, 2000)
}
</script>

<template>
  <AppShell>
    <h1 class="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold">
      Mis sesiones
    </h1>
    <WeekCalendar
      v-if="!loading"
      class="mb-4"
      :sesiones="sesiones"
      @select="onSelectSesion"
    />
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
        :ref="(el) => setSesionRef(sesion.id, el)"
        class="rounded-2xl border border-[var(--color-line)] bg-white p-4 transition-shadow"
        :class="highlightedId === sesion.id ? 'ring-2 ring-[var(--color-sage)]' : ''"
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
          <p class="mb-3 text-sm">
            <a
              v-if="sesion.linkVideollamada"
              :href="sesion.linkVideollamada"
              target="_blank"
              rel="noopener"
              class="text-[var(--color-sage)] underline"
            >Ver grabación de la sesión</a>
            <span
              v-else
              class="text-[var(--color-ink)]/50"
            >Esta sesión no fue grabada.</span>
          </p>
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
              class="text-sm text-[var(--color-danger)]"
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
        <div
          v-else
          class="space-y-2"
        >
          <p
            v-if="sesion.linkVideollamada"
            class="text-sm"
          >
            <a
              :href="sesion.linkVideollamada"
              target="_blank"
              class="text-[var(--color-sage)] underline"
            >Link de la videollamada</a>
          </p>
          <button
            class="rounded-lg border border-[var(--color-line)] px-3 py-2 text-xs hover:bg-[var(--color-parchment)]/50"
            @click="abrirSolicitarReagendamiento(sesion)"
          >
            Solicitar reagendamiento
          </button>
        </div>
      </div>
    </div>

    <AppModal
      v-if="reagendarModalOpen"
      title="Solicitar reagendamiento"
      @close="reagendarModalOpen = false"
    >
      <form
        class="space-y-4"
        @submit.prevent="enviarSolicitudReagendamiento"
      >
        <p
          v-if="sesionParaReagendar"
          class="font-[family-name:var(--font-mono)] text-sm text-[var(--color-ink)]/70"
        >
          Sesión actual: {{ new Date(sesionParaReagendar.fechaHora).toLocaleString('es-CL') }}
        </p>
        <label class="block text-sm">
          Motivo (opcional)
          <textarea
            v-model="motivoReagendamiento"
            rows="3"
            class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
          />
        </label>
        <div class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            class="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm"
            @click="reagendarModalOpen = false"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="enviandoReagendamiento"
            class="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm text-[var(--color-parchment)] disabled:opacity-60"
          >
            {{ enviandoReagendamiento ? 'Enviando…' : 'Enviar' }}
          </button>
        </div>
      </form>
    </AppModal>
  </AppShell>
</template>
