<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import AppShell from '../../components/AppShell.vue'
import EmptyState from '../../components/EmptyState.vue'
import NavIcon from '../../components/NavIcon.vue'
import {
  crearVersion,
  getEjercicioParaResponder,
  listEjerciciosDisponibles,
  misVersiones,
  type Ejercicio,
  type EjercicioResumen,
  type VersionEjercicio,
} from '../../api/ejercicios'
import { ApiError } from '../../api/client'
import { notifyError, notifySuccess } from '../../lib/notify'

const loading = ref(true)
const disponibles = ref<EjercicioResumen[]>([])

const ejercicioAbierto = ref<Ejercicio | null>(null)
const historial = ref<VersionEjercicio[]>([])
const form = reactive({ sabe: '', siente: '', haga: '' })
const enviando = ref(false)

async function load() {
  loading.value = true
  disponibles.value = await listEjerciciosDisponibles()
  loading.value = false
}

onMounted(load)

async function abrir(id: string) {
  const [ejercicio, versiones] = await Promise.all([
    getEjercicioParaResponder(id),
    misVersiones(id),
  ])
  ejercicioAbierto.value = ejercicio
  historial.value = versiones
  form.sabe = ''
  form.siente = ''
  form.haga = ''
}

function cerrar() {
  ejercicioAbierto.value = null
}

const puedeEnviar = computed(
  () => form.sabe.trim().length > 0 && form.siente.trim().length > 0 && form.haga.trim().length > 0,
)

async function enviar() {
  if (!ejercicioAbierto.value || !puedeEnviar.value) return
  enviando.value = true
  try {
    const version = await crearVersion(ejercicioAbierto.value.id, {
      sabe: form.sabe.trim(),
      siente: form.siente.trim(),
      haga: form.haga.trim(),
    })
    historial.value = [...historial.value, version]
    form.sabe = ''
    form.siente = ''
    form.haga = ''
    await load()
    await notifySuccess('Versión enviada')
  } catch (err) {
    await notifyError(
      'No se pudo enviar tu versión',
      err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.',
    )
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <AppShell>
    <h1 class="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold">
      Ejercicios de comunicación
    </h1>

    <div
      v-if="loading"
      class="text-sm text-[var(--color-ink)]/60"
    >
      Cargando…
    </div>

    <EmptyState
      v-else-if="!ejercicioAbierto && disponibles.length === 0"
      icon="ejercicios"
      title="Todavía no tienes ejercicios disponibles"
      description="Cuando tu coach publique uno, va a aparecer acá."
    />

    <div
      v-else-if="!ejercicioAbierto"
      class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      <button
        v-for="ejercicio in disponibles"
        :key="ejercicio.id"
        class="flex flex-col items-start gap-2 rounded-2xl border border-[var(--color-line)] bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--color-sage)] hover:shadow-md"
        @click="abrir(ejercicio.id)"
      >
        <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-parchment)] text-[var(--color-bronze)]">
          <NavIcon
            name="ejercicios"
            :size="20"
          />
        </div>
        <p class="text-sm font-medium">
          {{ ejercicio.titulo }}
        </p>
        <p
          v-if="ejercicio.competencia"
          class="text-xs text-[var(--color-ink)]/50"
        >
          {{ ejercicio.competencia.nombre }}
        </p>
        <p
          v-if="ejercicio.numeroVersiones > 0"
          class="text-xs text-[var(--color-ink)]/50"
        >
          {{ ejercicio.numeroVersiones }} versión{{ ejercicio.numeroVersiones === 1 ? '' : 'es' }} enviada{{ ejercicio.numeroVersiones === 1 ? '' : 's' }}
          <span
            v-if="ejercicio.ultimoEstado === 'con_feedback'"
            class="font-semibold text-[var(--color-sage)]"
          >· con feedback</span>
        </p>
      </button>
    </div>

    <div
      v-else
      class="mx-auto max-w-2xl"
    >
      <button
        class="mb-4 text-sm text-[var(--color-ink)]/60 hover:text-[var(--color-ink)] hover:underline"
        @click="cerrar"
      >
        ← Volver a Ejercicios
      </button>

      <div class="mb-4 rounded-2xl border border-[var(--color-line)] bg-white p-6">
        <h2 class="mb-2 font-[family-name:var(--font-heading)] text-lg font-semibold">
          {{ ejercicioAbierto.titulo }}
        </h2>
        <p class="mb-4 text-sm text-[var(--color-ink)]/70">
          {{ ejercicioAbierto.consigna }}
        </p>

        <div class="space-y-3">
          <label class="block text-sm">
            Sabe — ¿qué quieres que el destinatario sepa?
            <textarea
              v-model="form.sabe"
              rows="3"
              class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
            />
          </label>
          <label class="block text-sm">
            Siente — ¿qué quieres que sienta?
            <textarea
              v-model="form.siente"
              rows="3"
              class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
            />
          </label>
          <label class="block text-sm">
            Haga — ¿qué quieres que haga?
            <textarea
              v-model="form.haga"
              rows="3"
              class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
            />
          </label>
        </div>
        <button
          class="mt-4 w-full rounded-lg bg-[var(--color-sage)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          :disabled="!puedeEnviar || enviando"
          @click="enviar"
        >
          {{ enviando ? 'Enviando…' : `Enviar versión ${historial.length + 1}` }}
        </button>
      </div>

      <div
        v-if="historial.length"
        class="rounded-2xl border border-[var(--color-line)] bg-white p-6"
      >
        <h3 class="mb-3 text-sm font-medium">
          Tu historial
        </h3>
        <ul class="space-y-3 text-sm">
          <li
            v-for="version in [...historial].reverse()"
            :key="version.id"
            class="rounded-xl border border-[var(--color-line)]/60 p-3"
          >
            <p class="mb-2 font-medium">
              Versión {{ version.numeroVersion }}
            </p>
            <dl class="mb-2 space-y-1 text-xs text-[var(--color-ink)]/70">
              <div>
                <dt class="font-semibold">
                  Sabe
                </dt><dd>{{ version.sabe }}</dd>
              </div>
              <div>
                <dt class="font-semibold">
                  Siente
                </dt><dd>{{ version.siente }}</dd>
              </div>
              <div>
                <dt class="font-semibold">
                  Haga
                </dt><dd>{{ version.haga }}</dd>
              </div>
            </dl>
            <p
              v-if="version.comentarioCoach"
              class="rounded-lg bg-[var(--color-sage)]/10 p-2 text-xs text-[var(--color-sage)]"
            >
              <strong>Feedback del coach:</strong> {{ version.comentarioCoach }}
            </p>
            <p
              v-else
              class="text-xs text-[var(--color-ink)]/40"
            >
              Sin feedback todavía.
            </p>
          </li>
        </ul>
      </div>
    </div>
  </AppShell>
</template>
