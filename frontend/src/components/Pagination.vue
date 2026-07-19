<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  page: number
  totalItems: number
  pageSize: number
}>()

const emit = defineEmits<{ 'update:page': [number] }>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.totalItems / props.pageSize)))
const rangeStart = computed(() => (props.totalItems === 0 ? 0 : (props.page - 1) * props.pageSize + 1))
const rangeEnd = computed(() => Math.min(props.totalItems, props.page * props.pageSize))

function go(page: number) {
  emit('update:page', Math.min(Math.max(1, page), totalPages.value))
}
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--color-ink)]/60">
    <span>Mostrando {{ rangeStart }}–{{ rangeEnd }} de {{ totalItems }} registro(s)</span>
    <div class="flex items-center gap-3">
      <button
        type="button"
        :disabled="page <= 1"
        class="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs disabled:opacity-40"
        @click="go(page - 1)"
      >
        ← Anterior
      </button>
      <span class="font-[family-name:var(--font-mono)] text-xs">Página {{ page }} de {{ totalPages }}</span>
      <button
        type="button"
        :disabled="page >= totalPages"
        class="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs disabled:opacity-40"
        @click="go(page + 1)"
      >
        Siguiente →
      </button>
    </div>
  </div>
</template>
