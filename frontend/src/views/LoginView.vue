<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ApiError } from '../api/client'
import logoUrl from '../assets/logo.jpg'

const auth = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const loading = ref(false)

async function handleSubmit() {
  error.value = null
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    await router.push('/')
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo iniciar sesión.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div
    class="flex min-h-screen items-center justify-center px-4"
    style="background: radial-gradient(circle at 20% 20%, #1c2b20 0%, var(--color-ink) 55%, #0a0a0a 100%);"
  >
    <div class="w-full max-w-sm">
      <div class="mb-6 overflow-hidden rounded-2xl shadow-xl shadow-black/20">
        <img
          :src="logoUrl"
          alt="CoachOS — Gestiona tu práctica. Multiplica tu impacto."
          class="block w-full"
        >
      </div>

      <form
        class="rounded-2xl border border-white/10 bg-white p-7 shadow-xl shadow-black/20"
        @submit.prevent="handleSubmit"
      >
        <h1
          class="mb-1 font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--color-ink)]"
        >
          ¡Bienvenido de vuelta!
        </h1>
        <p class="mb-6 text-sm text-[var(--color-ink)]/60">
          Ingresa a tu cuenta de Coach Fernando Ramos
        </p>

        <label class="mb-4 block text-sm font-medium text-[var(--color-ink)]/80">
          Email
          <input
            v-model="email"
            type="email"
            required
            autocomplete="username"
            placeholder="tu@correo.com"
            class="mt-1.5 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-ivory)]/60 px-3 py-2.5 text-sm text-[var(--color-ink)] transition-shadow focus:border-[var(--color-sage)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)]/30"
          >
        </label>

        <label class="mb-5 block text-sm font-medium text-[var(--color-ink)]/80">
          Contraseña
          <input
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            placeholder="••••••••"
            class="mt-1.5 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-ivory)]/60 px-3 py-2.5 text-sm text-[var(--color-ink)] transition-shadow focus:border-[var(--color-sage)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)]/30"
          >
        </label>

        <p
          v-if="error"
          class="mb-4 rounded-lg bg-[var(--color-bronze)]/10 px-3 py-2 text-sm text-[var(--color-bronze)]"
        >
          {{ error }}
        </p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-lg bg-[var(--color-ink)] px-4 py-2.5 text-sm font-medium text-[var(--color-parchment)] transition-colors hover:bg-[var(--color-ink)]/85 disabled:opacity-60"
        >
          {{ loading ? 'Ingresando…' : 'Ingresar' }}
        </button>
      </form>

      <p class="mt-6 text-center text-xs text-white/40">
        CoachOS · Plataforma de acompañamiento
      </p>
    </div>
  </div>
</template>
