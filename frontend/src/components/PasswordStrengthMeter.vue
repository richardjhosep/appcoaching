<script setup lang="ts">
import { computed } from 'vue'
import { passwordRules, passwordStrength, type PasswordStrength } from '../lib/password'

const props = defineProps<{ password: string }>()

const rules = computed(() => passwordRules(props.password))
const strength = computed(() => passwordStrength(props.password))

const STRENGTH_LABEL: Record<PasswordStrength, string> = {
  debil: 'Débil',
  media: 'Media',
  fuerte: 'Fuerte',
}
const STRENGTH_BAR_CLASS: Record<PasswordStrength, string> = {
  debil: 'bg-[var(--color-bronze)]',
  media: 'bg-amber-500',
  fuerte: 'bg-[var(--color-sage)]',
}
const STRENGTH_TEXT_CLASS: Record<PasswordStrength, string> = {
  debil: 'text-[var(--color-bronze)]',
  media: 'text-amber-600',
  fuerte: 'text-[var(--color-sage)]',
}

const strengthWidth = computed(() => {
  const passed = rules.value.filter((r) => r.passes).length
  return `${(passed / rules.value.length) * 100}%`
})
</script>

<template>
  <div
    v-if="password"
    class="mt-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-parchment)]/40 p-3"
  >
    <ul class="space-y-1 text-xs">
      <li
        v-for="rule in rules"
        :key="rule.label"
        class="flex items-center gap-2"
        :class="rule.passes ? 'text-[var(--color-sage)]' : 'text-[var(--color-ink)]/50'"
      >
        <span aria-hidden="true">{{ rule.passes ? '✓' : '✗' }}</span>
        {{ rule.label }}
      </li>
    </ul>
    <div class="mt-3 flex items-center gap-2">
      <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-line)]">
        <div
          class="h-full rounded-full transition-all duration-200"
          :class="STRENGTH_BAR_CLASS[strength]"
          :style="{ width: strengthWidth }"
        />
      </div>
      <span
        class="text-xs font-medium"
        :class="STRENGTH_TEXT_CLASS[strength]"
      >{{ STRENGTH_LABEL[strength] }}</span>
    </div>
  </div>
</template>
