<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ApiError } from '../api/client'

const auth = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const loading = ref(false)

function homeFor(role: string): string {
  if (role === 'coach') return '/coach/planes'
  if (role === 'coachee') return '/coachee/plan'
  return '/no-disponible'
}

async function handleSubmit() {
  error.value = null
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    await router.push(homeFor(auth.user!.role))
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo iniciar sesión.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-[var(--color-ivory)] px-4">
    <form
      class="w-full max-w-sm rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-sm"
      @submit.prevent="handleSubmit"
    >
      <h1
        class="mb-1 font-[family-name:var(--font-heading)] text-xl font-semibold text-[var(--color-ink)]"
      >
        Coach Fernando Ramos
      </h1>
      <p class="mb-5 text-sm text-[var(--color-ink)]/70">
        Ingresa a tu cuenta
      </p>

      <label class="mb-3 block text-sm">
        Email
        <input
          v-model="email"
          type="email"
          required
          autocomplete="username"
          class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)]/40"
        >
      </label>

      <label class="mb-4 block text-sm">
        Contraseña
        <input
          v-model="password"
          type="password"
          required
          autocomplete="current-password"
          class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)]/40"
        >
      </label>

      <p
        v-if="error"
        class="mb-3 text-sm text-[var(--color-bronze)]"
      >
        {{ error }}
      </p>

      <button
        type="submit"
        :disabled="loading"
        class="w-full rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm font-medium text-[var(--color-parchment)] transition-colors hover:bg-[var(--color-ink)]/90 disabled:opacity-60"
      >
        {{ loading ? 'Ingresando…' : 'Ingresar' }}
      </button>
    </form>
  </div>
</template>
