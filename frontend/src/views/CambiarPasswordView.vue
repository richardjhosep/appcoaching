<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { changeOwnPassword } from '../api/users'
import { ApiError } from '../api/client'

const router = useRouter()
const auth = useAuthStore()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const error = ref<string | null>(null)
const saving = ref(false)

function homeFor(role: string): string {
  if (role === 'coach') return '/coach/dashboard'
  if (role === 'coachee') return '/coachee/plan'
  return '/empresa/coachees'
}

async function guardar() {
  error.value = null
  if (newPassword.value.length < 8) {
    error.value = 'La nueva contraseña debe tener al menos 8 caracteres.'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Las contraseñas no coinciden.'
    return
  }
  saving.value = true
  try {
    await changeOwnPassword(currentPassword.value, newPassword.value)
    await auth.restoreSession()
    void router.replace(homeFor(auth.user?.role ?? 'coach'))
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo cambiar la contraseña.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
    <h1 class="mb-1 font-[family-name:var(--font-heading)] text-xl font-semibold">
      Cambia tu contraseña
    </h1>
    <p class="mb-6 text-sm text-[var(--color-ink)]/60">
      Por seguridad, antes de continuar debes cambiar la contraseña temporal que recibiste.
    </p>

    <form
      class="space-y-4"
      @submit.prevent="guardar"
    >
      <p
        v-if="error"
        class="rounded-lg bg-[var(--color-bronze)]/10 p-3 text-sm text-[var(--color-bronze)]"
      >
        {{ error }}
      </p>

      <label class="block text-sm">
        Contraseña temporal actual
        <input
          v-model="currentPassword"
          type="password"
          required
          class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
        >
      </label>

      <label class="block text-sm">
        Nueva contraseña
        <input
          v-model="newPassword"
          type="password"
          required
          minlength="8"
          class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
        >
      </label>

      <label class="block text-sm">
        Confirmar nueva contraseña
        <input
          v-model="confirmPassword"
          type="password"
          required
          minlength="8"
          class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
        >
      </label>

      <button
        type="submit"
        :disabled="saving"
        class="w-full rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm font-medium text-[var(--color-parchment)] disabled:opacity-60"
      >
        Cambiar contraseña
      </button>
    </form>
  </div>
</template>
