<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import EmptyState from '../../../components/EmptyState.vue'
import NavIcon from '../../../components/NavIcon.vue'
import SkeletonBlock from '../../../components/SkeletonBlock.vue'
import {
  listFlashcardsDisponibles,
  registrarRepaso,
  type FlashcardConEstado,
  type ResultadoRepaso,
} from '../../../api/flashcards'
import { formatearFechaLimite } from '../../../lib/fechaLimite'

const loading = ref(true)
const mazo = ref<FlashcardConEstado[]>([])
const flipped = ref(false)
const revisadas = ref(0)
const sesionTerminada = ref(false)
const enviando = ref(false)

async function load() {
  loading.value = true
  const disponibles = await listFlashcardsDisponibles()
  mazo.value = disponibles.filter((f) => f.debeRepasar)
  flipped.value = false
  revisadas.value = 0
  sesionTerminada.value = mazo.value.length === 0
  loading.value = false
}

onMounted(load)

const actual = computed(() => mazo.value[0] ?? null)

function voltear() {
  flipped.value = !flipped.value
}

const opciones: { resultado: ResultadoRepaso; label: string; class: string }[] = [
  { resultado: 'olvidado', label: 'Olvidé', class: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/20' },
  { resultado: 'dificil', label: 'Difícil', class: 'bg-[var(--color-bronze)]/10 text-[var(--color-bronze)] hover:bg-[var(--color-bronze)]/20' },
  { resultado: 'facil', label: 'Fácil', class: 'bg-[var(--color-sage)]/10 text-[var(--color-sage)] hover:bg-[var(--color-sage)]/20' },
]

async function marcar(resultado: ResultadoRepaso) {
  if (!actual.value || enviando.value) return
  enviando.value = true
  try {
    await registrarRepaso(actual.value.id, resultado)
    revisadas.value += 1
    mazo.value = mazo.value.slice(1)
    flipped.value = false
    if (mazo.value.length === 0) sesionTerminada.value = true
  } finally {
    enviando.value = false
  }
}

function repasarDeNuevo() {
  load()
}
</script>

<template>
  <h1 class="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold">
    Flashcards
  </h1>

  <SkeletonBlock v-if="loading" />

  <EmptyState
    v-else-if="sesionTerminada && revisadas === 0"
    icon="flashcards"
    title="Ya repasaste todo por hoy"
    description="Vuelve mañana para seguir con tu racha de repaso."
  />

  <div
    v-else-if="sesionTerminada"
    class="mx-auto max-w-md rounded-2xl border border-[var(--color-line)] bg-white p-8 text-center"
  >
    <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-spark)]/10 text-[var(--color-spark)]">
      <NavIcon
        name="trofeo"
        :size="26"
      />
    </div>
    <p class="mb-1 font-[family-name:var(--font-heading)] text-2xl font-semibold">
      {{ revisadas }}
    </p>
    <p class="mb-5 text-sm text-[var(--color-ink)]/60">
      Flashcard{{ revisadas === 1 ? '' : 's' }} repasada{{ revisadas === 1 ? '' : 's' }} hoy
    </p>
    <button
      class="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm hover:bg-[var(--color-parchment)]/50"
      @click="repasarDeNuevo"
    >
      Actualizar
    </button>
  </div>

  <div
    v-else-if="actual"
    class="mx-auto max-w-md"
  >
    <p class="mb-3 text-center text-xs text-[var(--color-ink)]/50">
      Quedan {{ mazo.length }} · {{ actual.competencia?.nombre }}
      <span
        v-if="formatearFechaLimite(actual.fechaLimite)"
        class="text-[var(--color-bronze)]"
      >· {{ formatearFechaLimite(actual.fechaLimite) }}</span>
    </p>

    <div
      class="flip-card mb-5 h-56 cursor-pointer"
      :class="{ 'is-flipped': flipped }"
      @click="voltear"
    >
      <div class="flip-card-inner">
        <div class="flip-card-front flex items-center justify-center rounded-2xl border border-[var(--color-line)] bg-white p-6 text-center shadow-sm">
          <p class="font-[family-name:var(--font-heading)] text-lg font-medium">
            {{ actual.anverso }}
          </p>
        </div>
        <div class="flip-card-back flex items-center justify-center rounded-2xl border border-[var(--color-sage)]/40 bg-[var(--color-sage)]/5 p-6 text-center shadow-sm">
          <p class="text-base">
            {{ actual.reverso }}
          </p>
        </div>
      </div>
    </div>

    <p
      v-if="!flipped"
      class="mb-4 text-center text-xs text-[var(--color-ink)]/50"
    >
      Toca la tarjeta para ver la respuesta
    </p>

    <div
      v-else
      class="grid grid-cols-3 gap-2"
    >
      <button
        v-for="op in opciones"
        :key="op.resultado"
        class="rounded-lg py-2 text-sm font-medium disabled:opacity-60"
        :class="op.class"
        :disabled="enviando"
        @click="marcar(op.resultado)"
      >
        {{ op.label }}
      </button>
    </div>
  </div>
</template>
