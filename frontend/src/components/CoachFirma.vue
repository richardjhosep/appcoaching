<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getPerfilCoach, obtenerUrlFoto, type PerfilCoach } from '../api/perfilCoach'
import { iniciales } from '../lib/avatar'

// Foto + nombre del coach en documentos (certificado: 'firma'; informe de empresa: 'cabecera').
// Es un detalle de presentación: si el perfil o la foto no cargan, no se muestra nada.
withDefaults(defineProps<{ variante?: 'firma' | 'cabecera' }>(), { variante: 'firma' })

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
  <div
    v-if="perfil?.nombre"
    class="flex items-center gap-3"
    :class="variante === 'firma' ? 'flex-col text-center' : ''"
  >
    <img
      v-if="fotoUrl"
      :src="fotoUrl"
      alt=""
      class="shrink-0 rounded-full object-cover ring-2 ring-[var(--color-amber)]/60"
      :class="variante === 'firma' ? 'h-16 w-16' : 'h-11 w-11'"
    >
    <span
      v-else
      class="flex shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] font-semibold text-[var(--color-on-primary)]"
      :class="variante === 'firma' ? 'h-16 w-16 text-lg' : 'h-11 w-11 text-sm'"
      aria-hidden="true"
    >{{ iniciales(perfil.nombre) }}</span>
    <div
      class="min-w-0"
      :class="variante === 'cabecera' ? 'text-right' : ''"
    >
      <p class="text-xs text-[var(--color-muted)]">
        {{ variante === 'firma' ? 'Coach responsable del proceso' : 'Preparado por' }}
      </p>
      <p class="truncate font-[family-name:var(--font-display)] text-base font-medium text-[var(--color-ink)]">
        {{ perfil.nombre }}
      </p>
      <p
        v-if="perfil.titulo"
        class="truncate text-xs text-[var(--color-muted)]"
      >
        {{ perfil.titulo }}
      </p>
    </div>
  </div>
</template>
