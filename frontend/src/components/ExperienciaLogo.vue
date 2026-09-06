<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { obtenerUrlLogoExperiencia } from '../api/perfilCoach'
import { iniciales } from '../lib/avatar'

// Casi ningún coach va a tener a mano el logo de cada empresa donde trabajó — el fallback de
// inicial (mismo tratamiento que ya usan las fotos de perfil sin foto) tiene que verse
// intencional, no como un ícono roto.
const props = defineProps<{ experienciaId: string; tieneLogo: boolean; empresa: string }>()

const url = ref<string | null>(null)

async function cargar() {
  url.value = props.tieneLogo ? await obtenerUrlLogoExperiencia(props.experienciaId) : null
}
onMounted(cargar)
watch(() => props.tieneLogo, cargar)
</script>

<template>
  <img
    v-if="url"
    :src="url"
    alt=""
    class="h-10 w-10 shrink-0 rounded-lg object-cover"
  >
  <div
    v-else
    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-parchment)] text-sm font-semibold text-[var(--color-ink)]/60"
  >
    {{ iniciales(empresa) }}
  </div>
</template>
