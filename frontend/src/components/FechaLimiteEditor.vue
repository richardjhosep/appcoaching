<script setup lang="ts">
// Control inline reusado en los 6 módulos de estudio/retos (Quiz, Flashcards, Mapas,
// Ejercicios, Test de Estilo, Recursos) para poner/cambiar/quitar la fecha límite de un
// ítem ya creado — mismo campo que el form de creación, pero editable después.
import { ref, watch } from 'vue'
import { aInputDate, formatearFechaLimite } from '../lib/fechaLimite'

const props = defineProps<{ fechaLimite: string | null; guardando?: boolean }>()
const emit = defineEmits<{ guardar: [string | null] }>()

const valor = ref(aInputDate(props.fechaLimite))
watch(
  () => props.fechaLimite,
  (v) => {
    valor.value = aInputDate(v)
  },
)

function guardar() {
  emit('guardar', valor.value || null)
}

function quitar() {
  valor.value = ''
  emit('guardar', null)
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2 text-xs">
    <span class="text-[var(--color-ink)]/50">
      {{ formatearFechaLimite(fechaLimite) ?? 'Sin fecha límite' }}
    </span>
    <input
      v-model="valor"
      type="date"
      class="rounded border border-[var(--color-line)] px-2 py-1"
    >
    <button
      class="text-[var(--color-bronze)] hover:underline disabled:opacity-60"
      :disabled="guardando"
      @click="guardar"
    >
      Guardar
    </button>
    <button
      v-if="fechaLimite"
      class="text-[var(--color-ink)]/40 hover:underline disabled:opacity-60"
      :disabled="guardando"
      @click="quitar"
    >
      Quitar
    </button>
  </div>
</template>
