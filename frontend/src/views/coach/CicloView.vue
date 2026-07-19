<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppShell from '../../components/AppShell.vue'
import HistorialCiclos from '../../components/HistorialCiclos.vue'
import { getCoachee } from '../../api/coachees'
import {
  abrirCiclo,
  actualizarInformeFinal,
  actualizarResumen,
  cerrarCiclo,
  generarBorradorInforme,
  getCicloActualDeCoachee,
  getCiclosDeCoachee,
  subirInformePdf,
  type Ciclo,
  type ResultadoCiclo,
} from '../../api/ciclos'
import { ApiError } from '../../api/client'

const props = defineProps<{ coacheeId: string }>()

const loading = ref(true)
const nombreCoachee = ref('')
const cicloActual = ref<Ciclo | null>(null)
const historial = ref<Ciclo[]>([])
const error = ref<string | null>(null)
const acting = ref(false)

const ciclosCerrados = computed(() => historial.value.filter((c) => c.fechaCierre))

const nuevoTotalSesiones = ref(10)
const nuevoResumen = ref('')

const resumenEdit = ref('')
const informeEdit = ref('')
const archivoPdf = ref<File | null>(null)
const resultadoSeleccionado = ref<ResultadoCiclo | ''>('')

async function load() {
  loading.value = true
  const [coachee, actual, todos] = await Promise.all([
    getCoachee(props.coacheeId),
    getCicloActualDeCoachee(props.coacheeId),
    getCiclosDeCoachee(props.coacheeId),
  ])
  nombreCoachee.value = coachee.nombre
  cicloActual.value = actual
  historial.value = todos
  resumenEdit.value = actual?.resumenReunionInicial ?? ''
  informeEdit.value = actual?.informeFinal ?? ''
  loading.value = false
}

onMounted(load)

async function abrir() {
  acting.value = true
  error.value = null
  try {
    cicloActual.value = await abrirCiclo(
      props.coacheeId,
      nuevoTotalSesiones.value,
      nuevoResumen.value.trim() || undefined,
    )
    resumenEdit.value = cicloActual.value.resumenReunionInicial ?? ''
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo abrir el ciclo.'
  } finally {
    acting.value = false
  }
}

async function guardarResumen() {
  if (!cicloActual.value) return
  acting.value = true
  error.value = null
  try {
    cicloActual.value = await actualizarResumen(cicloActual.value.id, resumenEdit.value)
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo guardar el resumen.'
  } finally {
    acting.value = false
  }
}

async function generarBorrador() {
  if (!cicloActual.value) return
  acting.value = true
  error.value = null
  try {
    cicloActual.value = await generarBorradorInforme(cicloActual.value.id)
    informeEdit.value = cicloActual.value.informeFinal ?? ''
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo generar el borrador.'
  } finally {
    acting.value = false
  }
}

async function guardarInforme() {
  if (!cicloActual.value) return
  acting.value = true
  error.value = null
  try {
    cicloActual.value = await actualizarInformeFinal(cicloActual.value.id, informeEdit.value)
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo guardar el informe.'
  } finally {
    acting.value = false
  }
}

function onArchivoChange(event: Event) {
  const input = event.target as HTMLInputElement
  archivoPdf.value = input.files?.[0] ?? null
}

async function subirPdf() {
  if (!cicloActual.value || !archivoPdf.value) return
  acting.value = true
  error.value = null
  try {
    cicloActual.value = await subirInformePdf(cicloActual.value.id, archivoPdf.value)
    archivoPdf.value = null
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo subir el PDF.'
  } finally {
    acting.value = false
  }
}

async function cerrar() {
  if (!cicloActual.value || !resultadoSeleccionado.value) return
  acting.value = true
  error.value = null
  try {
    const cerrado = await cerrarCiclo(cicloActual.value.id, resultadoSeleccionado.value)
    historial.value = [cerrado, ...historial.value.filter((c) => c.id !== cerrado.id)]
    cicloActual.value = null
    resultadoSeleccionado.value = ''
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo cerrar el ciclo.'
  } finally {
    acting.value = false
  }
}
</script>

