<script setup lang="ts">
withDefaults(defineProps<{ icon: 'ver' | 'editar' | 'eliminar'; title: string; disabled?: boolean; to?: string }>(), {})
defineEmits<{ click: [] }>()
</script>

<template>
  <component
    :is="to ? 'RouterLink' : 'button'"
    :type="to ? undefined : 'button'"
    :disabled="to ? undefined : disabled"
    :to="to"
    :title="title"
    :aria-label="title"
    class="inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-40"
    :class="icon === 'eliminar'
      ? 'border-red-200 text-red-600 hover:bg-red-50'
      : 'border-[var(--color-line)] text-[var(--color-ink)]/70 hover:bg-[var(--color-parchment)]/60'"
    @click="$emit('click')"
  >
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <template v-if="icon === 'ver'">
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" /><circle
          cx="12"
          cy="12"
          r="3"
        />
      </template>
      <template v-else-if="icon === 'editar'">
        <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </template>
      <template v-else>
        <path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" />
      </template>
    </svg>
  </component>
</template>
