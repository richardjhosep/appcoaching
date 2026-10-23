<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { resetPassword } from '../../api/auth'
import { ApiError } from '../../api/client'
import { validateNewPassword } from '../../lib/password'
import PasswordField from '../../components/PasswordField.vue'
import PasswordStrengthMeter from '../../components/PasswordStrengthMeter.vue'

const props = defineProps<{ token: string }>()
const router = useRouter()

const newPassword = ref('')
const confirmPassword = ref('')
const error = ref<string | null>(null)
const saving = ref(false)
const listo = ref(false)

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
    await resetPassword(props.token, newPassword.value)
    listo.value = true
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo restablecer la contraseña.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-[var(--color-parchment)] p-4">
    <div class="w-full max-w-sm rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-sm">
      <template v-if="listo">
        <h1 class="mb-2 font-[family-name:var(--font-heading)] text-lg font-semibold">
          Contraseña actualizada
        </h1>
        <p class="mb-6 text-sm text-[var(--color-ink)]/70">
          Ya puedes ingresar con tu nueva contraseña.
        </p>
        <button
          type="button"
          class="w-full rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm font-medium text-[var(--color-parchment)]"
          @click="router.replace('/login')"
        >
          Ir a iniciar sesión
        </button>
      </template>

      <template v-else>
        <h1 class="mb-1 font-[family-name:var(--font-heading)] text-lg font-semibold">
          Elige una nueva contraseña
        </h1>
        <p class="mb-6 text-sm text-[var(--color-muted)]">
          Este enlace es de un solo uso y vale por 60 minutos desde que lo pediste.
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
            <RouterLink
              v-if="error.includes('no es válido') || error.includes('expiró')"
              to="/olvide-password"
              class="block underline"
            >
              Pedir un enlace nuevo
            </RouterLink>
          </p>

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
            {{ saving ? 'Guardando…' : 'Cambiar contraseña' }}
          </button>
        </form>
      </template>
    </div>
  </div>
</template>
