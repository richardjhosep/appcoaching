<script setup lang="ts">
import AppButton from './AppButton.vue'

withDefaults(defineProps<{ title?: string; description?: string; retryLabel?: string }>(), {
  title: 'No pudimos cargar la información',
  description: 'Revisa tu conexión e inténtalo de nuevo.',
  retryLabel: 'Reintentar',
})
defineEmits<{ retry: [] }>()
</script>

<template>
  <div
    role="alert"
    class="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--color-danger)]/40 bg-white px-6 py-10 text-center"
  >
    <div class="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-danger)]/10 text-[var(--color-danger)]">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      ><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
    </div>
    <p class="font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--color-ink)]">
      {{ title }}
    </p>
    <p class="max-w-sm text-sm text-[var(--color-muted)]">
      {{ description }}
    </p>
    <AppButton
      variant="secondary"
      @click="$emit('retry')"
    >
      {{ retryLabel }}
    </AppButton>
  </div>
</template>
