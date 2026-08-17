<script setup lang="ts">
import NavIcon from './NavIcon.vue'

withDefaults(defineProps<{ title?: string; icon?: string }>(), {
  title: undefined,
  icon: undefined,
})
</script>

<template>
  <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
    <div
      v-if="title"
      class="mb-3 flex items-center gap-2.5"
    >
      <div
        v-if="icon"
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-parchment)] text-[var(--color-bronze)]"
      >
        <NavIcon
          :name="icon"
          :size="16"
        />
      </div>
      <h2 class="font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--color-ink)]">
        {{ title }}
      </h2>
    </div>
    <slot />
  </div>
</template>
