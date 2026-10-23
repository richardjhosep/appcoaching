<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue'

withDefaults(defineProps<{ title: string; size?: 'md' | 'lg' }>(), { size: 'md' })
const emit = defineEmits<{ close: [] }>()

const titleId = useId()
const dialog = ref<HTMLElement | null>(null)
let anterior: HTMLElement | null = null
let overflowPrevio = ''

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function enfocables(): HTMLElement[] {
  return dialog.value ? Array.from(dialog.value.querySelectorAll<HTMLElement>(FOCUSABLE)) : []
}

// Escape cierra; Tab/Shift+Tab quedan atrapados dentro del diálogo.
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.stopPropagation()
    emit('close')
    return
  }
  if (e.key !== 'Tab') return
  const items = enfocables()
  if (!items.length) {
    e.preventDefault()
    return
  }
  const first = items[0]
  const last = items[items.length - 1]
  const activo = document.activeElement
  if (e.shiftKey && (activo === first || !dialog.value?.contains(activo))) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && (activo === last || !dialog.value?.contains(activo))) {
    e.preventDefault()
    first.focus()
  }
}

onMounted(async () => {
  anterior = document.activeElement as HTMLElement | null
  overflowPrevio = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  document.addEventListener('keydown', onKeydown)
  await nextTick()
  // Foco inicial en el primer campo; si no hay, en el diálogo mismo.
  const campo = dialog.value?.querySelector<HTMLElement>('input:not([type="hidden"]), select, textarea')
  ;(campo ?? dialog.value)?.focus()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = overflowPrevio
  anterior?.focus?.()
})
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[var(--color-scrim)] px-4 py-8 sm:items-center"
      @click.self="emit('close')"
    >
      <div
        ref="dialog"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
        class="w-full rounded-2xl bg-white p-6 shadow-xl focus:outline-none"
        :class="size === 'lg' ? 'max-w-2xl' : 'max-w-lg'"
      >
        <div class="mb-4 flex items-center justify-between">
          <h2
            :id="titleId"
            class="font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--color-ink)]"
          >
            {{ title }}
          </h2>
          <button
            aria-label="Cerrar"
            class="flex h-11 w-11 items-center justify-center rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-parchment)]/60 hover:text-[var(--color-ink)] sm:h-9 sm:w-9"
            @click="emit('close')"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              aria-hidden="true"
            ><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <slot />
      </div>
    </div>
  </Teleport>
</template>
