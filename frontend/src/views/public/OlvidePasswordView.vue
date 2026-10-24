<script setup lang="ts">
import { ref } from 'vue'
import { forgotPassword } from '../../api/auth'
import { ApiError } from '../../api/client'

const email = ref('')
const enviado = ref(false)
const enviando = ref(false)
const error = ref<string | null>(null)

async function enviar() {
  error.value = null
  enviando.value = true
  try {
    await forgotPassword(email.value)
    // Respuesta genérica a propósito — el backend siempre dice "éxito" exista
    // o no la cuenta, para no revelar qué correos están registrados.
    enviado.value = true
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo procesar la solicitud. Intenta de nuevo.'
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-[var(--color-parchment)] p-4">
    <div class="w-full max-w-sm rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-sm">
      <template v-if="enviado">
        <h1 class="mb-2 font-[family-name:var(--font-heading)] text-lg font-semibold">
          Revisa tu correo
        </h1>
        <p class="text-sm text-[var(--color-ink)]/70">
          Si <strong>{{ email }}</strong> está registrado en CoachNexus, te enviamos un enlace para
          elegir una nueva contraseña. Es válido por 60 minutos.
        </p>
      </template>

      <template v-else>
        <h1 class="mb-1 font-[family-name:var(--font-heading)] text-lg font-semibold">
          ¿Olvidaste tu contraseña?
        </h1>
        <p class="mb-6 text-sm text-[var(--color-muted)]">
          Ingresa tu correo y te enviamos un enlace para elegir una nueva.
        </p>

        <form
          class="space-y-4"
          @submit.prevent="enviar"
        >
          <p
            v-if="error"
            class="rounded-lg bg-[var(--color-danger)]/10 p-3 text-sm text-[var(--color-danger)]"
          >
            {{ error }}
          </p>

          <label class="block text-sm">
            Email
            <input
              v-model="email"
              type="email"
              required
              autocomplete="username"
              placeholder="tu@correo.com"
              class="mt-1.5 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
            >
          </label>

          <button
            type="submit"
            :disabled="enviando"
            class="w-full rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-on-primary)] disabled:opacity-60"
          >
            {{ enviando ? 'Enviando…' : 'Enviar enlace' }}
          </button>
        </form>
      </template>

      <RouterLink
        to="/login"
        class="mt-6 block text-center text-xs font-medium text-[var(--color-sage)] hover:underline"
      >
        Volver a iniciar sesión
      </RouterLink>
    </div>
  </div>
</template>
