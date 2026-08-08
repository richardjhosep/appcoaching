<script setup lang="ts">
import NavIcon from './NavIcon.vue'

withDefaults(defineProps<{ label: string; to?: string }>(), {})
defineEmits<{ click: [] }>()
</script>

<template>
  <component
    :is="to ? 'RouterLink' : 'button'"
    :type="to ? undefined : 'button'"
    :to="to"
    class="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm text-[var(--color-ink)]/70 transition-colors hover:border-[var(--color-sage)] hover:text-[var(--color-sage)]"
    @click="!to && $emit('click')"
  >
    <NavIcon
      name="flecha-izquierda"
      :size="14"
    />
    {{ label }}
  </component>
</template>
