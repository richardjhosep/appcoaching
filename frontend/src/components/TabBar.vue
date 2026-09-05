<script setup lang="ts" generic="T extends string">
import NavIcon from './NavIcon.vue'

// Barra de pestañas compartida — reemplaza tanto el toggle en píldora (antes solo en
// ComercialTab/FinanzasView) como las pestañas subrayadas (Negocio/Legal/detalle de
// coachee): mismo contenedor "glass" (fondo traslúcido + blur), ícono opcional por pestaña,
// y una pestaña activa con fondo sólido — más una insignia opcional para cuando la pestaña
// representa un conteo (ej. alertas pendientes). Genérico sobre `T` para que cada vista
// mantenga su propio union type de claves sin castear.
defineProps<{
  tabs: Array<{ key: T; label: string; icon?: string; badge?: number | null }>
  modelValue: T
}>()
defineEmits<{ 'update:modelValue': [T] }>()
</script>

<template>
  <div class="inline-flex flex-wrap gap-1 rounded-full bg-[var(--color-parchment)]/70 p-1 shadow-sm ring-1 ring-white/60 backdrop-blur-sm">
    <button
      v-for="t in tabs"
      :key="t.key"
      type="button"
      class="flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors"
      :class="modelValue === t.key
        ? 'bg-[var(--color-ink)] text-[var(--color-parchment)] shadow-sm'
        : 'text-[var(--color-ink)]/70 hover:bg-white/50'"
      @click="$emit('update:modelValue', t.key)"
    >
      <NavIcon
        v-if="t.icon"
        :name="t.icon"
        :size="15"
      />
      {{ t.label }}
      <span
        v-if="t.badge != null"
        class="rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none"
        :class="modelValue === t.key ? 'bg-white/20' : 'bg-[var(--color-ink)]/10 text-[var(--color-ink)]/70'"
      >
        {{ t.badge }}
      </span>
    </button>
  </div>
</template>
