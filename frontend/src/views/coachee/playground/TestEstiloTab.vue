<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import EmptyState from '../../../components/EmptyState.vue'
import NavIcon from '../../../components/NavIcon.vue'
import SkeletonBlock from '../../../components/SkeletonBlock.vue'
import {
  enviarIntentoEstilo,
  getTestEstiloParaResponder,
  listTestsEstiloDisponibles,
  misIntentosEstilo,
  type IntentoEstilo,
  type TestEstiloParaResponder,
  type TestEstiloResumen,
} from '../../../api/testEstilo'
import { ApiError } from '../../../api/client'
import { notifyError } from '../../../lib/notify'
import { categoriasDe } from '../../../lib/testEstiloPerfil'
import { formatearFechaLimite } from '../../../lib/fechaLimite'

const loading = ref(true)
const disponibles = ref<TestEstiloResumen[]>([])

const testAbierto = ref<TestEstiloParaResponder | null>(null)
const respuestas = reactive<Record<string, 'A' | 'B' | null>>({})
const enviando = ref(false)
const resultado = ref<IntentoEstilo | null>(null)

// Solo el propio historial — nunca el de otros coachees (el coach ve los perfiles de
// todos en su vista, el coachee jamás ve el de nadie más).
const miHistorial = ref<IntentoEstilo[]>([])

async function load() {
  loading.value = true
  disponibles.value = await listTestsEstiloDisponibles()
  loading.value = false
}

onMounted(load)

