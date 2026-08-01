<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { changeOwnPassword } from '../api/users'
import { ApiError } from '../api/client'
import { validateNewPassword } from '../lib/password'
import PasswordField from '../components/PasswordField.vue'
import PasswordStrengthMeter from '../components/PasswordStrengthMeter.vue'

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
  const complejidad = validateNewPassword(newPassword.value)
  if (complejidad) {
    error.value = complejidad
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
        class="rounded-lg bg-[var(--color-danger)]/10 p-3 text-sm text-[var(--color-danger)]"
      >
        {{ error }}
      </p>

      <PasswordField
        v-model="currentPassword"
        label="Contraseña temporal actual"
        autocomplete="current-password"
      />

      <div>
        <PasswordField
          v-model="newPassword"
          label="Nueva contraseña"
          autocomplete="new-password"
          :minlength="12"
        />
        <PasswordStrengthMeter :password="newPassword" />
      </div>

      <PasswordField
        v-model="confirmPassword"
        label="Confirmar nueva contraseña"
        autocomplete="new-password"
        :minlength="12"
      />

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