<template>
  <AppShell>
    <div
      v-if="loading"
      class="text-sm text-[var(--color-ink)]/60"
    >
      Cargando…
    </div>
    <div v-else>
      <h1 class="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold">
        Ciclo de coaching — {{ nombreCoachee }}
      </h1>
      <p
        v-if="error"
        class="mb-3 text-sm text-[var(--color-bronze)]"
      >
        {{ error }}
      </p>

      <div
        v-if="!cicloActual"
        class="mb-6 rounded-2xl border border-[var(--color-line)] bg-white p-4"
      >
        <h2 class="mb-3 text-sm font-medium">
          Abrir nuevo ciclo
        </h2>
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="text-sm">
            Sesiones contratadas
            <input
              v-model.number="nuevoTotalSesiones"
              type="number"
              min="1"
              class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
            >
          </label>
          <label class="text-sm sm:col-span-2">
            Resumen de reunión inicial (opcional)
            <textarea
              v-model="nuevoResumen"
              rows="3"
              class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
            />
          </label>
        </div>
        <button
          class="mt-3 rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm text-[var(--color-parchment)] disabled:opacity-60"
          :disabled="acting"
          @click="abrir"
        >
          Abrir ciclo
        </button>
      </div>

      <div
        v-else
        class="mb-6 space-y-4"
      >
        <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
          <div class="mb-3 flex items-center justify-between">
            <p class="text-sm">
              Sesiones: <strong>{{ cicloActual.sesionesRealizadas }}</strong> de {{ cicloActual.totalSesiones }}
            </p>
            <span
              v-if="cicloActual.alertaPorVencer"
              class="rounded-full bg-[var(--color-bronze)]/20 px-2 py-0.5 text-xs text-[var(--color-bronze)]"
            >
              Ciclo por vencer
            </span>
          </div>

          <label class="mb-3 block text-sm">
            Resumen de reunión inicial
            <textarea
              v-model="resumenEdit"
              rows="3"
              class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
            />
          </label>
          <button
            class="mb-4 rounded-lg border border-[var(--color-line)] px-3 py-2 text-xs hover:bg-[var(--color-parchment)]/50"
            :disabled="acting"
            @click="guardarResumen"
          >
            Guardar resumen
          </button>

          <label class="mb-2 block text-sm">
            Informe final
            <textarea
              v-model="informeEdit"
              rows="8"
              class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
            />
          </label>
          <div class="mb-4 flex flex-wrap gap-2">
            <button
              class="rounded-lg border border-[var(--color-line)] px-3 py-2 text-xs hover:bg-[var(--color-parchment)]/50"
              :disabled="acting"
              @click="generarBorrador"
            >
              Generar borrador automático
            </button>
            <button
              class="rounded-lg border border-[var(--color-line)] px-3 py-2 text-xs hover:bg-[var(--color-parchment)]/50"
              :disabled="acting"
              @click="guardarInforme"
            >
              Guardar informe
            </button>
          </div>

          <div class="mb-4">
            <label class="block text-sm">
              Informe en PDF
              <input
                type="file"
                accept="application/pdf"
                class="mt-1 block text-sm"
                @change="onArchivoChange"
              >
            </label>
            <button
              class="mt-2 rounded-lg border border-[var(--color-line)] px-3 py-2 text-xs hover:bg-[var(--color-parchment)]/50 disabled:opacity-60"
              :disabled="acting || !archivoPdf"
              @click="subirPdf"
            >
              Subir PDF
            </button>
            <span
              v-if="cicloActual.informePdfNombre"
              class="ml-2 text-xs text-[var(--color-ink)]/60"
            >{{ cicloActual.informePdfNombre }}</span>
          </div>

          <div class="border-t border-[var(--color-line)] pt-4">
            <label class="mb-2 block text-sm">
              Cerrar ciclo con resultado
              <select
                v-model="resultadoSeleccionado"
                class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
              >
                <option value="">
                  Selecciona un resultado
                </option>
                <option value="logrado">
                  Logrado
                </option>
                <option value="medianamente_logrado">
                  Medianamente logrado
                </option>
                <option value="no_logrado">
                  No logrado
                </option>
              </select>
            </label>
            <button
              class="rounded-lg bg-[var(--color-sage)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              :disabled="acting || !resultadoSeleccionado"
              @click="cerrar"
            >
              Cerrar ciclo
            </button>
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <h2 class="mb-3 text-sm font-medium">
          Ciclos anteriores
        </h2>
        <HistorialCiclos :ciclos="ciclosCerrados" />
      </div>
    </div>
  </AppShell>
</template>
