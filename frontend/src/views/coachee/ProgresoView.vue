<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppShell from '../../components/AppShell.vue'
import ProgresoLineaTiempo from '../../components/ProgresoLineaTiempo.vue'
import {
  addLogro,
  getMiAvance,
  getMiDiario,
  getMiLineaProgreso,
  getMisLogros,
  removeLogro,
  updateMiDiario,
  type Logro,
  type PuntoProgreso,
} from '../../api/seguimiento'
import { ApiError } from '../../api/client'

const loading = ref(true)
const avance = ref<number | null>(null)
const puntos = ref<PuntoProgreso[]>([])
const logros = ref<Logro[]>([])
const nuevaFecha = ref('')
const nuevaDescripcion = ref('')
const diarioContenido = ref('')
const guardandoDiario = ref(false)
const toastVisible = ref(false)
const error = ref<string | null>(null)

async function load() {
  loading.value = true
  const [a, p, l, d] = await Promise.all([
    getMiAvance(),
    getMiLineaProgreso(),
    getMisLogros(),
    getMiDiario(),
  ])
  avance.value = a.avance
  puntos.value = p
  logros.value = l
  diarioContenido.value = d.contenido
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

async function guardarDiario() {
  guardandoDiario.value = true
  try {
    await updateMiDiario(diarioContenido.value)
    toastVisible.value = true
    setTimeout(() => {
      toastVisible.value = false
    }, 2000)
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo guardar el diario.'
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
        class="text-sm text-[var(--color-bronze)]"
      >
        {{ error }}
      </p>

      <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <h2 class="mb-1 text-sm font-medium">
          Avance general
        </h2>
        <p
          v-if="avance === null"
          class="text-sm text-[var(--color-ink)]/60"
        >
          Aún no te has autoevaluado en ningún post-sesión.
        </p>
        <p
          v-else
          class="font-[family-name:var(--font-mono)] text-3xl text-[var(--color-sage)]"
        >
          {{ avance }}%
        </p>
      </div>

      <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <h2 class="mb-3 text-sm font-medium">
          Línea de tiempo (cercanía al objetivo por sesión)
        </h2>
        <ProgresoLineaTiempo :puntos="puntos" />
      </div>

      <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <h2 class="mb-3 text-sm font-medium">
          Logros
        </h2>
        <ul class="mb-3 space-y-2">
          <li
            v-for="logro in logros"
            :key="logro.id"
            class="flex items-start justify-between gap-2 text-sm"
          >
            <span>
              <span class="font-[family-name:var(--font-mono)] text-[var(--color-ink)]/50">{{ logro.fecha }}</span>
              — {{ logro.descripcion }}
            </span>
            <button
              class="shrink-0 text-xs text-[var(--color-bronze)] hover:underline"
              @click="borrarLogro(logro.id)"
            >
              Quitar
            </button>
          </li>
        </ul>
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
      </div>

      <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <h2 class="mb-3 text-sm font-medium">
          Diario de reflexión
        </h2>
        <textarea
          v-model="diarioContenido"
          rows="6"
          class="mb-3 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
        />
        <button
          class="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm text-[var(--color-parchment)] disabled:opacity-60"
          :disabled="guardandoDiario"
          @click="guardarDiario"
        >
          {{ guardandoDiario ? 'Guardando…' : 'Guardar' }}
        </button>
      </div>
    </div>

    <div
      v-if="toastVisible"
      class="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-[var(--color-ink)] px-4 py-2 text-sm text-[var(--color-parchment)] shadow-lg"
    >
      Diario guardado
    </div>
  </AppShell>
</template>
