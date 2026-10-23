<script setup lang="ts">
import { computed, useId } from 'vue'

// Etiqueta + control + ayuda/error con los ids ya cableados (aria-describedby/aria-invalid).
// Uso:
//   <FormField label="Email" :error="errors.email" v-slot="{ id, describedby, invalid }">
//     <input :id="id" v-model="email" class="field-input" :aria-describedby="describedby" :aria-invalid="invalid" />
//   </FormField>
const props = withDefaults(defineProps<{ label: string; error?: string | null; hint?: string }>(), {
  error: null,
  hint: undefined,
})

const id = useId()
const hintId = `${id}-hint`
const errorId = `${id}-error`
const describedby = computed(() => {
  const ids = []
  if (props.hint) ids.push(hintId)
  if (props.error) ids.push(errorId)
  return ids.length ? ids.join(' ') : undefined
})
const invalid = computed(() => (props.error ? true : undefined))
</script>

<template>
  <div class="block">
    <label
      :for="id"
      class="text-sm font-medium text-[var(--color-ink)]"
    >{{ label }}</label>
    <div class="mt-1">
      <slot
        :id="id"
        :describedby="describedby"
        :invalid="invalid"
      />
    </div>
    <p
      v-if="hint"
      :id="hintId"
      class="mt-1 text-xs text-[var(--color-muted)]"
    >
      {{ hint }}
    </p>
    <p
      v-if="error"
      :id="errorId"
      role="alert"
      class="mt-1 text-xs text-[var(--color-danger)]"
    >
      {{ error }}
    </p>
  </div>
</template>
