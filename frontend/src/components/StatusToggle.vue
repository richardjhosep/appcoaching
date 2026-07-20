<script setup lang="ts">
defineProps<{ active: boolean; disabled?: boolean }>()
const emit = defineEmits<{ toggle: [] }>()
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    class="flex items-center gap-2 disabled:opacity-50"
    @click="emit('toggle')"
  >
    <span
      class="relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors"
      :class="active ? 'bg-[var(--color-sage)]' : 'bg-[var(--color-line)]'"
    >
      <span
        class="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
        :class="active ? 'translate-x-4' : 'translate-x-0.5'"
      />
    </span>
    <span
      class="text-xs"
      :class="active ? 'text-[var(--color-sage)]' : 'text-[var(--color-ink)]/50'"
    >
      {{ active ? 'Activo' : 'Inactivo' }}
    </span>
  </button>
</template>
