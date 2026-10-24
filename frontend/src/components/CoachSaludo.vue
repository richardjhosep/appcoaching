<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { getPerfilCoach, obtenerUrlFoto, type PerfilCoach } from '../api/perfilCoach'
import { iniciales } from '../lib/avatar'

// Cara de "tu coach" junto al saludo del coachee. Es decorativo: si el perfil o la foto no
// cargan, simplemente no se muestra (no cuenta como fallo de la pantalla).
const perfil = ref<PerfilCoach | null>(null)
const fotoUrl = ref<string | null>(null)

onMounted(async () => {
  try {
    perfil.value = await getPerfilCoach()
    fotoUrl.value = perfil.value?.fotoPath ? await obtenerUrlFoto() : null
  } catch {
    perfil.value = null
  }
})
</script>

<template>
  <RouterLink
    v-if="perfil?.nombre"
    to="/coachee/mi-coach"
    class="flex items-center gap-3 rounded-full border border-[var(--color-line)] bg-white py-1.5 pl-1.5 pr-4 hover:bg-[var(--color-parchment)]/60"
  >
    <img
      v-if="fotoUrl"
      :src="fotoUrl"
      alt=""
      class="h-10 w-10 shrink-0 rounded-full object-cover"
    >
    <span
      v-else
      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-semibold text-[var(--color-on-primary)]"
      aria-hidden="true"
    >{{ iniciales(perfil.nombre) }}</span>
    <span class="min-w-0 text-xs leading-tight">
      <span class="block text-[var(--color-muted)]">Tu coach</span>
      <span class="block truncate text-sm font-medium text-[var(--color-ink)]">{{ perfil.nombre }}</span>
    </span>
  </RouterLink>
</template>