async function cargarMiHistorial(testId: string) {
  const todos = await misIntentosEstilo()
  miHistorial.value = todos
    .filter((i) => i.testEstiloId === testId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

async function abrir(id: string) {
  resultado.value = null
  const test = await getTestEstiloParaResponder(id)
  testAbierto.value = test
  for (const key of Object.keys(respuestas)) delete respuestas[key]
  for (const pregunta of test.preguntas) respuestas[pregunta.id] = null
  await cargarMiHistorial(id)
}

function cerrar() {
  testAbierto.value = null
  resultado.value = null
  miHistorial.value = []
}

const todasRespondidas = computed(() =>
  testAbierto.value ? testAbierto.value.preguntas.every((p) => respuestas[p.id] !== null) : false,
)

async function enviar() {
  if (!testAbierto.value || !todasRespondidas.value) return
  enviando.value = true
  try {
    const orden = testAbierto.value.preguntas.map((p) => respuestas[p.id] as 'A' | 'B')
    resultado.value = await enviarIntentoEstilo(testAbierto.value.id, orden)
    await Promise.all([load(), cargarMiHistorial(testAbierto.value.id)])
  } catch (err) {
    await notifyError(
      'No se pudo enviar tu respuesta',
      err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.',
    )
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <h1 class="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold">
    Test de Estilo
  </h1>

  <SkeletonBlock v-if="loading" />

  <EmptyState
    v-else-if="!testAbierto && disponibles.length === 0"
    icon="estilo"
    title="Todavía no tienes tests de estilo disponibles"
    description="Cuando tu coach publique uno, va a aparecer acá."
  />

  <div
    v-else-if="!testAbierto"
    class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
  >
    <button
      v-for="test in disponibles"
      :key="test.id"
      class="flex flex-col items-start gap-2 rounded-2xl border border-[var(--color-line)] bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--color-sage)] hover:shadow-md"
      @click="abrir(test.id)"
    >
      <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-parchment)] text-[var(--color-bronze)]">
        <NavIcon
          name="estilo"
          :size="20"
        />
      </div>
      <p class="text-sm font-medium">
        {{ test.titulo }}
      </p>
      <p
        v-if="test.competencia"
        class="text-xs text-[var(--color-ink)]/50"
      >
        {{ test.competencia.nombre }} · {{ test.totalPreguntas }} pregunta{{ test.totalPreguntas === 1 ? '' : 's' }}
      </p>
      <p
        v-if="test.yaRespondido"
        class="flex items-center gap-1 text-xs font-semibold text-[var(--color-spark)]"
      >
        <NavIcon
          name="trofeo"
          :size="12"
        />
        Tu perfil: {{ test.miCategoriaDominante }}
      </p>
      <p
        v-if="formatearFechaLimite(test.fechaLimite)"
        class="text-xs text-[var(--color-bronze)]"
      >
        {{ formatearFechaLimite(test.fechaLimite) }}
      </p>
    </button>
  </div>

  <div
    v-else
    class="mx-auto max-w-xl"
  >
    <button
      class="mb-4 text-sm text-[var(--color-ink)]/60 hover:text-[var(--color-ink)] hover:underline"
      @click="cerrar"
    >
      ← Volver a Test de Estilo
    </button>

    <div
      v-if="!resultado"
      class="rounded-2xl border border-[var(--color-line)] bg-white p-6"
    >
      <h2 class="mb-1 font-[family-name:var(--font-heading)] text-lg font-semibold">
        {{ testAbierto.titulo }}
      </h2>
      <p
        v-if="testAbierto.descripcion"
        class="mb-4 text-sm text-[var(--color-ink)]/60"
      >
        {{ testAbierto.descripcion }}
      </p>
      <p class="mb-4 text-xs text-[var(--color-ink)]/50">
        Para cada par, elige la afirmación que más se parece a cómo actúas normalmente — no
        hay respuestas correctas o incorrectas.
      </p>
      <div class="space-y-4">
        <div
          v-for="(pregunta, i) in testAbierto.preguntas"
          :key="pregunta.id"
        >
          <p class="mb-2 text-xs font-medium text-[var(--color-ink)]/50">
            {{ i + 1 }} de {{ testAbierto.preguntas.length }}
          </p>
          <div class="grid gap-2">
            <button
              type="button"
              class="rounded-xl border p-3 text-left text-sm transition-colors"
              :class="respuestas[pregunta.id] === 'A'
                ? 'border-[var(--color-sage)] bg-[var(--color-sage)]/10'
                : 'border-[var(--color-line)] hover:bg-[var(--color-parchment)]/50'"
              @click="respuestas[pregunta.id] = 'A'"
            >
              {{ pregunta.opcionA }}
            </button>
            <button
              type="button"
              class="rounded-xl border p-3 text-left text-sm transition-colors"
              :class="respuestas[pregunta.id] === 'B'
                ? 'border-[var(--color-sage)] bg-[var(--color-sage)]/10'
                : 'border-[var(--color-line)] hover:bg-[var(--color-parchment)]/50'"
              @click="respuestas[pregunta.id] = 'B'"
            >
              {{ pregunta.opcionB }}
            </button>
          </div>
        </div>
      </div>
      <button
        class="mt-5 w-full rounded-lg bg-[var(--color-sage)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        :disabled="!todasRespondidas || enviando"
        @click="enviar"
      >
        {{ enviando ? 'Enviando…' : 'Ver mi perfil' }}
      </button>
    </div>

    <div
      v-else
      class="rounded-2xl border border-[var(--color-line)] bg-white p-6"
    >
      <div class="mb-4 text-center">
        <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-spark)]/10 text-[var(--color-spark)]">
          <NavIcon
            name="trofeo"
            :size="26"
          />
        </div>
        <p class="mb-1 font-[family-name:var(--font-heading)] text-xl font-semibold">
          {{ resultado.categoriaDominante }}
        </p>
        <p class="text-sm text-[var(--color-ink)]/60">
          Tu estilo predominante
        </p>
      </div>
      <div class="mb-5 space-y-1.5">
        <div
          v-for="fila in categoriasDe(resultado.resultado)"
          :key="fila.categoria"
          class="flex items-center gap-2 text-sm"
        >
          <span class="w-28 shrink-0 truncate text-[var(--color-ink)]/60">{{ fila.categoria }}</span>
          <div class="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--color-parchment)]">
            <div
              class="h-full rounded-full bg-[var(--color-sage)]"
              :style="{ width: `${(fila.conteo / fila.max) * 100}%` }"
            />
          </div>
          <span class="w-4 shrink-0 text-right font-[family-name:var(--font-mono)] text-[var(--color-ink)]/60">{{ fila.conteo }}</span>
        </div>
      </div>
      <button
        class="w-full rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm hover:bg-[var(--color-parchment)]/50"
        @click="cerrar"
      >
        Volver a Test de Estilo
      </button>
    </div>

    <div
      v-if="miHistorial.length > 1"
      class="mt-4 rounded-2xl border border-[var(--color-line)] bg-white p-4"
    >
      <h3 class="mb-2 text-sm font-medium">
        Tus intentos anteriores
      </h3>
      <ul class="space-y-1 text-sm">
        <li
          v-for="intento in miHistorial"
          :key="intento.id"
          class="flex items-center justify-between"
        >
          <span class="font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink)]/40">
            {{ new Date(intento.createdAt).toLocaleDateString('es-CL') }}
          </span>
          <span class="text-[var(--color-ink)]/70">{{ intento.categoriaDominante }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>
