<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  modelValue: string
  label: string
  autocomplete?: string
  minlength?: number
  invalid?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()

const visible = ref(false)
</script>

<template>
  <label class="block text-sm">
    {{ label }}
    <div class="relative mt-1">
      <input
        :value="modelValue"
        :type="visible ? 'text' : 'password'"
        required
        :minlength="minlength"
        :autocomplete="autocomplete"
        class="w-full rounded-lg border px-3 py-2 pr-10 text-sm"
        :class="invalid ? 'border-[var(--color-danger)]' : 'border-[var(--color-line)]'"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      >
      <button
        type="button"
        :aria-label="visible ? 'Ocultar contraseña' : 'Mostrar contraseña'"
        class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--color-ink)]/40 hover:text-[var(--color-ink)]"
        @click="visible = !visible"
      >
        <svg
          v-if="visible"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
          <circle
            cx="12"
            cy="12"
            r="3"
          />
          <path d="M4 4l16 16" />
        </svg>
        <svg
          v-else
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
          <circle
            cx="12"
            cy="12"
            r="3"
          />
        </svg>
      </button>
    </div>
    <slot />
  </label>
</template>
